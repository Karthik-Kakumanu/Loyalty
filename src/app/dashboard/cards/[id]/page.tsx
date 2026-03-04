"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, CreditCard, Loader2, MessageSquareText, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getDashboardData } from "@/actions/dashboard";
import {
  getCafeLogoByName,
  getCafeMonogram,
  getCafeStampIconByName,
  isFallbackCafeLogo,
} from "@/features/cafe/config/branding";

type LoyaltyCardData = {
  id: string;
  cardSerial: string | null;
  stamps: number;
  maxStamps: number;
  tier: string | null;
  cafe: {
    id: string;
    name: string;
  };
};

const TARGET_STAMP_COUNT = 10;
const DEMO_EXTRA_FILLED_STAMP = 1;
const EARN_RULES = [
  "Every visit with a bill of INR 1,000 earns 1 stamp.",
  "Stamps are credited after successful bill settlement.",
  "Complete all stamps to unlock your reward instantly.",
] as const;

type CafeTheme = {
  pageBg: string;
  text: string;
  muted: string;
  accent: string;
  accentDeep: string;
  panel: string;
  panelSoft: string;
  ring: string;
  cardGradient: string;
  badgeBg: string;
  badgeText: string;
  glow: string;
};

function resolveTheme(cafeName?: string): CafeTheme {
  const normalized = (cafeName || "").toLowerCase();

  if (normalized.includes("cake") || normalized.includes("roven")) {
    return {
      pageBg: "#f7f3e9",
      text: "#412a27",
      muted: "#7b5f57",
      accent: "#c74856",
      accentDeep: "#962e3f",
      panel: "#fffdf8",
      panelSoft: "#f6eee2",
      ring: "#ead8c4",
      cardGradient: "from-[#fff4e5] via-[#f9dec9] to-[#f2c9b3]",
      badgeBg: "#fbe4d8",
      badgeText: "#8f3845",
      glow: "rgba(199,72,86,0.23)",
    };
  }

  return {
    pageBg: "#f2f5f9",
    text: "#10233a",
    muted: "#4e6076",
    accent: "#1e4e88",
    accentDeep: "#153a66",
    panel: "#ffffff",
    panelSoft: "#edf3fb",
    ring: "#d4deea",
    cardGradient: "from-[#eaf1fb] via-[#d7e6f7] to-[#c2d8f2]",
    badgeBg: "#dfeaf8",
    badgeText: "#183b63",
    glow: "rgba(30,78,136,0.24)",
  };
}

function formatMembershipId(card: LoyaltyCardData) {
  if (card.cardSerial) return card.cardSerial;
  return `MEM-${card.id.slice(-6).toUpperCase()}`;
}

function StampToken({
  index,
  isFilled,
  theme,
  stampLogo,
}: {
  index: number;
  isFilled: boolean;
  theme: CafeTheme;
  stampLogo: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 20 }}
      className="relative aspect-square"
    >
      <div
        className="absolute inset-0 rounded-full border shadow-[0_8px_18px_-10px_rgba(15,23,42,0.35)]"
        style={{
          borderColor: isFilled ? theme.accent : theme.ring,
          background: isFilled
            ? `radial-gradient(circle at 30% 20%, #ffffff, ${theme.panelSoft})`
            : theme.panelSoft,
        }}
      />

      <div className="absolute inset-[3px] overflow-hidden rounded-full border bg-white" style={{ borderColor: theme.ring }}>
        <Image
          src={stampLogo}
          alt="Stamp logo"
          fill
          sizes="48px"
          className={`object-contain p-2 transition-all duration-300 ${
            isFilled ? "opacity-100 saturate-100" : "opacity-35 grayscale"
          }`}
        />
      </div>
    </motion.div>
  );
}

