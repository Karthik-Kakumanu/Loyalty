const FALLBACK_LOGO = "/logo.jpg";

const CAFE_LOGO_MAP: Record<string, string> = {
  "cake roven": "/cafes/cake-roven/logo.png",
  cakeroven: "/cafes/cake-roven/logo.png",
  "cake-roven": "/cafes/cake-roven/logo.png",
  "bistro one": "/cafes/bistro-one/logo.png",
  "roast theory": "/cafes/roast-theory/logo.png",
};

function normalizeCafeName(name?: string) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCafeLogoByName(cafeName?: string) {
  const normalized = normalizeCafeName(cafeName);
  return CAFE_LOGO_MAP[normalized] || FALLBACK_LOGO;
}

export function getCafeStampIconByName(cafeName?: string) {
  return getCafeLogoByName(cafeName);
}

export function isFallbackCafeLogo(logoSrc?: string | null) {
  return !logoSrc || logoSrc === FALLBACK_LOGO;
}

export function getCafeMonogram(cafeName?: string) {
  const clean = (cafeName || "")
    .trim()
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return clean || "RV";
}
