// file: src/actions/dashboard.ts
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { joinCafeWithSerial } from "@/actions/cafe";

type CafeSummary = {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  lat: number | null;
  lng: number | null;
  address: string;
};

type LoyaltyCardRecord = {
  id: string;
  stamps: number;
  maxStamps: number;
  tier: string | null;
  balance: number | null;
  cafe: CafeSummary;
};

type DashboardData = {
  myCards: LoyaltyCardRecord[];
  trending: CafeSummary[];
  allCafes: CafeSummary[];
  user: {
    userId: string;
    phone: string;
  } | null;
};

type SearchCafeResult = {
  id: string;
  name: string;
  address: string;
};

type CafeReserve = {
  id: string;
  name: string;
  address: string;
  image: string | null;
  lat: number | null;
  lng: number | null;
  totalTables: number;
  _count: {
    reservations: number;
  };
};

type ReservationRecord = {
  id: string;
  status: string;
  date: Date;
  cafe: {
    name: string;
  };
};

type ReserveData = {
  cafes: CafeReserve[];
  reservations: ReservationRecord[];
};

type RewardRecord = {
  id: string;
  title: string;
  cafeName: string;
  expiry: string;
  status: "READY" | "USED" | "EXPIRED";
  pointsUsed: number;
};

type UserProfile = {
  name: string | null;
  phone: string;
  image: string | null;
} | null;

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return {
        myCards: [],
        trending: [],
        allCafes: [],
        user: null
      };
    }

    const myCardsRaw = await db.loyaltyCard.findMany({
      where: { userId: session.userId },
      include: {
        cafe: {
          select: {
            id: true,
            name: true,
            image: true,
            rating: true,
            lat: true,
            lng: true,
            address: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const myCards: LoyaltyCardRecord[] = myCardsRaw.map((card) => ({
      id: card.id,
      stamps: card.stamps,
      maxStamps: card.maxStamps,
      tier: card.tier,
      balance: card.balance,
      cafe: {
        id: card.cafe.id,
        name: card.cafe.name,
        image: card.cafe.image,
        rating: card.cafe.rating,
        lat: card.cafe.lat,
        lng: card.cafe.lng,
        address: card.cafe.address
      }
    }));

    const trendingRaw = await db.cafe.findMany({
      orderBy: { visitCount: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        image: true,
        rating: true,
        address: true,
        lat: true,
        lng: true
      }
    });

    const trending: CafeSummary[] = trendingRaw.map((cafe) => ({
      id: cafe.id,
      name: cafe.name,
      image: cafe.image,
      rating: cafe.rating,
      lat: cafe.lat,
      lng: cafe.lng,
      address: cafe.address
    }));

    const allRaw = await db.cafe.findMany({
      take: 20,
      select: {
        id: true,
        name: true,
        image: true,
        rating: true,
        address: true,
        lat: true,
        lng: true
      }
    });

    const allCafes: CafeSummary[] = allRaw.map((cafe) => ({
      id: cafe.id,
      name: cafe.name,
      image: cafe.image,
      rating: cafe.rating,
      lat: cafe.lat,
      lng: cafe.lng,
      address: cafe.address
    }));

    return {
      myCards,
      trending,
      allCafes,
      user: {
        userId: session.userId,
        phone: session.phone
      }
    };
  } catch (error) {
    console.error("getDashboardData error:", error);
    return {
      myCards: [],
      trending: [],
      allCafes: [],
      user: null
    };
  }
}

export async function searchCafes(query: string): Promise<SearchCafeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  try {
    const cafes = await db.cafe.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { address: { contains: trimmed, mode: "insensitive" } },
          { city: { contains: trimmed, mode: "insensitive" } }
        ]
      },
      take: 5,
      select: {
        id: true,
        name: true,
        address: true
      }
    });

    return cafes.map((cafe) => ({
      id: cafe.id,
      name: cafe.name,
      address: cafe.address
    }));
  } catch (error) {
    console.error("searchCafes error:", error);
    return [];
  }
}

export async function joinCafe(cafeId: string) {
  return joinCafeWithSerial(cafeId);
}

export async function getReserveData(): Promise<ReserveData> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { cafes: [], reservations: [] };
    }

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
          select: {
            reservations: {
              where: { status: "CONFIRMED" }
            }
          }
        }
      }
    });

    const reservations = await db.reservation.findMany({
      where: { userId: session.userId },
      include: {
        cafe: { select: { name: true } }
      },
      orderBy: { date: "desc" }
    });

    return { cafes, reservations };
  } catch (error) {
    console.error("getReserveData error:", error);
    return { cafes: [], reservations: [] };
  }
}

export async function getLoyaltyData(): Promise<RewardRecord[]> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return [];
    }

    const rewards = await db.userReward.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" }
    });

    const mapped: RewardRecord[] = rewards.map((reward) => ({
      id: reward.id,
      title: reward.title,
      cafeName: reward.cafeName,
      expiry: reward.expiry,
      status: reward.status as RewardRecord["status"],
      pointsUsed: reward.pointsUsed
    }));

    return mapped;
  } catch (error) {
    console.error("getLoyaltyData error:", error);
    return [];
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return null;
    }
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        phone: true,
        image: true
      }
    });
    if (!user) return null;
    return user;
  } catch (error) {
    console.error("getUserProfile error:", error);
    return null;
  }
}