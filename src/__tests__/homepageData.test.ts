import { beforeEach, describe, expect, it, vi } from 'vitest';

type Call = [method: string, args: unknown[]];
interface Recorded {
  table: string;
  calls: Call[];
}

const state = vi.hoisted(() => ({
  results: {} as Record<string, { data?: unknown; error?: unknown; count?: number | null }>,
  log: [] as Array<{ table: string; calls: Array<[string, unknown[]]> }>,
}));

vi.mock('@/db/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const calls: Array<[string, unknown[]]> = [];
      state.log.push({ table, calls });
      const result = state.results[table] ?? { data: [], error: null, count: 0 };
      // A chainable, awaitable stand-in for the query builder that records every call.
      const builder: unknown = new Proxy(
        {},
        {
          get(_target, property: string) {
            if (property === 'then') {
              return (resolve: (value: unknown) => void) =>
                resolve({ data: result.data ?? null, error: result.error ?? null, count: result.count ?? null });
            }
            return (...args: unknown[]) => {
              calls.push([property, args]);
              return builder;
            };
          },
        },
      );
      return builder;
    },
  },
}));

import {
  fetchFeaturedProducts,
  fetchLiveRequirements,
  fetchMarketplaceOverview,
  fetchVerifiedSuppliers,
  formatAgo,
  formatPriceLabel,
  isUsableImageUrl,
  supplierKindOf,
  usableImages,
} from '@/lib/homepageData';
import { SEED_OWNER_ID } from '@/lib/seedData';

const queriesFor = (table: string): Recorded[] => state.log.filter((entry) => entry.table === table);
const used = (entry: Recorded, method: string, ...args: unknown[]) =>
  entry.calls.some(([name, params]) => name === method && args.every((arg, i) => params[i] === arg));

beforeEach(() => {
  state.results = {};
  state.log.length = 0;
});

describe('image URL rules', () => {
  it('accepts https photos and rejects everything else', () => {
    expect(isUsableImageUrl('https://files.example.com/plant.jpg')).toBe(true);
    expect(isUsableImageUrl('http://files.example.com/plant.jpg')).toBe(false);
    expect(isUsableImageUrl('not a url')).toBe(false);
    expect(isUsableImageUrl('')).toBe(false);
    expect(isUsableImageUrl(null)).toBe(false);
  });

  it.each(['https://images.unsplash.com/photo-1', 'https://cdn.pixabay.com/photo/a.jpg', 'https://images.pexels.com/p.jpg', 'https://miaoda-site-img.s3cdn.medo.dev/a.jpg'])(
    'never accepts stock or AI image hosts: %s',
    (url) => {
      expect(isUsableImageUrl(url)).toBe(false);
    },
  );

  it('keeps usable photos in order without repeats', () => {
    expect(usableImages(['https://a.test/1.jpg', null, 'https://a.test/1.jpg', 'https://images.unsplash.com/x', 'https://a.test/2.jpg'])).toEqual([
      'https://a.test/1.jpg',
      'https://a.test/2.jpg',
    ]);
  });
});

describe('formatting', () => {
  it('labels prices honestly', () => {
    expect(formatPriceLabel(null, null, 'INR', 'kg')).toBe('Price on request');
    expect(formatPriceLabel(100, null, 'INR', 'kg')).toMatch(/100/);
    expect(formatPriceLabel(100, 150, 'INR', 'kg')).toMatch(/100.*150.*\/ kg/);
    expect(formatPriceLabel(100, 100, 'INR', null)).not.toMatch(/–/);
  });

  it('describes how long ago something happened', () => {
    const now = new Date('2026-01-01T12:00:00Z').getTime();
    expect(formatAgo('2026-01-01T11:59:40Z', now)).toBe('Just now');
    expect(formatAgo('2026-01-01T11:30:00Z', now)).toBe('30 min ago');
    expect(formatAgo('2026-01-01T09:00:00Z', now)).toBe('3 h ago');
    expect(formatAgo('2025-12-30T12:00:00Z', now)).toBe('2 d ago');
  });

  it('tells manufacturers from other suppliers by the recorded business type', () => {
    expect(supplierKindOf('Manufacturer')).toBe('manufacturer');
    expect(supplierKindOf('Manufacturer / OEM')).toBe('manufacturer');
    expect(supplierKindOf('Wholesaler')).toBe('supplier');
    expect(supplierKindOf(null)).toBe('supplier');
  });
});

