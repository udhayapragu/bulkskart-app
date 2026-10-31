/**
 * Licensed photographs for the landing page backgrounds.
 *
 * Bulkskart's repository contains no factory, port or warehouse photography, and the page never
 * borrows pictures from stock sites, AI generators or other businesses. Each section therefore
 * ships with original artwork. To use real photography instead:
 *
 *   1. Put the file in public/images/landing/ (JPG or WebP, at least 1600 px wide).
 *   2. Fill in its entry below with an honest alt text, the credit and the licence you hold.
 *
 * Each section needs its own photograph. validateLandingPhotos() rejects the same file in two
 * sections, missing credits or licences, small files and stock-site hosts, and a test enforces it.
 */

export type LandingSlot = 'hero' | 'suppliers' | 'products' | 'market' | 'categories' | 'promo';

export interface LandingPhoto {
  /** Path under /public (for example /images/landing/hero.webp) or an https URL you control. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Photographer or rights holder. */
  credit: string;
  /** Licence or permission you hold, for example "Owned by Bulkskart" or "CC BY 4.0". */
  licence: string;
}

export const LANDING_SLOTS: readonly LandingSlot[] = ['hero', 'suppliers', 'products', 'market', 'categories', 'promo'];

export const LANDING_PHOTOS: Record<LandingSlot, LandingPhoto | null> = {
  hero: null,
  suppliers: null,
  products: null,
  market: null,
  categories: null,
  promo: null,
};

const MIN_PHOTO_WIDTH = 1600;
const STOCK_HOSTS = ['unsplash.com', 'pexels.com', 'pixabay.com', 'shutterstock.com', 'gettyimages.com', 'istockphoto.com', 'adobestock.com'];

/** Returns a list of problems. An empty list means the manifest is safe to publish. */
export function validateLandingPhotos(photos: Record<string, LandingPhoto | null>): string[] {
  const problems: string[] = [];
  const seen = new Map<string, string>();
  for (const [slot, photo] of Object.entries(photos)) {
    if (!photo) continue;
    const key = photo.src.trim().toLowerCase().split('?')[0];
    const earlier = seen.get(key);
    if (earlier) problems.push(`${slot} repeats the photograph already used by ${earlier}`);
    else seen.set(key, slot);
    if (!photo.alt.trim()) problems.push(`${slot} needs an alt text`);
    if (!photo.credit.trim()) problems.push(`${slot} needs a credit`);
    if (!photo.licence.trim()) problems.push(`${slot} needs the licence or permission you hold`);
    if (photo.width < MIN_PHOTO_WIDTH) problems.push(`${slot} is ${photo.width}px wide; use at least ${MIN_PHOTO_WIDTH}px`);
    if (photo.width < photo.height) problems.push(`${slot} is portrait; section backgrounds need a landscape photograph`);
    if (/^https?:\/\//i.test(photo.src)) {
      try {
        const { protocol, hostname } = new URL(photo.src);
        if (protocol !== 'https:') problems.push(`${slot} must use https`);
        if (STOCK_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
          problems.push(`${slot} points at a stock-photo site`);
        }
      } catch {
        problems.push(`${slot} is not a valid URL`);
      }
    } else if (!photo.src.startsWith('/')) {
      problems.push(`${slot} must be an https URL or a path starting with /`);
    }
  }
  return problems;
}
