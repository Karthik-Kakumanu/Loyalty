"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

function formatCardSerial(prefix: string | null | undefined, sequence: number) {
  const normalizedPrefix = (prefix || "MEM").trim().toUpperCase();
  return `${normalizedPrefix}${String(sequence).padStart(4, "0")}`;
}

async function allocateNextCardSerial(tx: Prisma.TransactionClient, cafeId: string) {
  const updatedCafe = await tx.cafe.update({
    where: { id: cafeId },
    data: { nextCardSeq: { increment: 1 } },
    select: { cardPrefix: true, nextCardSeq: true },
  });

  // nextCardSeq is already incremented; allocated sequence is the previous value.
  return formatCardSerial(updatedCafe.cardPrefix, updatedCafe.nextCardSeq - 1);
}

// 1. JOIN CAFE & GENERATE UNIQUE SERIAL CARD (CR0001, XX0013)
export async function joinCafeWithSerial(cafeId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: "Unauthorized" };

    // Use one transaction so sequence allocation and card creation are always consistent.
    const result = await db.$transaction(async (tx) => {
      const cafeExists = await tx.cafe.findUnique({
        where: { id: cafeId },
        select: { id: true },
      });
      if (!cafeExists) throw new Error("Cafe not found");

      // Check if already a member.
      const existing = await tx.loyaltyCard.findUnique({
        where: {
          userId_cafeId: { userId: session.userId, cafeId },
        },
      });

      if (existing?.cardSerial) {
        return existing;
      }

      // Allocate serial atomically from cafe.nextCardSeq.
      const serialNumber = await allocateNextCardSerial(tx, cafeId);

      if (existing) {
        return tx.loyaltyCard.update({
          where: { id: existing.id },
          data: { cardSerial: serialNumber },
        });
      }

      // Create membership card.
      const newCard = await tx.loyaltyCard.create({
        data: {
          userId: session.userId,
          cafeId,
          cardSerial: serialNumber,
          stamps: 0,
          maxStamps: 10,
          tier: "Silver",
          balance: 0,
        },
      });

      return newCard;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cards");
    revalidatePath(`/dashboard/cafe/${cafeId}`);
    return { success: true, cardId: result.id, cardSerial: result.cardSerial };

  } catch (error) {
    console.error("Join Error:", error);
    return { success: false, error: "System error while joining" };
  }
}

// 2. GET CAFE DETAILS (With membership status)
export async function getCafeDetails(cafeId: string) {
  const session = await getSession();
  if (!session) return null;
  
  const cafe = await db.cafe.findUnique({
    where: { id: cafeId },
    include: {
      // Check if user has a card here
      cards: {
        where: { userId: session.userId },
        take: 1
      }
    }
  });

  return cafe;
}

// 3. RESERVE TABLE
export async function reserveTable(cafeId: string, date: Date, guests: number) {
  try {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: "Unauthorized" };

    await db.reservation.create({
      data: {
        userId: session.userId,
        cafeId,
        date,
        guests,
        status: "CONFIRMED" // In real world, maybe PENDING
      }
    });

    revalidatePath(`/dashboard/cafe/${cafeId}`);
    revalidatePath(`/dashboard/reserve`);
    return { success: true };
  } catch {
    return { success: false, error: "Reservation failed" };
  }
}
