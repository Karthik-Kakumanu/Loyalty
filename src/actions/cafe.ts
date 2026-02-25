"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// 1. JOIN CAFE & GENERATE UNIQUE SERIAL CARD (CR0001, XX0013)
export async function joinCafeWithSerial(cafeId: string) {
  try {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: "Unauthorized" };

    // Use a transaction to ensure atomic updates (no duplicate IDs)
    const result = await db.$transaction(async (tx) => {
      // Check if already a member
      const existing = await tx.loyaltyCard.findUnique({
        where: {
          userId_cafeId: { userId: session.userId, cafeId }
        }
      });

      if (existing) return existing; // Return existing card if found

      // A. Get Cafe details for Prefix and Sequence
      const cafe = await tx.cafe.findUnique({ where: { id: cafeId } });
      if (!cafe) throw new Error("Cafe not found");

      // B. Generate Serial (e.g., "CR" + "0001")
      const prefix = cafe.cardPrefix || "MEM";
      const sequence = String(cafe.nextCardSeq).padStart(4, '0');
      const serialNumber = `${prefix}${sequence}`;

      // C. Create the Card
      const newCard = await tx.loyaltyCard.create({
        data: {
          userId: session.userId,
          cafeId: cafe.id,
          cardSerial: serialNumber,
          stamps: 0,
          maxStamps: 10,
          tier: "Silver",
          balance: 0
        }
      });

      // D. Increment the Cafe's sequence for the NEXT person
      await tx.cafe.update({
        where: { id: cafeId },
        data: { nextCardSeq: { increment: 1 } }
      });

      return newCard;
    });

    revalidatePath("/dashboard");
    return { success: true, cardId: result.id };

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
  } catch (error) {
    return { success: false, error: "Reservation failed" };
  }
}