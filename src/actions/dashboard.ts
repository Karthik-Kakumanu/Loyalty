"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// 1. Get Dashboard Data
export async function getDashboardData() {
  try {
    const session = await getSession();
    if (!session) return { myCards: [], trending: [], allCafes: [], user: null };

    // Fetch User's Active Cards
    const myCards = await db.loyaltyCard.findMany({
      where: { userId: session.userId },
      include: { 
        cafe: {
          select: { id: true, name: true, image: true, rating: true, lat: true, lng: true, address: true }
        } 
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Fetch Trending Cafes
    const trending = await db.cafe.findMany({
      orderBy: { visitCount: "desc" },
      take: 5,
      select: { id: true, name: true, image: true, rating: true, address: true, lat: true, lng: true }
    });

    // Fetch Nearby Candidates
    const allCafes = await db.cafe.findMany({
      take: 20,
      select: { id: true, name: true, image: true, lat: true, lng: true, rating: true, address: true }
    });

    return { myCards, trending, allCafes, user: session };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return empty structure instead of null so UI doesn't crash
    return { myCards: [], trending: [], allCafes: [], user: null };
  }
}

// 2. Real-Time Search
export async function searchCafes(query: string) {
  if (!query) return [];
  try {
    return await db.cafe.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ]
      },
      take: 5,
      select: { id: true, name: true, address: true }
    });
  } catch (error) {
    console.error("Search failed:", error);
    return [];
  }
}

// 3. Unlock/Join Cafe
export async function joinCafe(cafeId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    // Check if already joined
    const existing = await db.loyaltyCard.findFirst({
        where: { userId: session.userId, cafeId: cafeId }
    });

    if (existing) return { success: true, message: "Already a member" };

    // Create new card
    await db.loyaltyCard.create({
      data: {
        userId: session.userId,
        cafeId: cafeId,
        stamps: 0,
        maxStamps: 10, 
        tier: "Member", 
        balance: 0
      }
    });

    revalidatePath("/dashboard"); 
    return { success: true };
  } catch (error) {
    console.error("Failed to join cafe:", error);
    return { success: false, error: "Failed to unlock membership" };
  }
}

// ... existing imports in src/actions/dashboard.ts
// import { db } from "@/lib/db";
// import { getSession } from "@/lib/session";

// 4. Get Real-Time Reserve Data
export async function getReserveData() {
  try {
    const session = await getSession();
    if (!session) return { cafes: [], reservations: [] };

    // 1. Fetch Cafes with Table Counts
    // We count "CONFIRMED" reservations to estimate availability
    const cafes = await db.cafe.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        image: true,
        lat: true,
        lng: true,
        totalTables: true,
        _count: {
          select: { reservations: { where: { status: "CONFIRMED" } } } // Count active bookings
        }
      }
    });

    // 2. Fetch User's Booking History
    const reservations = await db.reservation.findMany({
      where: { userId: session.userId },
      include: { cafe: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });

    return { cafes, reservations };
  } catch (error) {
    console.error("Failed to fetch reserve data:", error);
    return { cafes: [], reservations: [] };
  }
}

// ... existing imports in src/actions/dashboard.ts

// 5. Get Loyalty Rewards
export async function getLoyaltyData() {
  try {
    const session = await getSession();
    if (!session) return [];

    // Fetch User's Rewards
    const rewards = await db.userReward.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' } // Newest first
    });

    return rewards;
  } catch (error) {
    console.error("Failed to fetch loyalty data:", error);
    return [];
  }
}

// ... (Keep existing imports and functions)

// 6. Get User Profile for Settings
export async function getUserProfile() {
  try {
    const session = await getSession();
    if (!session || !session.userId) return null;

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, phone: true, image: true }
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }
}