const company = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  owner_id: '17e26280-f765-4e40-ae9f-698b8e645260',
  company_name: 'Test Works Ltd',
  slug: 'test-works',
  city: 'Pune',
  country: 'India',
  tagline: 'Fixture tagline',
  description: null,
  business_type: 'Manufacturer',
  cover_url: 'https://files.test/c1-cover.jpg',
  banner_url: null,
  logo_url: 'https://files.test/c1-logo.png',
  export_destinations: ['Germany', 'Japan'],
  years_in_business: 12,
  key_products: ['Valves'],
  is_featured: false,
  ...overrides,
});

describe('fetchVerifiedSuppliers', () => {
  it('asks only for verified companies and leaves out the template demo companies', async () => {
    state.results.companies = { data: [company()] };
    await fetchVerifiedSuppliers();
    const [query] = queriesFor('companies');
    expect(used(query, 'eq', 'verification_status', 'verified')).toBe(true);
    expect(used(query, 'neq', 'owner_id', SEED_OWNER_ID)).toBe(true);
  });

  it('drops a demo company even if the server returned it', async () => {
    state.results.companies = {
      data: [company(), company({ id: 'e1000001-0000-0000-0000-000000000003', owner_id: SEED_OWNER_ID, slug: 'demo-co' })],
    };
    const suppliers = await fetchVerifiedSuppliers();
    expect(suppliers.map((s) => s.slug)).toEqual(['test-works']);
  });

  it('maps only recorded facts and never uses a logo as a factory photo', async () => {
    state.results.companies = { data: [company({ cover_url: null, banner_url: null })] };
    state.results.products = {
      data: [
        { company_id: 'c1', categories: { name: 'Valves' } },
        { company_id: 'c1', categories: { name: 'Pumps' } },
        { company_id: 'c1', categories: { name: 'Valves' } },
      ],
    };
    const [supplier] = await fetchVerifiedSuppliers();
    expect(supplier.photoCandidates).toEqual([]);
    expect(supplier.logoCandidates).toEqual(['https://files.test/c1-logo.png']);
    expect(supplier).toMatchObject({
      name: 'Test Works Ltd',
      country: 'India',
      iso2: 'IN',
      kind: 'manufacturer',
      exportCountryCount: 2,
      yearsInBusiness: 12,
      productCount: 3,
      categories: ['Valves', 'Pumps'],
    });
  });

  it('keeps stock-photo links out of the candidates', async () => {
    state.results.companies = {
      data: [company({ cover_url: 'https://images.unsplash.com/photo-1', banner_url: 'https://files.test/own-banner.jpg' })],
    };
    const [supplier] = await fetchVerifiedSuppliers();
    expect(supplier.photoCandidates).toEqual(['https://files.test/own-banner.jpg']);
  });

  it('returns nothing, without further queries, when no real verified supplier exists', async () => {
    state.results.companies = { data: [] };
    expect(await fetchVerifiedSuppliers()).toEqual([]);
    expect(queriesFor('products')).toHaveLength(0);
  });

  it('reports a failed query instead of pretending there are no suppliers', async () => {
    state.results.companies = { error: new Error('boom') };
    await expect(fetchVerifiedSuppliers()).rejects.toThrow('boom');
  });
});

describe('fetchFeaturedProducts', () => {
  const product = (id: string, companyOverrides: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) => ({
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    images: [`https://files.test/${id}.jpg`],
    moq: 100,
    moq_unit: 'kg',
    price_min: 50,
    price_max: 60,
    price_currency: 'INR',
    companies: {
      id: 'c1',
      owner_id: '17e26280-f765-4e40-ae9f-698b8e645260',
      company_name: 'Test Works Ltd',
      slug: 'test-works',
      city: 'Pune',
      country: 'India',
      verification_status: 'verified',
      ...companyOverrides,
    },
    categories: { name: 'Valves' },
    ...overrides,
  });

  it('shows only products of verified, real companies that have a photo', async () => {
    state.results.products = {
      data: [
        product('ok'),
        product('unverified', { verification_status: 'pending' }),
        product('demo', { owner_id: SEED_OWNER_ID }),
        product('nophoto', {}, { images: [] }),
        product('stockphoto', {}, { images: ['https://images.unsplash.com/photo-9'] }),
      ],
    };
    const products = await fetchFeaturedProducts();
    expect(products.map((p) => p.id)).toEqual(['ok']);
    expect(products[0]).toMatchObject({ moqLabel: 'MOQ: 100 kg', companyName: 'Test Works Ltd', categoryName: 'Valves' });
  });
});

