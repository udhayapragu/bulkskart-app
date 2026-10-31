import { supabase } from '@/db/supabase';
import { findCountry } from '@/lib/countries';
import {
  INCLUDE_TEMPLATE_SEED_DATA,
  isSeededCompany,
  isSeededRequirement,
  SEED_OWNER_ID,
  SEEDED_RFQ_TITLE_LIKE,
} from '@/lib/seedData';
import type { Category } from '@/types/types';

/**
 * Everything the landing page shows comes from the database through these functions. Nothing is
 * generated, padded or borrowed. A section with no real records shows an honest empty state.
 */

/** Stock-photo and AI-image hosts. Pictures from them are never shown as a business or product photo. */
const BLOCKED_IMAGE_HOSTS = ['pixabay.com', 'unsplash.com', 'pexels.com', 'medo.dev', 'miaoda.cn'];
/** Test and debug RFQs stay out of public listings. */
const TEST_TITLE_PATTERN = /\b(test|debug|timed|timeout)\b/i;
/** Rows read to work out country figures. A result this large is treated as incomplete and the figure is hidden. */
const SCAN_LIMIT = 5000;
const DAY_MS = 86_400_000;

export interface CountryCount {
  country: string;
  iso2: string | null;
  count: number;
}

export interface MarketplaceOverview {
  verifiedSuppliers: number | null;
  activeProducts: number | null;
  activeRequirements: number | null;
  liveAuctions: number | null;
  /** Countries of verified suppliers, most suppliers first. */
  supplierCountries: CountryCount[] | null;
}

export interface CategoryTree {
  top: Category[];
  /** Descendant category ids for each top-level category, so products in subcategories are counted. */
  childIds: Record<string, string[]>;
}

export interface CategoryTile {
  category: Category;
  productCount: number | null;
  /** Photo uploaded for the category, if any. Otherwise the tile shows artwork. */
  imageCandidates: string[];
}

export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  /** Every usable photo of the product. The page picks the first one not already shown elsewhere. */
  imageCandidates: string[];
  priceLabel: string;
  moqLabel: string | null;
  companyName: string;
  companySlug: string;
  city: string | null;
  country: string | null;
  categoryName: string | null;
}

export type SupplierKind = 'manufacturer' | 'supplier';

export interface VerifiedSupplier {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  iso2: string | null;
  tagline: string | null;
  description: string | null;
  businessType: string | null;
  kind: SupplierKind;
  /** Company cover and banner photos. Logos are never used as a stand-in for a factory photo. */
  photoCandidates: string[];
  logoCandidates: string[];
  exportCountryCount: number | null;
  yearsInBusiness: number | null;
  keyProducts: string[];
  productCount: number | null;
  categories: string[];
  isFeatured: boolean;
}

export interface LiveRequirement {
  id: string;
  routeId: string;
  title: string;
  quantity: string;
  location: string | null;
  postedAt: string;
  buyerVerified: boolean;
  categoryName: string | null;
  imageCandidates: string[];
  isNew: boolean;
  isUrgent: boolean;
}

export type AuctionTab = 'live' | 'upcoming' | 'reverse' | 'ended';
export type AuctionPhase = 'live' | 'closing_soon' | 'upcoming' | 'ended';

export interface HomeAuction {
  id: string;
  type: 'forward' | 'reverse';
  title: string;
  phase: AuctionPhase;
  imageCandidates: string[];
  startTime: string | null;
  endTime: string;
  currentBid: number | null;
  startingPrice: number | null;
  totalBids: number;
  quantityLabel: string | null;
}

interface CategoryRow extends Category {
  parent_id: string | null;
}

interface CompanyEmbed {
  id?: string | null;
  owner_id?: string | null;
  company_name: string;
  slug: string;
  city: string | null;
  country: string | null;
  verification_status: string;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  images: string[] | null;
  moq: number | null;
  moq_unit: string | null;
  price_min: number | string | null;
  price_max: number | string | null;
  price_currency: string | null;
  companies: CompanyEmbed | null;
  categories: { name: string } | null;
}

