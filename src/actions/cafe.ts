// file: src/actions/cafe.ts
"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

type JoinCafeResult =
  | { success: true; cardId: string; cardSerial: string | null }
  | { success: false; error: string };

type CafeDetailsResult = Awaited<ReturnType<typeof db.cafe.findUnique>> | null;

type ReserveResult =
  | { success: true }
  | { success: false; error: string };

function formatCardSerial(prefix: string | null | undefined, sequence: number): string {
  const normalizedPrefix = (prefix ?? "MEM").trim().toUpperCase();
  const padded = String(sequence).padStart(4, "0");
  return `${normalizedPrefix}${padded}`;
}

async function allocateNextCardSerial(
  tx: Prisma.TransactionClient,
  cafeId: string
): Promise<string> {
  const updated = await tx.cafe.update({
    where: { id: cafeId },
    data: { nextCardSeq: { increment: 1 } },
    select: {
      cardPrefix: true,
      nextCardSeq: true
    }
  });

  const allocatedSeq = (updated.nextCardSeq ?? 1) - 1;
  return formatCardSerial(updated.cardPrefix, allocatedSeq);
}

export async function joinCafeWithSerial(cafeId: string): Promise<JoinCafeResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db.$transaction(async (tx) => {
      const cafeExists = await tx.cafe.findUnique({
        where: { id: cafeId },
        select: { id: true }
      });

      if (!cafeExists) {
        throw new Error("Cafe not found");
      }

      const existing = await tx.loyaltyCard.findUnique({
        where: {
          userId_cafeId: {
            userId: session.userId,
            cafeId
          }
        }
      });

      if (existing?.cardSerial) {
        return existing;
      }

      const cardSerial = await allocateNextCardSerial(tx, cafeId);

      if (existing) {
        return tx.loyaltyCard.update({
          where: { id: existing.id },
          data: { cardSerial }
        });
      }

      return tx.loyaltyCard.create({
        data: {
          userId: session.userId,
          cafeId,
          cardSerial,
          stamps: 0,
          maxStamps: 10,
          tier: "Silver",
          balance: 0
        }
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cards");
    revalidatePath(`/dashboard/cafe/${cafeId}`);

    return {
      success: true,
      cardId: result.id,
      cardSerial: result.cardSerial ?? null
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("joinCafeWithSerial error:", error);
    return { success: false, error: "Unable to join cafe" };
  }
}

export async function getCafeDetails(cafeId: string): Promise<CafeDetailsResult> {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  const cafe = await db.cafe.findUnique({
    where: { id: cafeId },
    include: {
      cards: {
        where: { userId: session.userId },
        take: 1
      }
    }
  });

  return cafe;
}

export async function reserveTable(
  cafeId: string,
  date: Date,
  guests: number
): Promise<ReserveResult> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.reservation.create({
      data: {
        userId: session.userId,
        cafeId,
        date,
        guests,
        status: "CONFIRMED"
      }
    });

    revalidatePath(`/dashboard/cafe/${cafeId}`);
    revalidatePath("/dashboard/reserve");

    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("reserveTable error:", error);
    return { success: false, error: "Unable to create reservation" };
  }
}