describe('fetchLiveRequirements', () => {
  const rfq = (overrides: Record<string, unknown> = {}) => ({
    id: 'r1',
    req_number: 'BS-1',
    title: 'HR steel coil',
    description: 'Mill test certificates needed.',
    quantity: 20,
    quantity_unit: 'MT',
    destination_city: 'Chennai',
    destination_country: 'India',
    is_verified_buyer: true,
    created_at: new Date().toISOString(),
    expires_at: null,
    deadline: null,
    images: null,
    categories: { name: 'Steel' },
    ...overrides,
  });

  it('asks the server to skip the generated RFQs and keeps buyer ids out of the result', async () => {
    state.results.requirements = { data: [rfq()] };
    const items = await fetchLiveRequirements();
    const [query] = queriesFor('requirements');
    expect(used(query, 'eq', 'status', 'active')).toBe(true);
    expect(used(query, 'not', 'title', 'like', '% - Lot #%')).toBe(true);
    expect(Object.keys(items[0])).not.toContain('buyer_id');
    expect(items[0]).toMatchObject({ title: 'HR steel coil', quantity: '20 MT', location: 'Chennai, India', buyerVerified: true });
  });

  it('drops generated, test and repeated RFQs even if the server returned them', async () => {
    state.results.requirements = {
      data: [
        rfq({ id: 'a', title: 'Bulk Cotton Fabric Roll - Lot #50077' }),
        rfq({ id: 'b', title: 'Test requirement' }),
        rfq({ id: 'c', title: 'Cotton yarn', description: 'Requirement from India. Looking for verified manufacturers for bulk supply.' }),
        rfq({ id: 'd', title: 'Copper wire' }),
        rfq({ id: 'e', title: 'copper wire' }),
        rfq({ id: 'f', title: 'Expired lot', expires_at: '2000-01-01T00:00:00Z' }),
      ],
    };
    const items = await fetchLiveRequirements({ limit: 10 });
    expect(items.map((i) => i.id)).toEqual(['d']);
  });

  it('can limit results to recent leads', async () => {
    const old = new Date(Date.now() - 5 * 86_400_000).toISOString();
    state.results.requirements = { data: [rfq({ id: 'new' }), rfq({ id: 'old', title: 'Aluminium ingots', created_at: old })] };
    const items = await fetchLiveRequirements({ newerThanMs: 2 * 86_400_000 });
    expect(items.map((i) => i.id)).toEqual(['new']);
  });
});

describe('fetchMarketplaceOverview', () => {
  it('counts only real, verified suppliers and real RFQs, and reports unavailable figures as null', async () => {
    state.results.companies = { data: [{ country: 'India' }, { country: 'India' }, { country: 'Germany' }], count: 3 };
    state.results.products = { count: 41 };
    state.results.requirements = { count: 7 };
    state.results.auctions = { error: new Error('no access') };

    const overview = await fetchMarketplaceOverview();
    expect(overview).toMatchObject({ verifiedSuppliers: 3, activeProducts: 41, activeRequirements: 7, liveAuctions: null });
    expect(overview.supplierCountries?.map((c) => [c.country, c.count])).toEqual([
      ['India', 2],
      ['Germany', 1],
    ]);

    const companyQueries = queriesFor('companies');
    expect(companyQueries.length).toBe(2);
    for (const query of companyQueries) {
      expect(used(query, 'eq', 'verification_status', 'verified')).toBe(true);
      expect(used(query, 'neq', 'owner_id', SEED_OWNER_ID)).toBe(true);
    }
    const [productQuery] = queriesFor('products');
    expect(used(productQuery, 'neq', 'companies.owner_id', SEED_OWNER_ID)).toBe(true);
    const [requirementQuery] = queriesFor('requirements');
    expect(used(requirementQuery, 'not', 'title', 'like', '% - Lot #%')).toBe(true);
  });
});
