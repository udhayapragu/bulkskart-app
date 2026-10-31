import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auction, installBrowserStubs, overview, product, ready, rfq, supplier, tile, waiting } from './landingTestKit';

const hooks = vi.hoisted(() => ({
  useMarketplaceOverview: vi.fn(),
  useVerifiedSuppliers: vi.fn(),
  useFeaturedProducts: vi.fn(),
  useCategoryTree: vi.fn(),
  useLiveRequirements: vi.fn(),
  useAuctions: vi.fn(),
  useCategoryTiles: vi.fn(),
}));
vi.mock('@/hooks/useHomepageData', () => hooks);
// The data helpers import the Supabase client, which refuses to start without env config.
vi.mock('@/db/supabase', () => ({ supabase: {} }));
vi.mock('@/components/home/hero/EarthGlobe', () => ({ default: () => null }));
vi.mock('@/components/home/OrderBenefitsSection', () => ({ default: () => null }));
vi.mock('@/components/home/PostRequirementsHomeSection', () => ({ default: () => null }));
vi.mock('@/components/home/SeoOverview', () => ({ default: () => null }));

import LandingSections from '@/components/landing/LandingSections';
import { imageKey, landingImages } from '@/lib/imageRegistry';

beforeAll(() => installBrowserStubs());
beforeEach(() => {
  landingImages.clear();
  hooks.useMarketplaceOverview.mockReturnValue(ready(overview()));
  hooks.useCategoryTree.mockReturnValue(ready({ top: [tile(1).category], childIds: {} }));
});
afterEach(() => cleanup());

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingSections />
    </MemoryRouter>,
  );

const SHARED = 'https://files.test/shared-photo.jpg';

describe('the landing page as a whole', () => {
  it('shows one image only once, however many sections were given it', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1, { photoCandidates: [SHARED] }), supplier(2)]));
    hooks.useFeaturedProducts.mockReturnValue(ready([product(1, { imageCandidates: [SHARED] }), product(2, { imageCandidates: [SHARED, 'https://files.test/product-2-alt.jpg'] })]));
    hooks.useLiveRequirements.mockReturnValue(ready([rfq(1, { imageCandidates: [`${SHARED}?w=400`] })]));
    hooks.useAuctions.mockReturnValue(ready([auction(1, { imageCandidates: [SHARED] })]));
    hooks.useCategoryTiles.mockReturnValue(ready([tile(1, { imageCandidates: [SHARED] })]));

    const { container } = renderPage();
    const shown = Array.from(container.querySelectorAll('img[src]')).map((img) => imageKey(img.getAttribute('src') ?? ''));
    expect(new Set(shown).size).toBe(shown.length);
    expect(shown.filter((key) => key === imageKey(SHARED))).toHaveLength(1);
    // the supplier section comes first, so it keeps the shared photograph
    expect(landingImages.ownerOf(SHARED)).toBe('suppliers:s1:photo');
  });

  it('drops a product whose every photo is already on the page instead of repeating one', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1, { photoCandidates: [SHARED] })]));
    hooks.useFeaturedProducts.mockReturnValue(ready([product(1, { imageCandidates: [SHARED] }), product(2)]));
    hooks.useLiveRequirements.mockReturnValue(ready([]));
    hooks.useAuctions.mockReturnValue(ready([]));
    hooks.useCategoryTiles.mockReturnValue(ready([]));
    const { container } = renderPage();
    const ids = Array.from(container.querySelectorAll('[data-product-card]')).map((card) => card.getAttribute('data-product-id'));
    expect(ids).toEqual(['p2']);
  });

  it('gives every card a distinct photo across all sections when the data is distinct', async () => {
    const user = userEvent.setup();
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1), supplier(2), supplier(3)]));
    hooks.useFeaturedProducts.mockReturnValue(ready([product(1), product(2), product(3), product(4)]));
    hooks.useLiveRequirements.mockReturnValue(ready([rfq(1, { imageCandidates: ['https://files.test/rfq-1.jpg'] })]));
    hooks.useAuctions.mockReturnValue(ready([auction(1, { imageCandidates: ['https://files.test/auction-1.jpg'] })]));
    hooks.useCategoryTiles.mockReturnValue(ready([tile(1, { imageCandidates: ['https://files.test/cat-1.jpg'] })]));
    const { container } = renderPage();
    const sources = () => Array.from(container.querySelectorAll('img[src]')).map((img) => img.getAttribute('src'));

    // 3 suppliers (photo + logo each) + 4 products + 1 RFQ + 1 category tile
    expect(sources()).toHaveLength(12);
    expect(new Set(sources()).size).toBe(12);

    // the auction lives on its own tab; opening it must not bring a repeat with it
    await user.click(screen.getByRole('tab', { name: 'Live Auctions' }));
    expect(sources()).toContain('https://files.test/auction-1.jpg');
    expect(new Set(sources()).size).toBe(sources().length);
  });

  it('adds no picture of its own: with no data there are no images at all', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([]));
    hooks.useFeaturedProducts.mockReturnValue(ready([]));
    hooks.useLiveRequirements.mockReturnValue(ready([]));
    hooks.useAuctions.mockReturnValue(ready([]));
    hooks.useCategoryTiles.mockReturnValue(ready([]));
    const { container } = renderPage();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('shows an honest empty state in every data section when the marketplace is empty', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([]));
    hooks.useFeaturedProducts.mockReturnValue(ready([]));
    hooks.useLiveRequirements.mockReturnValue(ready([]));
    hooks.useAuctions.mockReturnValue(ready([]));
    hooks.useCategoryTiles.mockReturnValue(ready([]));
    const { container } = renderPage();
    const empty = Array.from(container.querySelectorAll('[data-empty-state]')).map((node) => node.querySelector('h3')?.textContent);
    expect(empty).toEqual([
      'Verified suppliers will appear here',
      'Products from verified suppliers will appear here',
      'No open RFQs right now',
      'No new buy leads in the last 48 hours',
      'Categories are being set up',
    ]);
  });

  it('does not render real-looking content while data is still loading', () => {
    for (const hook of [hooks.useVerifiedSuppliers, hooks.useFeaturedProducts, hooks.useLiveRequirements, hooks.useAuctions, hooks.useCategoryTiles]) {
      hook.mockReturnValue(waiting());
    }
    hooks.useMarketplaceOverview.mockReturnValue(waiting());
    const { container } = renderPage();
    expect(container.querySelectorAll('[data-supplier-card], [data-product-card], [data-rfq-card], [data-category-tile]')).toHaveLength(0);
    expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThan(0);
  });

  it('keeps a requirement or lead from showing a buyer contact or a person', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([]));
    hooks.useFeaturedProducts.mockReturnValue(ready([]));
    hooks.useLiveRequirements.mockReturnValue(ready([rfq(1, { title: 'Steel pipes', buyerVerified: true })]));
    hooks.useAuctions.mockReturnValue(ready([]));
    hooks.useCategoryTiles.mockReturnValue(ready([]));
    const { container } = renderPage();
    expect(container.textContent).not.toMatch(/@|\+91|\b\d{10}\b/);
  });
});
