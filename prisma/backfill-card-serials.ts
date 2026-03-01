import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatCardSerial(prefix: string | null, sequence: number) {
  const normalizedPrefix = (prefix || "MEM").trim().toUpperCase();
  return `${normalizedPrefix}${String(sequence).padStart(4, "0")}`;
}

function parseSequence(cardSerial: string | null) {
  if (!cardSerial) return null;
  const match = cardSerial.match(/(\d+)$/);
  if (!match) return null;

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

async function main() {
  const cafes = await prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      cardPrefix: true,
      nextCardSeq: true,
      cards: {
        select: { id: true, cardSerial: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  for (const cafe of cafes) {
    const result = await prisma.$transaction(async (tx) => {
      const used = new Set<number>();
      const keepIds = new Set<string>();
      const needsReassign: Array<{ id: string }> = [];

      for (const card of cafe.cards) {
        const sequence = parseSequence(card.cardSerial);
        if (!sequence) {
          needsReassign.push({ id: card.id });
          continue;
        }
        if (used.has(sequence)) {
          needsReassign.push({ id: card.id });
          continue;
        }
        used.add(sequence);
        keepIds.add(card.id);
      }

      let pointer = 1;
      const nextFreeSequence = () => {
        while (used.has(pointer)) pointer += 1;
        const selected = pointer;
        used.add(selected);
        pointer += 1;
        return selected;
      };

      for (const card of needsReassign) {
        const sequence = nextFreeSequence();
        const serial = formatCardSerial(cafe.cardPrefix, sequence);
        await tx.loyaltyCard.update({
          where: { id: card.id },
          data: { cardSerial: serial },
        });
      }

      const highestSequence = used.size > 0 ? Math.max(...used) : 0;
      const nextCardSeq = highestSequence + 1;

      await tx.cafe.update({
        where: { id: cafe.id },
        data: { nextCardSeq },
      });

      return {
        reassigned: needsReassign.length,
        kept: keepIds.size,
        nextCardSeq,
      };
    });

    console.log(
      `[backfill] ${cafe.name}: kept=${result.kept}, reassigned=${result.reassigned}, next=${result.nextCardSeq}`,
    );
  }
}

main()
  .catch((error) => {
    console.error("[backfill] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
