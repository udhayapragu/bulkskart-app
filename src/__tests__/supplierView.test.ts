import { describe, expect, it } from 'vitest';
import type { VerifiedSupplier } from '@/lib/homepageData';
import {
  buildSupplierTags,
  categoryOptions,
  countryOptions,
  filterSuppliers,
  NO_FILTERS,
  supplierBadge,
  supplierSummary,
  typeOptions,
} from '@/lib/supplierView';

const supplier = (overrides: Partial<VerifiedSupplier> = {}): VerifiedSupplier => ({
  id: 's1',
  name: 'Fixture Works',
  slug: 'fixture-works',
  city: 'Pune',
  country: 'India',
  iso2: 'IN',
  tagline: null,
  description: null,
  businessType: 'Manufacturer',
  kind: 'manufacturer',
  photoCandidates: [],
  logoCandidates: [],
  exportCountryCount: null,
  yearsInBusiness: null,
  keyProducts: [],
  productCount: null,
  categories: [],
  isFeatured: false,
  ...overrides,
});

describe('buildSupplierTags', () => {
  it('uses only what the record says', () => {
    expect(buildSupplierTags(supplier({ businessType: null }))).toEqual([]);
    expect(buildSupplierTags(supplier({ businessType: 'Manufacturer' }))).toEqual(['Manufacturer']);
  });

  it('splits a combined business type and tidies the capitals', () => {
    expect(buildSupplierTags(supplier({ businessType: 'manufacturer / oem' }))).toEqual(['Manufacturer', 'OEM']);
    expect(buildSupplierTags(supplier({ businessType: 'Exporter, Wholesaler' }))).toEqual(['Exporter', 'Wholesaler']);
  });

  it('adds export reach and years only when recorded, with correct plurals', () => {
    expect(buildSupplierTags(supplier({ exportCountryCount: 1, businessType: null }))).toEqual(['Exports to 1 country']);
    expect(buildSupplierTags(supplier({ exportCountryCount: 6, yearsInBusiness: 12, businessType: null }))).toEqual([
      'Exports to 6 countries',
      '12 yrs in business',
    ]);
  });

  it('never shows more than three tags and never repeats one', () => {
    const tags = buildSupplierTags(
      supplier({ businessType: 'Manufacturer / Manufacturer / OEM / ODM', exportCountryCount: 4, yearsInBusiness: 9 }),
    );
    expect(tags).toHaveLength(3);
    expect(new Set(tags.map((t) => t.toLowerCase())).size).toBe(3);
  });

  it('does not invent a shipping or supply claim', () => {
    const all = buildSupplierTags(supplier({ businessType: 'Wholesaler', exportCountryCount: 2, yearsInBusiness: 3 })).join(' ');
    expect(all).not.toMatch(/worldwide|bulk supply/i);
  });
});

describe('supplierSummary and badge', () => {
  it('prefers the tagline, then a clipped description, then categories, then key products', () => {
    expect(supplierSummary(supplier({ tagline: 'Precision castings' }))).toBe('Precision castings');
    expect(supplierSummary(supplier({ description: 'x'.repeat(300) })).length).toBeLessThanOrEqual(130);
    expect(supplierSummary(supplier({ categories: ['Valves', 'Pumps'] }))).toBe('Valves · Pumps');
    expect(supplierSummary(supplier({ keyProducts: ['Gaskets'] }))).toBe('Gaskets');
    expect(supplierSummary(supplier())).toBe('');
  });

  it('calls manufacturers manufacturers and everyone else a supplier', () => {
    expect(supplierBadge(supplier())).toBe('Verified Manufacturer');
    expect(supplierBadge(supplier({ kind: 'supplier', businessType: 'Wholesaler' }))).toBe('Verified Supplier');
  });
});

describe('filters and options', () => {
  const list = [
    supplier({ id: 'a', name: 'Alpha Packaging', country: 'India', iso2: 'IN', categories: ['Packaging'], businessType: 'Manufacturer' }),
    supplier({ id: 'b', name: 'Beta Textiles', country: 'India', iso2: 'IN', categories: ['Textiles'], businessType: 'Wholesaler', kind: 'supplier' }),
    supplier({ id: 'c', name: 'Gamma Machinery', country: 'Germany', iso2: 'DE', categories: ['Machinery'], keyProducts: ['CNC lathes'], businessType: 'Manufacturer' }),
  ];

  it('returns everything with no filters', () => {
    expect(filterSuppliers(list, NO_FILTERS)).toHaveLength(3);
  });

  it('filters by country, category and type', () => {
    expect(filterSuppliers(list, { ...NO_FILTERS, country: 'India' }).map((s) => s.id)).toEqual(['a', 'b']);
    expect(filterSuppliers(list, { ...NO_FILTERS, category: 'Machinery' }).map((s) => s.id)).toEqual(['c']);
    expect(filterSuppliers(list, { ...NO_FILTERS, type: 'Wholesaler' }).map((s) => s.id)).toEqual(['b']);
  });

  it('searches names, products and places, all words must match', () => {
    expect(filterSuppliers(list, { ...NO_FILTERS, query: 'cnc' }).map((s) => s.id)).toEqual(['c']);
    expect(filterSuppliers(list, { ...NO_FILTERS, query: 'packaging india' }).map((s) => s.id)).toEqual(['a']);
    expect(filterSuppliers(list, { ...NO_FILTERS, query: 'packaging germany' })).toEqual([]);
  });

  it('combines filters', () => {
    expect(filterSuppliers(list, { country: 'India', query: 'textile', category: 'Textiles', type: 'Wholesaler' }).map((s) => s.id)).toEqual(['b']);
  });

  it('lists the countries present, most suppliers first, and the menus without duplicates', () => {
    expect(countryOptions(list)).toEqual([
      { country: 'India', iso2: 'IN', count: 2 },
      { country: 'Germany', iso2: 'DE', count: 1 },
    ]);
    expect(categoryOptions(list)).toEqual(['Machinery', 'Packaging', 'Textiles']);
    expect(typeOptions(list)).toEqual(['Manufacturer', 'Wholesaler']);
  });
});