interface CompanyRow {
  id: string;
  owner_id: string | null;
  company_name: string;
  slug: string;
  city: string | null;
  country: string | null;
  tagline: string | null;
  description: string | null;
  business_type: string | null;
  cover_url: string | null;
  banner_url: string | null;
  logo_url: string | null;
  export_destinations: string[] | null;
  years_in_business: number | null;
  key_products: string[] | null;
  is_featured: boolean | null;
}

interface RequirementRow {
  id: string;
  req_number: string | null;
  title: string;
  description: string | null;
  quantity: number | null;
  quantity_unit: string | null;
  destination_city: string | null;
  destination_country: string | null;
  is_verified_buyer: boolean | null;
  created_at: string;
  expires_at: string | null;
  deadline: string | null;
  images: string[] | null;
  categories: { name: string } | null;
}

interface AuctionRow {
  id: string;
  auction_type: string | null;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string;
  current_highest_bid: number | string | null;
  starting_price: number | string | null;
  total_bids: number | null;
  total_quantity: number | null;
  quantity_unit: string | null;
  images: string[] | null;
}

export function isUsableImageUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.trim() === '') return false;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') return false;
    return !BLOCKED_IMAGE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

/** Keeps the usable image URLs, in order, without repeats. */
export function usableImages(candidates: ReadonlyArray<unknown>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of candidates) {
    if (isUsableImageUrl(candidate) && !seen.has(candidate)) {
      seen.add(candidate);
      out.push(candidate);
    }
  }
  return out;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount)}`;
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "2d 4h" for more than a day, "HH:MM:SS" below that. */
export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return 'Ended';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

/** "5 min ago", "3 h ago", "2 d ago". */
export function formatAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPriceLabel(min: number | null, max: number | null, currency: string, unit: string | null): string {
  const low = min ?? max;
  if (low === null) return 'Price on request';
  const high = min !== null && max !== null && max > min ? max : null;
  const amount =
    high === null ? formatMoney(low, currency) : `${formatMoney(low, currency)} – ${formatMoney(high, currency)}`;
  return unit ? `${amount} / ${unit}` : amount;
}

export function supplierKindOf(businessType: string | null | undefined): SupplierKind {
  return /manufactur/i.test(businessType ?? '') ? 'manufacturer' : 'supplier';
}

function groupCountries(values: Array<string | null>): CountryCount[] {
  const byName = new Map<string, CountryCount>();
  for (const value of values) {
    const raw = value?.trim();
    if (!raw) continue;
    const info = findCountry(raw);
    const name = info?.name ?? raw;
    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byName.set(key, { country: name, iso2: info?.iso2 ?? null, count: 1 });
    }
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

/** Count query that returns null instead of throwing, so one failed figure hides only itself. */
async function countOrNull(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number | null> {
  const { count, error } = await query;
  return error ? null : count;
}

let categoryTreeCache: { at: number; value: Promise<CategoryTree> } | null = null;

/** Active categories, cached for five minutes. Shared by the hero, the filters and the tiles. */
export function fetchCategoryTree(): Promise<CategoryTree> {
  if (categoryTreeCache && Date.now() - categoryTreeCache.at < 5 * 60_000) return categoryTreeCache.value;

  const value = (async (): Promise<CategoryTree> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;

    const all = (data ?? []) as unknown as CategoryRow[];
    const topLevel = all.filter((category) => !category.parent_id);
    const top = topLevel.length > 0 ? topLevel : all;

    const childrenOf = new Map<string, string[]>();
    for (const category of all) {
      if (!category.parent_id) continue;
      const siblings = childrenOf.get(category.parent_id) ?? [];
      siblings.push(category.id);
      childrenOf.set(category.parent_id, siblings);
    }
    const descendants = (id: string, seen = new Set<string>()): string[] => {
      for (const childId of childrenOf.get(id) ?? []) {
        if (seen.has(childId)) continue;
        seen.add(childId);
        descendants(childId, seen);
      }
      return [...seen];
    };
    const childIds: Record<string, string[]> = {};
    for (const category of top) childIds[category.id] = descendants(category.id);
    return { top, childIds };
  })();

  categoryTreeCache = { at: Date.now(), value };
  value.catch(() => {
    if (categoryTreeCache?.value === value) categoryTreeCache = null;
  });
  return value;
}

/** Active products of verified, real companies inside the given categories. */
function countProducts(categoryIds?: string[]) {
  let query = supabase
    .from('products')
    .select('id, companies!company_id!inner(owner_id)', { count: 'exact', head: true })
    .eq('is_active', true);
  if (!INCLUDE_TEMPLATE_SEED_DATA) query = query.neq('companies.owner_id', SEED_OWNER_ID);
  if (categoryIds) query = query.in('category_id', categoryIds);
  return query;
}

/** Top categories with the number of active products in each, including their subcategories. */
export async function fetchCategoryTiles(limit = 8): Promise<CategoryTile[]> {
  const tree = await fetchCategoryTree();
  return Promise.all(
    tree.top.slice(0, limit).map(async (category) => {
      const ids = [category.id, ...(tree.childIds[category.id] ?? [])];
      return {
        category,
        productCount: await countOrNull(countProducts(ids)),
        imageCandidates: usableImages([category.image_url]),
      };
    }),
  );
}

export async function fetchMarketplaceOverview(): Promise<MarketplaceOverview> {
  const nowIso = new Date().toISOString();

  let verifiedCount = supabase.from('companies').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified');
  let verifiedRows = supabase.from('companies').select('country').eq('verification_status', 'verified').limit(SCAN_LIMIT);
  let requirementCount = supabase.from('requirements').select('id', { count: 'exact', head: true }).eq('status', 'active');
  if (!INCLUDE_TEMPLATE_SEED_DATA) {
    verifiedCount = verifiedCount.neq('owner_id', SEED_OWNER_ID);
    verifiedRows = verifiedRows.neq('owner_id', SEED_OWNER_ID);
    requirementCount = requirementCount.not('title', 'like', SEEDED_RFQ_TITLE_LIKE);
  }

  const [verified, products, requirements, auctions, supplierRows] = await Promise.all([
    countOrNull(verifiedCount),
    countOrNull(countProducts()),
    countOrNull(requirementCount),
    countOrNull(
      supabase
        .from('auctions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['live', 'closing_soon'])
        .gt('end_time', nowIso),
    ),
    verifiedRows,
  ]);

  const rows =
    supplierRows.error || !Array.isArray(supplierRows.data) || supplierRows.data.length >= SCAN_LIMIT
      ? null
      : (supplierRows.data as unknown as Array<{ country: string | null }>);

  return {
    verifiedSuppliers: verified,
    activeProducts: products,
    activeRequirements: requirements,
    liveAuctions: auctions,
    supplierCountries: rows ? groupCountries(rows.map((row) => row.country)) : null,
  };
}

/**
 * Products of verified, real companies that have at least one usable photo. Featured products come
 * first, then the newest listings. Products without a photo are not published.
 */
export async function fetchFeaturedProducts(
  options: { categoryIds?: string[] | null; limit?: number } = {},
): Promise<FeaturedProduct[]> {
  const limit = options.limit ?? 24;
  let query = supabase
    .from('products')
    .select(
      'id,name,slug,images,moq,moq_unit,price_min,price_max,price_currency,is_featured,created_at,companies!company_id(id,owner_id,company_name,slug,city,country,verification_status),categories!category_id(name)',
    )
    .eq('is_active', true);
  if (options.categoryIds && options.categoryIds.length > 0) {
    query = query.in('category_id', options.categoryIds);
  }
  const { data, error } = await query
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(160);
  if (error) throw error;

  const cards: FeaturedProduct[] = [];
  for (const row of (data ?? []) as unknown as ProductRow[]) {
    const company = row.companies;
    const imageCandidates = usableImages(row.images ?? []);
    if (!company || company.verification_status !== 'verified' || isSeededCompany(company)) continue;
    if (imageCandidates.length === 0 || !row.slug || !company.slug) continue;
    cards.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageCandidates,
      priceLabel: formatPriceLabel(
        toNumber(row.price_min),
        toNumber(row.price_max),
        row.price_currency || 'INR',
        row.moq_unit,
      ),
      moqLabel: row.moq ? `MOQ: ${formatNumber(row.moq)}${row.moq_unit ? ` ${row.moq_unit}` : ''}` : null,
      companyName: company.company_name,
      companySlug: company.slug,
      city: company.city,
      country: company.country,
      categoryName: row.categories?.name ?? null,
    });
    if (cards.length === limit) break;
  }
  return cards;
}

/** Product counts and category names per company, from one query. Counts are hidden when the scan was cut off. */
async function fetchCompanyActivity(
  companyIds: string[],
): Promise<{ counts: Map<string, number>; categories: Map<string, string[]>; complete: boolean }> {
  const counts = new Map<string, number>();
  const categories = new Map<string, string[]>();
  const rowLimit = 3000;
  const { data, error } = await supabase
    .from('products')
    .select('company_id,categories!category_id(name)')
    .eq('is_active', true)
    .in('company_id', companyIds)
    .limit(rowLimit);
  if (error || !Array.isArray(data)) return { counts, categories, complete: false };

  for (const row of data as unknown as Array<{ company_id: string; categories: { name: string } | null }>) {
    counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
    const name = row.categories?.name;
    if (!name) continue;
    const names = categories.get(row.company_id) ?? [];
    if (!names.includes(name) && names.length < 3) names.push(name);
    categories.set(row.company_id, names);
  }
  return { counts, categories, complete: data.length < rowLimit };
}

/**
 * Verified suppliers for the landing page. Only companies whose verification status is "verified",
 * and never the template's demo companies. Photos are the company's own cover and banner images.
 */
export async function fetchVerifiedSuppliers(limit = 60): Promise<VerifiedSupplier[]> {
  let query = supabase
    .from('companies')
    .select(
      'id,owner_id,company_name,slug,city,country,tagline,description,business_type,cover_url,banner_url,logo_url,export_destinations,years_in_business,key_products,is_featured,created_at',
    )
    .eq('verification_status', 'verified');
  if (!INCLUDE_TEMPLATE_SEED_DATA) query = query.neq('owner_id', SEED_OWNER_ID);
  const { data, error } = await query
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = ((data ?? []) as unknown as CompanyRow[]).filter((row) => row.slug && !isSeededCompany(row));
  if (rows.length === 0) return [];

  const activity = await fetchCompanyActivity(rows.map((row) => row.id));
  return rows.map((row) => {
    const info = findCountry(row.country);
    const exportCountries = row.export_destinations?.filter((name) => name?.trim()).length ?? 0;
    return {
      id: row.id,
      name: row.company_name,
      slug: row.slug,
      city: row.city,
      country: info?.name ?? row.country,
      iso2: info?.iso2 ?? null,
      tagline: row.tagline?.trim() || null,
      description: row.description?.trim() || null,
      businessType: row.business_type?.trim() || null,
      kind: supplierKindOf(row.business_type),
      photoCandidates: usableImages([row.cover_url, row.banner_url]),
      logoCandidates: usableImages([row.logo_url]),
      exportCountryCount: exportCountries > 0 ? exportCountries : null,
      yearsInBusiness: row.years_in_business && row.years_in_business > 0 ? row.years_in_business : null,
      keyProducts: (row.key_products ?? []).filter((name) => name?.trim()).slice(0, 4),
      productCount: activity.complete ? (activity.counts.get(row.id) ?? 0) : null,
      categories: activity.categories.get(row.id) ?? [],
      isFeatured: row.is_featured === true,
    };
  });
}

/**
 * Active RFQs. The requirements table holds no buyer contact details, and the buyer's id is never
 * passed on. The template's generated RFQs are left out.
 */
export async function fetchLiveRequirements(
  options: { categoryIds?: string[] | null; limit?: number; newerThanMs?: number } = {},
): Promise<LiveRequirement[]> {
  const limit = options.limit ?? 6;
  let query = supabase.from('requirements').select('*, categories!category_id(name)').eq('status', 'active');
  if (!INCLUDE_TEMPLATE_SEED_DATA) query = query.not('title', 'like', SEEDED_RFQ_TITLE_LIKE);
  if (options.categoryIds && options.categoryIds.length > 0) {
    query = query.in('category_id', options.categoryIds);
  }
  const { data, error } = await query.order('created_at', { ascending: false }).limit(80);
  if (error) throw error;

  const now = Date.now();
  const seenTitles = new Set<string>();
  const items: LiveRequirement[] = [];
  for (const row of (data ?? []) as unknown as RequirementRow[]) {
    const title = row.title?.trim();
    if (!title || TEST_TITLE_PATTERN.test(title) || isSeededRequirement(row)) continue;
    if (row.expires_at && new Date(row.expires_at).getTime() <= now) continue;
    if (options.newerThanMs && now - new Date(row.created_at).getTime() > options.newerThanMs) continue;
    const key = title.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);

    const deadlineMs = row.deadline ? new Date(row.deadline).getTime() : null;
    items.push({
      id: row.id,
      routeId: row.req_number || row.id,
      title,
      quantity: row.quantity
        ? `${formatNumber(row.quantity)}${row.quantity_unit ? ` ${row.quantity_unit}` : ''}`
        : 'Not specified',
      location: [row.destination_city, row.destination_country].filter(Boolean).join(', ') || null,
      postedAt: row.created_at,
      buyerVerified: row.is_verified_buyer === true,
      categoryName: row.categories?.name ?? null,
      imageCandidates: usableImages(row.images ?? []),
      isNew: now - new Date(row.created_at).getTime() < DAY_MS,
      isUrgent: deadlineMs !== null && deadlineMs > now && deadlineMs - now < 7 * DAY_MS,
    });
    if (items.length === limit) break;
  }
  return items;
}

function phaseOf(status: string): AuctionPhase {
  if (status === 'live') return 'live';
  if (status === 'closing_soon') return 'closing_soon';
  if (status === 'scheduled') return 'upcoming';
  return 'ended';
}

/** Auctions for one tab. Simulated auctions are never added. */
export async function fetchAuctions(tab: AuctionTab, limit = 3): Promise<HomeAuction[]> {
  const nowIso = new Date().toISOString();
  let query = supabase
    .from('auctions')
    .select(
      'id,auction_type,title,status,start_time,end_time,current_highest_bid,starting_price,total_bids,total_quantity,quantity_unit,images',
    );
  if (tab === 'live') {
    query = query.in('status', ['live', 'closing_soon']).gt('end_time', nowIso).order('end_time', { ascending: true });
  } else if (tab === 'upcoming') {
    query = query.eq('status', 'scheduled').order('start_time', { ascending: true });
  } else if (tab === 'reverse') {
    query = query
      .eq('auction_type', 'reverse')
      .in('status', ['live', 'closing_soon', 'scheduled'])
      .gt('end_time', nowIso)
      .order('end_time', { ascending: true });
  } else {
    query = query
      .in('status', ['completed', 'awarded', 'no_winner', 'sold', 'concluded', 'unsold'])
      .order('end_time', { ascending: false });
  }
  const { data, error } = await query.limit(limit);
  if (error) throw error;

  return ((data ?? []) as unknown as AuctionRow[]).map((row) => ({
    id: row.id,
    type: row.auction_type === 'forward' ? 'forward' : 'reverse',
    title: row.title,
    phase: phaseOf(row.status),
    imageCandidates: usableImages(row.images ?? []),
    startTime: row.start_time,
    endTime: row.end_time,
    currentBid: toNumber(row.current_highest_bid),
    startingPrice: toNumber(row.starting_price),
    totalBids: row.total_bids ?? 0,
    quantityLabel: row.total_quantity
      ? `${formatNumber(row.total_quantity)} ${row.quantity_unit || 'units'}`
      : null,
  }));
}
