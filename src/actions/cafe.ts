// file: src/actions/cafe.ts
"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { cafeIdSchema, reservationPayloadSchema } from "@/lib/validation/cafe";

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
  const parsedCafeId = cafeIdSchema.safeParse(cafeId);
  if (!parsedCafeId.success) {
    return { success: false, error: "Invalid cafe id." };
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db.$transaction(async (tx) => {
      const cafeExists = await tx.cafe.findUnique({
        where: { id: parsedCafeId.data },
        select: { id: true }
      });

      if (!cafeExists) {
        throw new Error("Cafe not found");
      }

      const existing = await tx.loyaltyCard.findUnique({
        where: {
          userId_cafeId: {
            userId: session.userId,
            cafeId: parsedCafeId.data
          }
        }
      });

      if (existing?.cardSerial) {
        return existing;
      }

      const cardSerial = await allocateNextCardSerial(tx, parsedCafeId.data);

      if (existing) {
        return tx.loyaltyCard.update({
          where: { id: existing.id },
          data: { cardSerial }
        });
      }

      return tx.loyaltyCard.create({
        data: {
          userId: session.userId,
          cafeId: parsedCafeId.data,
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
    revalidatePath(`/dashboard/cafe/${parsedCafeId.data}`);

    return {
      success: true,
      cardId: result.id,
      cardSerial: result.cardSerial ?? null
    };
  } catch (error) {
    console.error("joinCafeWithSerial error:", error);
    return { success: false, error: "Unable to join cafe" };
  }
}

export async function getCafeDetails(cafeId: string): Promise<CafeDetailsResult> {
  const parsedCafeId = cafeIdSchema.safeParse(cafeId);
  if (!parsedCafeId.success) return null;

  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  const cafe = await db.cafe.findUnique({
    where: { id: parsedCafeId.data },
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
  const parsed = reservationPayloadSchema.safeParse({ cafeId, date, guests });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid reservation request." };
  }

  try {
    const session = await getSession();
    if (!session?.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const targetDate = parsed.data.date;
    const windowStart = new Date(targetDate);
    windowStart.setMinutes(0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setHours(windowEnd.getHours() + 1);

    const canReserve = await db.$transaction(async (tx) => {
      const cafe = await tx.cafe.findUnique({
        where: { id: parsed.data.cafeId },
        select: { totalTables: true },
      });

      if (!cafe) {
        return { ok: false, error: "Cafe not found." } as const;
      }

      const existingReservations = await tx.reservation.count({
        where: {
          cafeId: parsed.data.cafeId,
          status: "CONFIRMED",
          date: {
            gte: windowStart,
            lt: windowEnd,
          },
        },
      });

      if (existingReservations >= cafe.totalTables) {
        return { ok: false, error: "No tables available for that time slot." } as const;
      }

      await tx.reservation.create({
        data: {
          userId: session.userId,
          cafeId: parsed.data.cafeId,
          date: targetDate,
          guests: parsed.data.guests,
          status: "CONFIRMED",
        },
      });

      return { ok: true } as const;
    });

    if (!canReserve.ok) {
      return { success: false, error: canReserve.error };
    }

    revalidatePath(`/dashboard/cafe/${parsed.data.cafeId}`);
    revalidatePath("/dashboard/reserve");

    return { success: true };
  } catch (error) {
    console.error("reserveTable error:", error);
    return { success: false, error: "Unable to create reservation" };
  }
}
