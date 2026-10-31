import type { VerifiedSupplier } from '@/lib/homepageData';

/**
 * Presentation helpers for supplier cards. Every label is built from a recorded field. Nothing here
 * can add a claim (such as "OEM" or "Worldwide Shipping") that the company's record does not support.
 */

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (_match, lead: string, letter: string) => `${lead}${letter.toUpperCase()}`)
    .replace(/\bOem\b/g, 'OEM')
    .replace(/\bOdm\b/g, 'ODM');
}

/** Up to three short tags: business type words, export reach and years in business. */
export function buildSupplierTags(supplier: VerifiedSupplier): string[] {
  const tags: string[] = [];
  const add = (tag: string) => {
    if (tag && tags.length < 3 && !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) tags.push(tag);
  };
  for (const part of (supplier.businessType ?? '').split(/[/,&]|\band\b/i)) add(titleCase(part.trim()));
  if (supplier.exportCountryCount) {
    add(`Exports to ${supplier.exportCountryCount} ${supplier.exportCountryCount === 1 ? 'country' : 'countries'}`);
  }
  if (supplier.yearsInBusiness) add(`${supplier.yearsInBusiness} yrs in business`);
  return tags;
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** One line under the company name: its own tagline or description, else what it sells. */
export function supplierSummary(supplier: VerifiedSupplier): string {
  const main =
    supplier.tagline ||
    (supplier.description ? clip(supplier.description, 130) : '') ||
    supplier.categories.join(' · ') ||
    supplier.keyProducts.join(' · ');
  return main;
}

/** The label above a card: manufacturers are called manufacturers, everyone else a supplier. */
export function supplierBadge(supplier: VerifiedSupplier): string {
  return supplier.kind === 'manufacturer' ? 'Verified Manufacturer' : 'Verified Supplier';
}

export interface SupplierFilters {
  country: string; // 'all' or a country name
  query: string;
  category: string; // 'all' or a category name
  type: string; // 'all' or a business type
}

export const NO_FILTERS: SupplierFilters = { country: 'all', query: '', category: 'all', type: 'all' };

export function filterSuppliers<T extends VerifiedSupplier>(suppliers: T[], filters: SupplierFilters): T[] {
  const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  return suppliers.filter((supplier) => {
    if (filters.country !== 'all' && supplier.country !== filters.country) return false;
    if (filters.category !== 'all' && !supplier.categories.includes(filters.category)) return false;
    if (filters.type !== 'all' && supplier.businessType !== filters.type) return false;
    if (words.length === 0) return true;
    const haystack = [
      supplier.name,
      supplier.tagline,
      supplier.description,
      supplier.businessType,
      supplier.city,
      supplier.country,
      ...supplier.categories,
      ...supplier.keyProducts,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

export interface CountryOption {
  country: string;
  iso2: string | null;
  count: number;
}

/** Countries of the suppliers on the page, most suppliers first. */
export function countryOptions(suppliers: VerifiedSupplier[]): CountryOption[] {
  const byCountry = new Map<string, CountryOption>();
  for (const supplier of suppliers) {
    if (!supplier.country) continue;
    const existing = byCountry.get(supplier.country);
    if (existing) existing.count += 1;
    else byCountry.set(supplier.country, { country: supplier.country, iso2: supplier.iso2, count: 1 });
  }
  return [...byCountry.values()].sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

/** Distinct values, alphabetical, for the category and supplier-type menus. */
export function categoryOptions(suppliers: VerifiedSupplier[]): string[] {
  return [...new Set(suppliers.flatMap((supplier) => supplier.categories))].sort((a, b) => a.localeCompare(b));
}

export function typeOptions(suppliers: VerifiedSupplier[]): string[] {
  return [...new Set(suppliers.map((supplier) => supplier.businessType).filter((type): type is string => Boolean(type)))].sort((a, b) =>
    a.localeCompare(b),
  );
}
