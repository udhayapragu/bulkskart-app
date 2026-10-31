import { supabase } from '@/db/supabase';
import type { Category } from '@/types/types';

/** Stock and AI image hosts. Photos from these hosts are never shown on the homepage. */
const BLOCKED_IMAGE_HOSTS = ['pixabay.com', 'unsplash.com', 'pexels.com'];
/** Test and debug RFQs stay out of public listings, matching getRequirements. */
const TEST_TITLE_PATTERN = /\b(test|debug|timed|timeout)\b/i;
/** Country scan size. A result this large is treated as incomplete, so the countries figure is hidden. */
const COUNTRY_SCAN_LIMIT = 5000;

export interface CountryCount {
  country: string;
  count: number;
}

export interface MarketplaceOverview {
  verifiedManufacturers: number | null;
  activeProducts: number | null;
  activeRequirements: number | null;
  countries: CountryCount[] | null;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  priceLabel: string;
  moqLabel: string | null;
  companyName: string;
  companySlug: string;
  country: string | null;
  categoryName: string | null;
}

export interface VerifiedManufacturer {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  tagline: string | null;
  image: string;
  imageIsLogo: boolean;
  categories: string[];
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
}

export interface LiveAuction {
  id: string;
  type: 'forward' | 'reverse';
  title: string;
  status: 'live' | 'closing_soon';
  image: string | null;
  endTime: string;
  currentBid: number | null;
  startingPrice: number | null;
  totalBids: number;
  quantityLabel: string | null;
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
  companies: { company_name: string; slug: string; country: string | null; verification_status: string } | null;
  categories: { name: string } | null;
}

interface CompanyRow {
  id: string;
  company_name: string;
  slug: string;
  city: string | null;
  country: string | null;
  tagline: string | null;
  cover_url: string | null;
  banner_url: string | null;
  logo_url: string | null;
}

interface RequirementRow {
  id: string;
  req_number: string | null;
  title: string;
  quantity: number | null;
  quantity_unit: string | null;
  destination_city: string | null;
  destination_country: string | null;
  is_verified_buyer: boolean | null;
  created_at: string;
  expires_at: string | null;
  categories: { name: string } | null;
}

interface AuctionRow {
  id: string;
  auction_type: string | null;
  title: string;
  status: string;
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
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return !BLOCKED_IMAGE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function firstUsableImage(candidates: unknown[]): string | null {
  return candidates.find(isUsableImageUrl) ?? null;
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

/** "2d 4h" for auctions with more than a day left, "HH:MM:SS" below that. */
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

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPriceLabel(min: number | null, max: number | null, currency: string, unit: string | null): string {
  const low = min ?? max;
  if (low === null) return 'Price on request';
  const high = min !== null && max !== null && max > min ? max : null;
  const amount =
    high === null
      ? formatMoney(low, currency)
      : `${formatMoney(low, currency)} – ${formatMoney(high, currency)}`;
  return unit ? `${amount} / ${unit}` : amount;
}

function groupCountries(rows: { country: string | null }[]): CountryCount[] {
  const byName = new Map<string, CountryCount>();
  for (const row of rows) {
    const name = row.country?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byName.set(key, { country: name, count: 1 });
    }
  }
  return [...byName.values()].sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

/** Count query that returns null instead of throwing, so one failed figure hides only itself. */
async function countOrNull(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  const { count, error } = await query;
  return error ? null : count;
}

export async function fetchMarketplaceOverview(): Promise<MarketplaceOverview> {
  const [verified, products, requirements, companyCountries] = await Promise.all([
    countOrNull(
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    ),
    countOrNull(supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true)),
    countOrNull(supabase.from('requirements').select('id', { count: 'exact', head: true }).eq('status', 'active')),
    supabase.from('companies').select('country').eq('verification_status', 'verified').limit(COUNTRY_SCAN_LIMIT),
  ]);

  const rows =
    companyCountries.error || !Array.isArray(companyCountries.data)
      ? null
      : (companyCountries.data as { country: string | null }[]);
  const countries = rows && rows.length < COUNTRY_SCAN_LIMIT ? groupCountries(rows) : null;

  return {
    verifiedManufacturers: verified,
    activeProducts: products,
    activeRequirements: requirements,
    countries,
  };
}

/** Products with a real photo from a verified manufacturer. Products without a photo are not published. */
export async function fetchFeaturedProducts(limit = 8): Promise<FeaturedProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id,name,slug,images,moq,moq_unit,price_min,price_max,price_currency,created_at,companies!company_id(company_name,slug,country,verification_status),categories!category_id(name)',
    )
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;

  const cards: FeaturedProduct[] = [];
  for (const row of (data ?? []) as unknown as ProductRow[]) {
    const company = row.companies;
    const image = firstUsableImage(row.images ?? []);
    if (!company || company.verification_status !== 'verified' || !image || !row.slug || !company.slug) continue;
    cards.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      image,
      priceLabel: formatPriceLabel(
        toNumber(row.price_min),
        toNumber(row.price_max),
        row.price_currency || 'INR',
        row.moq_unit,
      ),
      moqLabel: row.moq ? `MOQ ${formatNumber(row.moq)}${row.moq_unit ? ` ${row.moq_unit}` : ''}` : null,
      companyName: company.company_name,
      companySlug: company.slug,
      country: company.country,
      categoryName: row.categories?.name ?? null,
    });
    if (cards.length === limit) break;
  }
  return cards;
}

