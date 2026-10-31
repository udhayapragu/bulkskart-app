import { vi } from 'vitest';
import type { CategoryTile, FeaturedProduct, HomeAuction, LiveRequirement, MarketplaceOverview, VerifiedSupplier } from '@/lib/homepageData';

/** Browser features jsdom lacks, and a loader state, shared by the landing page tests. */
export function installBrowserStubs() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  const observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver = observer as unknown as typeof IntersectionObserver;
  globalThis.ResizeObserver = observer as unknown as typeof ResizeObserver;
}

export const ready = <T,>(data: T) => ({ data, loading: false, failed: false, updatedAt: Date.now(), retry: vi.fn() });
export const waiting = () => ({ data: null, loading: true, failed: false, updatedAt: null, retry: vi.fn() });
export const broken = () => ({ data: null, loading: false, failed: true, updatedAt: null, retry: vi.fn() });

export const supplier = (n: number, overrides: Partial<VerifiedSupplier> = {}): VerifiedSupplier => ({
  id: `s${n}`,
  name: `Supplier ${n}`,
  slug: `supplier-${n}`,
  city: 'Pune',
  country: n % 2 ? 'India' : 'Germany',
  iso2: n % 2 ? 'IN' : 'DE',
  tagline: `Tagline ${n}`,
  description: null,
  businessType: n % 2 ? 'Manufacturer' : 'Wholesaler',
  kind: n % 2 ? 'manufacturer' : 'supplier',
  photoCandidates: [`https://files.test/supplier-${n}.jpg`],
  logoCandidates: [`https://files.test/logo-${n}.png`],
  exportCountryCount: null,
  yearsInBusiness: null,
  keyProducts: [],
  productCount: 3,
  categories: [n % 2 ? 'Packaging' : 'Machinery'],
  isFeatured: false,
  ...overrides,
});

export const overview = (overrides: Partial<MarketplaceOverview> = {}): MarketplaceOverview => ({
  verifiedSuppliers: 4,
  activeProducts: 21,
  activeRequirements: 5,
  liveAuctions: 2,
  supplierCountries: [
    { country: 'India', iso2: 'IN', count: 2 },
    { country: 'Germany', iso2: 'DE', count: 2 },
  ],
  ...overrides,
});

export const product = (n: number, overrides: Partial<FeaturedProduct> = {}): FeaturedProduct => ({
  id: `p${n}`,
  name: `Product ${n}`,
  slug: `product-${n}`,
  imageCandidates: [`https://files.test/product-${n}.jpg`],
  priceLabel: '₹100 / kg',
  moqLabel: 'MOQ: 50 kg',
  companyName: 'Supplier 1',
  companySlug: 'supplier-1',
  city: 'Pune',
  country: 'India',
  categoryName: 'Packaging',
  ...overrides,
});

export const rfq = (n: number, overrides: Partial<LiveRequirement> = {}): LiveRequirement => ({
  id: `r${n}`,
  routeId: `RFQ-${n}`,
  title: `Requirement ${n}`,
  quantity: '20 MT',
  location: 'Chennai, India',
  postedAt: new Date().toISOString(),
  buyerVerified: false,
  categoryName: 'Steel',
  imageCandidates: [],
  isNew: true,
  isUrgent: false,
  ...overrides,
});

export const auction = (n: number, overrides: Partial<HomeAuction> = {}): HomeAuction => ({
  id: `a${n}`,
  type: 'reverse',
  title: `Auction ${n}`,
  phase: 'live',
  imageCandidates: [],
  startTime: null,
  endTime: new Date(Date.now() + 3_600_000).toISOString(),
  currentBid: null,
  startingPrice: 1000,
  totalBids: 0,
  quantityLabel: null,
  ...overrides,
});

export const tile = (n: number, overrides: Partial<CategoryTile> = {}): CategoryTile => ({
  category: {
    id: `c${n}`,
    name: `Category ${n}`,
    slug: `category-${n}`,
    parent_id: null,
    icon: null,
    image_url: null,
    description: null,
    sort_order: n,
    is_active: true,
    product_count: 0,
    created_at: '2026-01-01T00:00:00Z',
  },
  productCount: 10,
  imageCandidates: [],
  ...overrides,
});
