/**
 * How a Content Distribution partner is shown: an official logo image, a styled wordmark, or its name.
 * Shared by the Studios showcase and anything else that renders partner cards, so they always match.
 */
export type MarketLogo =
  | { kind: "image"; brand: string; src: string; alt: string }
  | { kind: "wordmark"; label: string; className: string; style: WordmarkStyle }
  | { kind: "name"; label: string; className: string; style: WordmarkStyle };

/** The same look as `className`, for renderers that cannot use Tailwind (e.g. a canvas texture). */
export type WordmarkStyle = {
  color: string;
  family: "serif" | "sans";
  italic?: boolean;
  /** Letter spacing in em. */
  tracking: number;
  uppercase?: boolean;
  border?: string;
};

const officialMarketLogos: Record<string, { alt: string; src: string }> = {
  netflix: {
    alt: "Netflix",
    src: "https://images.ctfassets.net/4cd45et68cgf/7LrExJ6PAj6MSIPkDyCO86/542b1dfabbf3959908f69be546879952/Netflix-Brand-Logo.png",
  },
  tvf: {
    alt: "TVF International",
    src: "https://tvfinternational.com/themes/international/images/tvf_logo4.png",
  },
  viu: {
    alt: "Viu",
    src: "https://www.viu.com/ott/hk/v1/images/Viu_logo.svg",
  },
};

const marketWordmarks: Record<string, { label: string; className: string; style: WordmarkStyle }> = {
  disney: {
    label: "Disney+",
    className: "font-serif text-[clamp(28px,5vw,58px)] font-bold italic tracking-[-0.08em] text-[#8ed7ff]",
    style: { color: "#8ed7ff", family: "serif", italic: true, tracking: -0.08 },
  },
  hbo: {
    label: "HBO",
    className: "text-[clamp(30px,5.4vw,64px)] font-black tracking-[-0.09em] text-white",
    style: { color: "#ffffff", family: "sans", tracking: -0.09 },
  },
  iqiyi: {
    label: "iQIYI",
    className: "rounded-[8px] border-[3px] border-[#00dc5a] px-[0.28em] py-[0.03em] text-[clamp(24px,4.5vw,52px)] font-black tracking-[-0.06em] text-[#00dc5a]",
    style: { color: "#00dc5a", family: "sans", tracking: -0.06, border: "#00dc5a" },
  },
  true: {
    label: "true",
    className: "text-[clamp(30px,5.4vw,64px)] font-black italic tracking-[-0.09em] text-[#e51b23]",
    style: { color: "#e51b23", family: "sans", italic: true, tracking: -0.09 },
  },
};

const nameClassName = "text-[clamp(20px,3.5vw,44px)] font-black uppercase tracking-[-0.04em] text-white/90";
const nameStyle: WordmarkStyle = { color: "rgba(255,255,255,0.9)", family: "sans", tracking: -0.04, uppercase: true };

export function marketLogoBrand(companySlug: string): string | undefined {
  const compactSlug = companySlug.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");

  if (compactSlug.includes("netflix")) return "netflix";
  if (compactSlug === "viu" || compactSlug.startsWith("viu")) return "viu";
  if (compactSlug === "tvf" || compactSlug.includes("tvfinternational") || compactSlug.includes("tvfmedia")) return "tvf";
  if (compactSlug.includes("disney")) return "disney";
  if (compactSlug === "max" || compactSlug.includes("hbo")) return "hbo";
  if (compactSlug.includes("iqiyi") || compactSlug.includes("iqyi")) return "iqiyi";
  if (compactSlug.startsWith("true")) return "true";
  return undefined;
}

export function marketCompanyLogo(companyName: string, companySlug: string): MarketLogo {
  const brand = marketLogoBrand(companySlug);
  const official = brand ? officialMarketLogos[brand] : undefined;
  if (official && brand) return { kind: "image", brand, src: official.src, alt: `${official.alt} official logo` };
  const wordmark = brand ? marketWordmarks[brand] : undefined;
  if (wordmark) return { kind: "wordmark", ...wordmark };
  return { kind: "name", label: companyName, className: nameClassName, style: nameStyle };
}

/** The official logo URL for a brand key, or undefined — an allowlist, never an arbitrary URL. */
export function officialMarketLogoSrc(brand: string): string | undefined {
  return Object.hasOwn(officialMarketLogos, brand) ? officialMarketLogos[brand].src : undefined;
}

/** The logo's box inside its 16:9 card, as a fraction of the card (matches the showcase CSS). */
export function marketLogoFrame(companySlug: string): { width: number; height: number } {
  const brand = marketLogoBrand(companySlug);
  if (brand === "netflix") return { width: 0.72, height: 0.32 };
  if (brand === "viu") return { width: 0.64, height: 0.48 };
  return { width: 0.68, height: 0.46 };
}