function BrandCoin({
  logoSrc,
  monogram,
  theme,
}: {
  logoSrc: string;
  monogram: string;
  theme: CafeTheme;
}) {
  const useLogo = !isFallbackCafeLogo(logoSrc);

  return (
    <div className="relative h-20 w-20 shrink-0">
      <div
        className="absolute inset-0 rounded-[26px] blur-[14px]"
        style={{ backgroundColor: theme.glow }}
      />
      <div
        className="relative h-full w-full overflow-hidden rounded-[26px] border bg-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.5)]"
        style={{ borderColor: theme.ring }}
      >
        {useLogo ? (
          <Image src={logoSrc} alt="Cafe logo" fill sizes="80px" className="object-contain p-3" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-700 text-2xl font-black text-white">
            {monogram}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoyaltyCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<LoyaltyCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        const data = await getDashboardData();
        const found = (data.myCards as LoyaltyCardData[]).find((candidate) => candidate.id === id);
        setCard(found ?? null);
      } finally {
        setLoading(false);
      }
    }

    void fetchCard();
  }, [id]);

  const theme = useMemo(() => resolveTheme(card?.cafe.name), [card?.cafe.name]);

  if (loading) {
    return (
      <main className="flex h-dvh items-center justify-center" style={{ backgroundColor: theme.pageBg }}>
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.accent }} />
      </main>
    );
  }

  if (!card) {
    return (
      <main className="flex h-dvh items-center justify-center px-4" style={{ backgroundColor: theme.pageBg, color: theme.text }}>
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)]" style={{ borderColor: theme.ring }}>
          <h1 className="text-xl font-bold">Card not found</h1>
          <p className="mt-2 text-sm" style={{ color: theme.muted }}>
            This loyalty card is unavailable or no longer active.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/cards")}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: theme.accentDeep }}
          >
            Back to wallet
          </button>
        </div>
      </main>
    );
  }

  const logoSrc = getCafeLogoByName(card.cafe.name);
  const stampLogo = getCafeStampIconByName(card.cafe.name);
  const monogram = getCafeMonogram(card.cafe.name);
  const memberId = formatMembershipId(card);
  const targetStamps = Math.max(card.maxStamps || TARGET_STAMP_COUNT, TARGET_STAMP_COUNT);
  const actualEarnedStamps = Math.min(card.stamps, targetStamps);
  const previewEarnedStamps = Math.min(actualEarnedStamps + DEMO_EXTRA_FILLED_STAMP, targetStamps);
  const remaining = Math.max(targetStamps - previewEarnedStamps, 0);
  const progress = targetStamps ? Math.round((previewEarnedStamps / targetStamps) * 100) : 0;

  return (
    <main
      className="relative min-h-full overflow-x-hidden px-4 pb-6 pt-4 sm:px-5"
      style={{ backgroundColor: theme.pageBg, color: theme.text }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-[-10%] h-[330px] w-[330px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: theme.glow }}
        />
        <div className="absolute bottom-[-22%] right-[-10%] h-[300px] w-[300px] rounded-full bg-white/40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border bg-white/80 shadow-sm backdrop-blur"
            style={{ borderColor: theme.ring, color: theme.accentDeep }}
          >
            <ChevronLeft size={22} />
          </button>

          <p className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}>
            Premium loyalty pass
          </p>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className={`overflow-hidden rounded-[34px] border bg-gradient-to-br ${theme.cardGradient} p-5 shadow-[0_26px_50px_-32px_rgba(15,23,42,0.65)]`}
          style={{ borderColor: theme.ring }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                {card.tier || "Member"} - Private Club
              </p>
              <h1 className="mt-1 truncate text-[clamp(1.6rem,6.4vw,2.3rem)] font-black leading-tight tracking-tight">
                {card.cafe.name}
              </h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em]" style={{ color: theme.muted }}>
                curated rewards - reserved members
              </p>
            </div>
            <BrandCoin logoSrc={logoSrc} monogram={monogram} theme={theme} />
          </div>

          <div className="mt-5 rounded-2xl border bg-white/70 p-4 backdrop-blur" style={{ borderColor: theme.ring }}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                  Membership ID
                </p>
                <p className="truncate font-mono text-sm font-semibold">{memberId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                  Progress
                </p>
                <p className="text-2xl font-black" style={{ color: theme.accentDeep }}>
                  {previewEarnedStamps}
                  <span className="text-base font-semibold" style={{ color: theme.muted }}>
                    /{targetStamps}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: theme.panelSoft }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accentDeep} 100%)`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] font-medium" style={{ color: theme.muted }}>
                {remaining === 0
                  ? "Reward unlocked. Redeem at counter."
                  : `${remaining} more stamp${remaining === 1 ? "" : "s"} to unlock your reward.`}
              </p>
            </div>
          </div>
        </motion.section>

        <section className="rounded-[28px] border p-4 shadow-sm" style={{ borderColor: theme.ring, backgroundColor: theme.panel }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
              Signature stamp board
            </h2>
            <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}>
              <Trophy size={12} />
              {progress}%
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
            {Array.from({ length: targetStamps }).map((_, index) => (
              <StampToken
                key={index}
                index={index}
                isFilled={index < previewEarnedStamps}
                theme={theme}
                stampLogo={stampLogo}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border p-4 shadow-sm" style={{ borderColor: theme.ring, backgroundColor: theme.panel }}>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: theme.accentDeep }} />
            <h2 className="text-sm font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
              Stamp rules
            </h2>
          </div>

          <div className="space-y-2.5">
            {EARN_RULES.map((rule, idx) => (
              <div
                key={rule}
                className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
                style={{ borderColor: theme.ring, backgroundColor: theme.panelSoft }}
              >
                <span
                  className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                >
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toast.info("Payment gateway integration is coming soon.")}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
            style={{ backgroundColor: theme.accentDeep }}
          >
            <CreditCard size={16} />
            Pay
          </button>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/cafe/${card.cafe.id}`)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-transform active:scale-[0.98]"
            style={{ borderColor: theme.ring, backgroundColor: theme.panel, color: theme.accentDeep }}
          >
            <MessageSquareText size={16} />
            Visit Cafe
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </main>
  );
}
