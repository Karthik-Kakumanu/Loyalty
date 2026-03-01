import type { LucideIcon } from "lucide-react";
import { ShieldCheck, Sparkles, Star } from "lucide-react";

export const landingTheme = {
  color: {
    ruby: "#C72C48",
    rubyDark: "#A61F38",
    espresso: "#3D2926",
    espressoMuted: "#6E5955",
    white: "#FFFFFF",
    softRuby: "#FCECEF",
  },
} as const;

export type ValuePillar = {
  id: "secure" | "premium" | "seamless";
  title: string;
  description: string;
  Icon: LucideIcon;
};

export const valuePillars: readonly ValuePillar[] = [
  {
    id: "secure",
    title: "Secure Access",
    description: "Session-safe OTP authentication and protected user routing.",
    Icon: ShieldCheck,
  },
  {
    id: "premium",
    title: "Premium Loyalty",
    description: "High-trust membership experiences with strong retention design.",
    Icon: Star,
  },
  {
    id: "seamless",
    title: "Seamless UX",
    description: "Optimized for phones and tablets with responsive-first layouts.",
    Icon: Sparkles,
  },
] as const;