async function fetchCompanyCategories(companyIds: string[]): Promise<Map<string, string[]>> {
  const byCompany = new Map<string, string[]>();
  const { data, error } = await supabase
    .from('products')
    .select('company_id,categories!category_id(name)')
    .eq('is_active', true)
    .in('company_id', companyIds)
    .limit(500);
  if (error || !Array.isArray(data)) return byCompany;

  for (const row of data as unknown as Array<{ company_id: string; categories: { name: string } | null }>) {
    const name = row.categories?.name;
    if (!name) continue;
    const names = byCompany.get(row.company_id) ?? [];
    if (!names.includes(name) && names.length < 3) names.push(name);
    byCompany.set(row.company_id, names);
  }
  return byCompany;
}

/** Verified manufacturers that have a real company photo or logo. */
export async function fetchVerifiedManufacturers(limit = 6): Promise<VerifiedManufacturer[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id,company_name,slug,city,country,tagline,cover_url,banner_url,logo_url,is_featured,created_at')
    .eq('verification_status', 'verified')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;

  const picked: Array<{ row: CompanyRow; image: string; imageIsLogo: boolean }> = [];
  for (const row of (data ?? []) as CompanyRow[]) {
    if (!row.slug) continue;
    const photo = firstUsableImage([row.cover_url, row.banner_url]);
    const image = photo ?? firstUsableImage([row.logo_url]);
    if (!image) continue;
    picked.push({ row, image, imageIsLogo: photo === null });
    if (picked.length === limit) break;
  }
  if (picked.length === 0) return [];

  const categoriesByCompany = await fetchCompanyCategories(picked.map((entry) => entry.row.id));
  return picked.map(({ row, image, imageIsLogo }) => ({
    id: row.id,
    name: row.company_name,
    slug: row.slug,
    city: row.city,
    country: row.country,
    tagline: row.tagline,
    image,
    imageIsLogo,
    categories: categoriesByCompany.get(row.id) ?? [],
  }));
}

/** Active RFQs. Buyer contact details are not selected, so they never reach the browser. */
export async function fetchLiveRequirements(limit = 6): Promise<LiveRequirement[]> {
  const { data, error } = await supabase
    .from('requirements')
    .select(
      'id,req_number,title,quantity,quantity_unit,destination_city,destination_country,is_verified_buyer,created_at,expires_at,categories!category_id(name)',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;

  const now = Date.now();
  const seenTitles = new Set<string>();
  const items: LiveRequirement[] = [];
  for (const row of (data ?? []) as unknown as RequirementRow[]) {
    const title = row.title?.trim();
    if (!title || TEST_TITLE_PATTERN.test(title)) continue;
    if (row.expires_at && new Date(row.expires_at).getTime() <= now) continue;
    const key = title.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
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
    });
    if (items.length === limit) break;
  }
  return items;
}

/** Auctions that are live or closing soon. Simulated auctions are never added here. */
export async function fetchLiveAuctions(limit = 6): Promise<LiveAuction[]> {
  const { data, error } = await supabase
    .from('auctions')
    .select(
      'id,auction_type,title,status,end_time,current_highest_bid,starting_price,total_bids,total_quantity,quantity_unit,images',
    )
    .in('status', ['live', 'closing_soon'])
    .gt('end_time', new Date().toISOString())
    .order('end_time', { ascending: true })
    .limit(limit);
  if (error) throw error;

  return ((data ?? []) as AuctionRow[]).map((row) => ({
    id: row.id,
    type: row.auction_type === 'forward' ? 'forward' : 'reverse',
    title: row.title,
    status: row.status === 'closing_soon' ? 'closing_soon' : 'live',
    image: firstUsableImage(row.images ?? []),
    endTime: row.end_time,
    currentBid: toNumber(row.current_highest_bid),
    startingPrice: toNumber(row.starting_price),
    totalBids: row.total_bids ?? 0,
    quantityLabel: row.total_quantity
      ? `${formatNumber(row.total_quantity)} ${row.quantity_unit || 'units'}`
      : null,
  }));
}

/** Top-level categories from the database. Falls back to every category if none are top-level. */
export async function fetchTopCategories(limit = 8): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  const categories = (data ?? []) as Category[];
  const topLevel = categories.filter((category) => !category.parent_id);
  return (topLevel.length > 0 ? topLevel : categories).slice(0, limit);
}
