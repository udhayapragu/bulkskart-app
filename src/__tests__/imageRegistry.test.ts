import { describe, expect, it } from 'vitest';
import { LANDING_PHOTOS, type LandingPhoto, validateLandingPhotos } from '@/config/landingImages';
import { createImageRegistry, imageKey } from '@/lib/imageRegistry';

describe('imageKey', () => {
  it('treats the same file at another size or with a cache-buster as the same image', () => {
    const a = imageKey('https://cdn.example.com/photos/plant-1.jpg?w=400&q=80');
    const b = imageKey('https://CDN.example.com/photos/plant-1.jpg?w=1200&t=99');
    expect(a).toBe(b);
  });

  it('keeps parameters that decide which image it is', () => {
    expect(imageKey('https://img.example.com/view?id=1')).not.toBe(imageKey('https://img.example.com/view?id=2'));
  });

  it('ignores a trailing slash and encoded characters', () => {
    expect(imageKey('https://x.test/a%20b/')).toBe(imageKey('https://x.test/a b'));
  });
});

describe('createImageRegistry', () => {
  it('lets the first owner keep an image and refuses everyone else', () => {
    const registry = createImageRegistry();
    expect(registry.claim('suppliers:1:photo', 'https://x.test/a.jpg')).toBe(true);
    expect(registry.claim('products:9:photo', 'https://x.test/a.jpg?w=300')).toBe(false);
    expect(registry.ownerOf('https://x.test/a.jpg')).toBe('suppliers:1:photo');
    expect(registry.refused()).toEqual([
      { url: 'https://x.test/a.jpg?w=300', owner: 'products:9:photo', heldBy: 'suppliers:1:photo' },
    ]);
  });

  it('gives the same answer when the same owner claims again', () => {
    const registry = createImageRegistry();
    expect(registry.claim('a', 'https://x.test/a.jpg')).toBe(true);
    expect(registry.claim('a', 'https://x.test/a.jpg')).toBe(true);
    expect(registry.size()).toBe(1);
    expect(registry.refused()).toHaveLength(0);
  });

  it('ignores empty values', () => {
    const registry = createImageRegistry();
    expect(registry.claim('a', null)).toBe(false);
    expect(registry.claim('a', '  ')).toBe(false);
    expect(registry.size()).toBe(0);
  });

  it('claimFirst skips images that are already used and returns null when none is free', () => {
    const registry = createImageRegistry();
    registry.claim('suppliers:1:photo', 'https://x.test/one.jpg');
    expect(registry.claimFirst('suppliers:2:photo', ['https://x.test/one.jpg', 'https://x.test/two.jpg'])).toBe('https://x.test/two.jpg');
    expect(registry.claimFirst('suppliers:3:photo', ['https://x.test/one.jpg', 'https://x.test/two.jpg'])).toBeNull();
    expect(registry.claimFirst('suppliers:4:photo', [])).toBeNull();
  });

  it('frees a whole group so a section can recompute without clashing with itself', () => {
    const registry = createImageRegistry();
    registry.claim('products:1', 'https://x.test/a.jpg');
    registry.claim('products:2', 'https://x.test/b.jpg');
    registry.claim('suppliers:1', 'https://x.test/c.jpg');
    registry.releaseGroup('products:');
    expect(registry.size()).toBe(1);
    expect(registry.claim('products:3', 'https://x.test/a.jpg')).toBe(true);
  });

  it('never lets a single image appear twice across a realistic page', () => {
    const registry = createImageRegistry();
    const shown: string[] = [];
    const pool = Array.from({ length: 12 }, (_, i) => `https://files.test/img-${i % 7}.jpg`); // deliberate repeats
    pool.forEach((url, i) => {
      const picked = registry.claimFirst(`card:${i}`, [url]);
      if (picked) shown.push(picked);
    });
    expect(new Set(shown.map(imageKey)).size).toBe(shown.length);
    expect(shown).toHaveLength(7);
  });
});

describe('landing photo manifest', () => {
  const photo = (overrides: Partial<LandingPhoto> = {}): LandingPhoto => ({
    src: '/images/landing/hero.webp',
    alt: 'Container terminal at dawn',
    width: 2400,
    height: 1350,
    credit: 'Bulkskart',
    licence: 'Owned by Bulkskart',
    ...overrides,
  });

  it('ships with no photographs claimed, so no section shows a picture it has no right to', () => {
    expect(Object.values(LANDING_PHOTOS).every((entry) => entry === null)).toBe(true);
    expect(validateLandingPhotos(LANDING_PHOTOS)).toEqual([]);
  });

  it('accepts a complete entry', () => {
    expect(validateLandingPhotos({ hero: photo() })).toEqual([]);
  });

  it('rejects the same photograph in two sections', () => {
    const problems = validateLandingPhotos({ hero: photo(), promo: photo({ src: '/images/landing/hero.webp?x=1' }) });
    expect(problems.join(' ')).toMatch(/promo repeats the photograph already used by hero/);
  });

  it('rejects missing credit, licence and alt text', () => {
    const problems = validateLandingPhotos({ hero: photo({ alt: '', credit: ' ', licence: '' }) }).join(' ');
    expect(problems).toMatch(/alt text/);
    expect(problems).toMatch(/credit/);
    expect(problems).toMatch(/licence/);
  });

  it('rejects small, portrait and stock-site photographs', () => {
    expect(validateLandingPhotos({ hero: photo({ width: 800, height: 500 }) }).join(' ')).toMatch(/at least 1600/);
    expect(validateLandingPhotos({ hero: photo({ width: 1700, height: 2400 }) }).join(' ')).toMatch(/portrait/);
    expect(validateLandingPhotos({ hero: photo({ src: 'https://images.unsplash.com/photo-1' }) }).join(' ')).toMatch(/stock-photo site/);
    expect(validateLandingPhotos({ hero: photo({ src: 'http://cdn.example.com/a.jpg' }) }).join(' ')).toMatch(/https/);
  });
});
