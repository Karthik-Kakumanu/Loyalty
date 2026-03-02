"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, CreditCard, MessageSquareText } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { getCafeLogoByName, getCafeStampIconByName } from "@/features/cafe/config/branding";

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

type CafeTheme = {
  pageBg: string;
  bg: string;
  accent: string;
  accentDeep: string;
  text: string;
  mutedText: string;
  ring: string;
  panelBg: string;
  panelSoft: string;
  shadow: string;
  tagline?: string;
};

function getCafeTheme(cafeName?: string) {
  const normalized = (cafeName || "").toLowerCase();
  if (normalized.includes("cake") || normalized.includes("roven")) {
    return {
      pageBg: "#f4f2d9",
      bg: "from-[#f6f4de] via-[#f3efcf] to-[#f2e4d6]",
      accent: "#cf5469",
      accentDeep: "#b65e70",
      text: "#5d3444",
      mutedText: "#896575",
      ring: "#e8d8b9",
      panelBg: "#fffbea",
      panelSoft: "#f7efd9",
      shadow: "0 14px 30px -20px rgba(93,60,52,0.35)",
      tagline: "Artisanal patisserie & coffee atelier",
    };
  }

  return {
    pageBg: "#f8fafc",
    bg: "from-[#f8fafc] via-[#eef2ff] to-[#e2e8f0]",
    accent: "#334155",
    accentDeep: "#1E293B",
    text: "#0F172A",
    mutedText: "#475569",
    ring: "#CBD5E1",
    panelBg: "#ffffff",
    panelSoft: "#f1f5f9",
    shadow: "0 20px 40px -22px rgba(15,23,42,0.55)",
    tagline: "Curated coffee for everyday rituals",
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

  const theme: CafeTheme = getCafeTheme(card?.cafe?.name);

  if (loading) {
    return (
      <main className="h-dvh bg-[#f4f2d9] flex items-center justify-center">
        <Loader2 className="text-[#cf5469] w-10 h-10 animate-spin" />
      </main>
    );
  }

  if (!card) {
    return (
      <main className="h-dvh bg-[#f4f2d9] px-4 text-[#5d3444]">
        <div className="mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold">Card not found</p>
          <button
            onClick={() => router.push("/dashboard/cards")}
            className="min-h-[44px] rounded-xl bg-[#cf5469] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Go to My Cards
          </button>
        </div>
      </main>
    );
  }

  const demoStampBoost = 1; // Demo-only boost to preview one extra collected stamp.
  const cappedStamps = Math.min((card.stamps || 0) + demoStampBoost, STARTER_STAMP_COUNT);
  const remaining = Math.max(STARTER_STAMP_COUNT - cappedStamps, 0);
  const progressPercentage = Math.min((cappedStamps / STARTER_STAMP_COUNT) * 100, 100);
  const logoSrc = getCafeLogoByName(card.cafe.name);
  const stampIconSrc = getCafeStampIconByName(card.cafe.name);

  return (
    <main
      className="relative min-h-dvh overflow-x-hidden px-4 pb-24 pt-3 sm:px-5 sm:pt-4 selection:bg-[#cf5469] selection:text-white"
      style={{ backgroundColor: theme.pageBg, color: theme.text }}
    >
      {/* Lux blurred background glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 mx-auto h-[420px] w-full max-w-3xl">
        <div className="absolute inset-x-10 top-6 h-64 rounded-[40px] bg-gradient-to-br from-white/70 via-white/10 to-transparent blur-3xl" />
        <div className="absolute left-[-5%] top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_60%)] opacity-70" />
        <div className="absolute right-[-8%] top-24 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),transparent_55%)] opacity-70" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border bg-white/70 shadow-sm transition-colors hover:bg-white"
            style={{ borderColor: theme.ring, color: theme.accentDeep }}
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative min-w-0 flex-1 overflow-hidden rounded-[30px] border bg-gradient-to-br ${theme.bg} p-[1px]`}
            style={{ borderColor: theme.ring, boxShadow: theme.shadow }}
          >
            {/* Lux, glassy inner layer */}
            <div
              className="relative h-full w-full rounded-[28px] bg-gradient-to-br from-white/80 via-white/60 to-white/40 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-5"
              style={{ borderColor: `${theme.ring}80`, borderWidth: 1 }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute -left-24 top-[-40%] h-48 w-48 rotate-[-18deg] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.85),transparent_60%)]" />
                <div className="absolute -right-10 bottom-[-30%] h-40 w-40 rotate-[18deg] bg-[conic-gradient(from_210deg_at_50%_50%,rgba(255,255,255,0.9),transparent_55%)]" />
              </div>

              <header className="relative z-10 mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40"
                    style={{ color: theme.mutedText }}
                  >
                    {card.tier || "Member"} · Loyalty Circle
                  </p>
                  <h1
                    className="mt-1 text-[clamp(1.7rem,6.2vw,2.25rem)] font-extrabold leading-tight tracking-tight"
                    style={{ color: theme.text }}
                  >
                    {card.cafe.name}
                  </h1>
                  {theme.tagline && (
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.24em]" style={{ color: theme.mutedText }}>
                      {theme.tagline}
                    </p>
                  )}
                </div>

                <div className="relative shrink-0">
                  <div className="absolute inset-0 translate-y-1 rounded-full bg-gradient-to-br from-white/90 to-transparent blur-md" />
                  <div
                    className="relative h-16 w-16 overflow-hidden rounded-full border border-white/60 bg-gradient-to-br from-white/90 via-white/80 to-white/70 shadow-[0_10px_25px_rgba(15,23,42,0.25)] sm:h-20 sm:w-20"
                    style={{
                      borderColor: theme.ring,
                    }}
                  >
                    <Image
                      src={logoSrc}
                      alt="Cafe brand logo"
                      fill
                      className="object-contain p-1.5"
                      sizes="(max-width: 640px) 64px, 80px"
                    />
                  </div>
                </div>
              </header>

              <div
                className="relative mt-2 rounded-2xl border bg-gradient-to-br from-white/80 via-white/70 to-white/60 p-4"
                style={{
                  borderColor: theme.ring,
                }}
              >
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                <div className="mb-2 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: theme.mutedText }}
                    >
                      Member ID
                    </p>
                    <p className="truncate font-mono text-[13px] font-semibold" style={{ color: theme.text }}>
                      {card.cardSerial || "MEMBER-PENDING"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: theme.mutedText }}>
                      Stamps
                    </p>
                    <p className="text-2xl font-black leading-none" style={{ color: theme.accentDeep }}>
                      {cappedStamps}
                      <span className="text-base font-semibold" style={{ color: theme.mutedText }}>
                        /{STARTER_STAMP_COUNT}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  <div className="h-2.5 overflow-hidden rounded-full bg-black/5" style={{ backgroundColor: theme.panelSoft }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.55 }}
                      className="h-full rounded-full"
                      style={{
                        backgroundImage: `linear-gradient(90deg, ${theme.accent}, ${theme.accentDeep})`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-medium tracking-wide" style={{ color: theme.mutedText }}>
                    You are{" "}
                    <span className="font-semibold" style={{ color: theme.accentDeep }}>
                      {remaining} stamp{remaining === 1 ? "" : "s"}
                    </span>{" "}
                    away from your next treat.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        <section
          className="rounded-[24px] border p-4 shadow-sm"
          style={{ borderColor: theme.ring, backgroundColor: theme.panelBg }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: theme.mutedText }}>
              Stamp Progress
            </h2>
            <span className="text-xs font-bold" style={{ color: theme.accentDeep }}>
              {remaining} stamps to unlock reward
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {[...Array(STARTER_STAMP_COUNT)].map((_, i) => {
              const filled = i < cappedStamps;
              return (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: filled ? theme.accent : theme.ring,
                    backgroundColor: filled ? `${theme.accent}24` : theme.panelSoft,
                  }}
                >
                  {filled ? (
                    <Image
                      src={stampIconSrc}
                      alt="Collected stamp"
                      fill
                      sizes="32px"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: theme.mutedText }}>
                      {i + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="rounded-[24px] border p-4 shadow-sm"
          style={{ borderColor: theme.ring, backgroundColor: theme.panelBg }}
        >
          <div className="mb-3 flex items-center gap-2">
            <CreditCard size={16} style={{ color: theme.accentDeep }} />
            <h2 className="text-sm font-bold uppercase tracking-[0.18em]" style={{ color: theme.mutedText }}>
              Earn Stamps
            </h2>
          </div>

          <div className="grid gap-2">
            {STARTER_STAMP_CONDITIONS.map((condition, idx) => (
              <div
                key={condition}
                className="rounded-xl border px-3 py-2.5 text-sm font-medium"
                style={{
                  borderColor: theme.ring,
                  backgroundColor: theme.panelSoft,
                  color: theme.text,
                }}
              >
                <span
                  className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${theme.accent}28`, color: theme.accentDeep }}
                >
                  {idx + 1}
                </span>
                {condition}
              </div>
            ))}
          </div>

          <p
            className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold"
            style={{ backgroundColor: theme.panelSoft, color: theme.accentDeep }}
          >
            Complete {STARTER_STAMP_COUNT} stamps and unlock your next reward item on the house.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => console.log("TODO: Integrate Razorpay checkout", card.id)}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-md active:scale-[0.98]"
            style={{ backgroundColor: theme.accentDeep }}
          >
            <CreditCard size={16} />
            Pay
          </button>
          <button
            onClick={() => router.push(`/dashboard/cafe/${card.cafe.id}`)}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-2xl border text-sm font-bold active:scale-[0.98]"
            style={{
              borderColor: theme.ring,
              backgroundColor: theme.panelBg,
              color: theme.accentDeep,
            }}
          >
            <MessageSquareText size={16} />
            Feedback
          </button>
        </div>
      </div>
    </main>
  );
}
