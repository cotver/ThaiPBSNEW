import "server-only";

import type { Title } from "@/lib/content";
import { getCatalogTitleMatches } from "@/lib/payload-content";

const DEFAULT_D1_URL = "https://d1-read-proxy.thaipbs.workers.dev/";
const ONBOARDING_PAGE_LIMIT = 500;
const MAX_ONBOARDING_PAGES = 100;

export type D1OnboardingDeal = {
  buyerCompany: string;
  contractType?: string;
  createdAt?: string;
  endDate?: string;
  houseIdCount?: number;
  id: string;
  logoImageApi?: string;
  posterHorizontalImageApi?: string;
  posterVerticalImageApi?: string;
  startDate?: string;
  status?: string;
  termYears?: number;
  title: string;
};

export type MarketCompanySummary = {
  dealCount: number;
  name: string;
  programCount: number;
  programTitles: string[];
  slug: string;
};

export type MarketCompanyProgram = D1OnboardingDeal & {
  catalogTitle?: Title;
};

export type MarketCompany = MarketCompanySummary & {
  programs: MarketCompanyProgram[];
};

type OnboardingEnvelope = {
  has_more?: boolean;
  next_offset?: number | null;
  results?: unknown[];
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseDeal(value: unknown): D1OnboardingDeal | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const id = optionalString(row.id);
  const title = optionalString(row.title);
  const buyerCompany = optionalString(row.buyer_company);

  if (!id || !title || !buyerCompany) return null;

  return {
    buyerCompany,
    contractType: optionalString(row.contract_type),
    createdAt: optionalString(row.created_at),
    endDate: optionalString(row.end_date),
    houseIdCount: optionalNumber(row.house_id_count),
    id,
    logoImageApi: optionalString(row.logo_image_api),
    posterHorizontalImageApi: optionalString(row.poster_h_image_api),
    posterVerticalImageApi: optionalString(row.poster_v_image_api),
    startDate: optionalString(row.start_date),
    status: optionalString(row.status),
    termYears: optionalNumber(row.term_years),
    title,
  };
}

function normalizeLookupText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function marketCompanySlug(name: string): string {
  const slug = name
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "company";
}

function uniqueProgramTitles(deals: D1OnboardingDeal[]): string[] {
  const titles = new Map<string, string>();

  for (const deal of deals) {
    const key = normalizeLookupText(deal.title);
    if (key && !titles.has(key)) titles.set(key, deal.title);
  }

  return [...titles.values()];
}

function groupDeals(deals: D1OnboardingDeal[]) {
  const groups = new Map<string, { deals: D1OnboardingDeal[]; name: string }>();

  for (const deal of deals) {
    const key = normalizeLookupText(deal.buyerCompany);
    const existing = groups.get(key);

    if (existing) existing.deals.push(deal);
    else groups.set(key, { deals: [deal], name: deal.buyerCompany });
  }

  return [...groups.values()];
}

async function fetchOnboardingPage(offset: number): Promise<OnboardingEnvelope> {
  const apiKey = process.env.D1_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("D1_API_KEY is not configured");

  const baseUrl = process.env.D1_URL || DEFAULT_D1_URL;
  const url = new URL("/api/onboarding-deals", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("limit", String(ONBOARDING_PAGE_LIMIT));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("include_payload_json", "0");

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`D1 onboarding request failed with HTTP ${response.status}`);
  }

  const payload = await response.json() as OnboardingEnvelope;
  if (!Array.isArray(payload.results)) {
    throw new Error("D1 onboarding response does not contain a results array");
  }

  return payload;
}

async function loadOnboardingDeals(): Promise<D1OnboardingDeal[]> {
  const deals: D1OnboardingDeal[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_ONBOARDING_PAGES; page += 1) {
    const payload = await fetchOnboardingPage(offset);
    deals.push(...(payload.results || []).map(parseDeal).filter((deal): deal is D1OnboardingDeal => Boolean(deal)));

    if (!payload.has_more) return deals;

    const nextOffset = payload.next_offset;
    if (typeof nextOffset !== "number" || nextOffset <= offset) {
      throw new Error("D1 onboarding pagination did not provide a valid next_offset");
    }
    offset = nextOffset;
  }

  throw new Error(`D1 onboarding pagination exceeded ${MAX_ONBOARDING_PAGES} pages`);
}

export async function getMarketCompanies(): Promise<MarketCompanySummary[]> {
  try {
    const deals = await loadOnboardingDeals();

    return groupDeals(deals)
      .map(({ deals: companyDeals, name }) => {
        const programTitles = uniqueProgramTitles(companyDeals);
        return {
          dealCount: companyDeals.length,
          name,
          programCount: programTitles.length,
          programTitles,
          slug: marketCompanySlug(name),
        };
      })
      .sort((a, b) => b.programCount - a.programCount || a.name.localeCompare(b.name));
  } catch (error) {
    console.warn("Unable to load D1 market companies", error);
    return [];
  }
}

export async function getMarketCompany(slug: string): Promise<MarketCompany | null> {
  try {
    const [deals, catalogMatches] = await Promise.all([loadOnboardingDeals(), getCatalogTitleMatches()]);
    const companyGroup = groupDeals(deals).find((group) => marketCompanySlug(group.name) === slug);
    if (!companyGroup) return null;

    const catalogByTitle = new Map<string, Title>();
    for (const match of catalogMatches) {
      for (const alias of match.aliases) {
        const key = normalizeLookupText(alias);
        if (key && !catalogByTitle.has(key)) catalogByTitle.set(key, match.title);
      }
    }

    const programsByTitle = new Map<string, MarketCompanyProgram>();
    for (const deal of companyGroup.deals) {
      const key = normalizeLookupText(deal.title);
      if (!key || programsByTitle.has(key)) continue;
      programsByTitle.set(key, {
        ...deal,
        catalogTitle: catalogByTitle.get(key),
      });
    }

    const programs = [...programsByTitle.values()];
    return {
      dealCount: companyGroup.deals.length,
      name: companyGroup.name,
      programCount: programs.length,
      programTitles: programs.map((program) => program.title),
      programs,
      slug: marketCompanySlug(companyGroup.name),
    };
  } catch (error) {
    console.warn(`Unable to load D1 market company "${slug}"`, error);
    return null;
  }
}
