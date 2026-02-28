"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, CreditCard, MessageSquareText } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";

type LoyaltyCardData = {
  id: string;
  cardSerial?: string | null;
  stamps: number;
  maxStamps: number;
  tier?: string | null;
  cafe: {
    id: string;
    name: string;
  };
};

const STARTER_STAMP_COUNT = 10;
const STARTER_STAMP_CONDITIONS = [
  "Buy 1 coffee, get 1 stamp",
  "Buy 1 cake, get 1 stamp",
];

function getCafeTheme(cafeName?: string) {
  const normalized = (cafeName || "").toLowerCase();
  if (normalized.includes("cake") || normalized.includes("roven")) {
    return {
      bg: "from-[#fff8ee] via-[#f8e9d1] to-[#f3ddbe]",
      accent: "#C06A54",
      accentDeep: "#A74E3D",
      text: "#5B2D27",
      ring: "#E8C7A8",
    };
  }

  return {
    bg: "from-[#f8fafc] via-[#eef2ff] to-[#e2e8f0]",
    accent: "#334155",
    accentDeep: "#1E293B",
    text: "#0F172A",
    ring: "#CBD5E1",
  };
}

export default function LoyaltyCardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [card, setCard] = useState<LoyaltyCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        const data = await getDashboardData();
        const found = (data.myCards as LoyaltyCardData[]).find((c) => c.id === id);

        if (!found) {
          setCard(null);
          return;
        }

        // Starter pack currently active for Cake Roven: fixed 10 stamps.
        const normalizedCard = {
          ...found,
          maxStamps: STARTER_STAMP_COUNT,
        };

        setCard(normalizedCard);

      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen bg-[#fbf6ef] flex items-center justify-center">
        <Loader2 className="text-[#A74E3D] w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="h-screen bg-[#fbf6ef] text-[#5B2D27] flex items-center justify-center font-semibold">
        Card not found
      </div>
    );
  }

  const theme = getCafeTheme(card?.cafe?.name);
  const cappedStamps = Math.min(card.stamps || 0, STARTER_STAMP_COUNT);
  const remaining = Math.max(STARTER_STAMP_COUNT - cappedStamps, 0);
  const progressPercentage = Math.min((cappedStamps / STARTER_STAMP_COUNT) * 100, 100);

  return (
    <div className="min-h-screen bg-[#fbf6ef] text-[#5B2D27] px-4 pb-24 pt-6 selection:bg-[#C06A54] selection:text-white">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e8d3bd] bg-white/80 text-[#7c4438] shadow-sm transition-colors hover:bg-white"
        >
          <ChevronLeft size={22} />
        </button>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`rounded-[30px] border border-[#e8d3bd] bg-gradient-to-br ${theme.bg} p-5 shadow-[0_18px_35px_-20px_rgba(132,69,45,0.7)]`}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9b5e4f]">
                Starter Pack Card
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight" style={{ color: theme.text }}>
                {card.cafe.name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#865247]">
                {card.tier || "Member"} Membership
              </p>
            </div>

            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#e8c7a8] bg-white">
              <Image
                src="/logo.png"
                alt="Cafe brand logo"
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8c7a8] bg-white/70 p-4">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f6f63]">
                  Member ID
                </p>
                <p className="font-mono text-sm font-semibold text-[#6a3a31]">
                  {card.cardSerial || "MEMBER-PENDING"}
                </p>
              </div>
              <p className="text-2xl font-black leading-none" style={{ color: theme.accentDeep }}>
                {cappedStamps}
                <span className="text-base font-semibold text-[#9f6f63]">/{STARTER_STAMP_COUNT}</span>
              </p>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-[#efdfcc]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full"
                style={{ backgroundColor: theme.accent }}
              />
            </div>
          </div>
        </motion.section>

        <section className="rounded-[24px] border border-[#ecd9c4] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#9f6f63]">Stamp Progress</h2>
            <span className="text-xs font-bold text-[#a74e3d]">{remaining} stamps to unlock reward</span>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {[...Array(STARTER_STAMP_COUNT)].map((_, i) => {
              const filled = i < cappedStamps;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-full border ${filled ? "border-[#c06a54] bg-[#f4d9c8]" : "border-[#ead7c2] bg-[#faf3ea]"} flex items-center justify-center`}
                >
                  {filled ? (
                    <Image src="/logo.png" alt="Collected stamp" width={20} height={20} className="rounded-full" />
                  ) : (
                    <span className="text-[10px] font-bold text-[#b58c80]">{i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#ecd9c4] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-[#a74e3d]" />
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#9f6f63]">Earn Stamps</h2>
          </div>

          <div className="grid gap-2">
            {STARTER_STAMP_CONDITIONS.map((condition, idx) => (
              <div key={condition} className="rounded-xl border border-[#efdfcc] bg-[#fff8f1] px-3 py-2.5 text-sm font-medium text-[#6b4036]">
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f2d1bc] text-xs font-bold text-[#8a4b3f]">
                  {idx + 1}
                </span>
                {condition}
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-xl bg-[#f8ede2] px-3 py-2 text-sm font-semibold text-[#7a4338]">
            Complete {STARTER_STAMP_COUNT} stamps and unlock your next reward item on the house.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => console.log("TODO: Integrate Razorpay checkout", card.id)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-md active:scale-[0.98]"
            style={{ backgroundColor: theme.accentDeep }}
          >
            <CreditCard size={16} />
            Pay
          </button>
          <button
            onClick={() => router.push(`/dashboard/cafe/${card.cafe.id}`)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#e8c7a8] bg-white text-sm font-bold text-[#7b4337] active:scale-[0.98]"
          >
            <MessageSquareText size={16} />
            Feedback
          </button>
        </div>

      </div>
    </div>
  );
}
