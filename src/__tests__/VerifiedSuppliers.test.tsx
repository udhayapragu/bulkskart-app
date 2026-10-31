import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { broken, installBrowserStubs, overview, ready, supplier, waiting } from './landingTestKit';

const hooks = vi.hoisted(() => ({ useVerifiedSuppliers: vi.fn(), useMarketplaceOverview: vi.fn() }));
vi.mock('@/hooks/useHomepageData', () => hooks);
// The data helpers import the Supabase client, which refuses to start without env config.
vi.mock('@/db/supabase', () => ({ supabase: {} }));
vi.mock('@/components/home/hero/EarthGlobe', () => ({ default: () => null }));

import VerifiedSuppliers from '@/components/landing/VerifiedSuppliers';
import { landingImages } from '@/lib/imageRegistry';

beforeAll(() => installBrowserStubs());
beforeEach(() => {
  landingImages.clear();
  hooks.useMarketplaceOverview.mockReturnValue(ready(overview()));
});
afterEach(() => cleanup());

const renderSection = () =>
  render(
    <MemoryRouter>
      <VerifiedSuppliers />
    </MemoryRouter>,
  );
const cards = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-supplier-card]'));

describe('Verified Suppliers section', () => {
  it('shows each real supplier with its own photo, logo, place and a link to its profile', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1), supplier(2)]));
    const { container } = renderSection();
    expect(screen.getByRole('heading', { level: 2, name: /Verified\s+Suppliers/ })).toBeInTheDocument();
    expect(cards(container)).toHaveLength(2);

    const first = within(cards(container)[0] as HTMLElement);
    expect(first.getByRole('heading', { name: 'Supplier 1' })).toBeInTheDocument();
    expect(first.getByText('Verified Manufacturer')).toBeInTheDocument();
    expect(first.getByText('Pune, India')).toBeInTheDocument();
    expect(first.getByRole('link', { name: /View products from Supplier 1/ })).toHaveAttribute('href', '/manufacturers/supplier-1');

    const second = within(cards(container)[1] as HTMLElement);
    expect(second.getByText('Verified Supplier', { selector: 'span span' })).toBeInTheDocument();
  });

  it('puts the right figures in the header from the marketplace counts', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1)]));
    const { container } = renderSection();
    const stats = container.querySelector('[data-stats="suppliers"]') as HTMLElement;
    expect(within(stats).getByText('Supplier countries').previousSibling).toHaveTextContent('2');
    expect(within(stats).getByText('Verified suppliers').previousSibling).toHaveTextContent('4');
    expect(within(stats).getByText('Live RFQs & auctions').previousSibling).toHaveTextContent('7');
  });

  it('leaves out a figure it cannot count instead of guessing', () => {
    hooks.useMarketplaceOverview.mockReturnValue(ready(overview({ activeRequirements: null, supplierCountries: null })));
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1)]));
    const { container } = renderSection();
    const stats = container.querySelector('[data-stats="suppliers"]') as HTMLElement;
    expect(within(stats).queryByText('Supplier countries')).toBeNull();
    expect(within(stats).queryByText('Live RFQs & auctions')).toBeNull();
    expect(within(stats).getByText('Verified suppliers')).toBeInTheDocument();
  });

  it('never repeats a photograph: the second company with the same photo gets a placeholder', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(
      ready([
        supplier(1, { photoCandidates: ['https://files.test/shared.jpg'] }),
        supplier(2, { photoCandidates: ['https://files.test/shared.jpg?w=800'] }),
        supplier(3, { photoCandidates: ['https://files.test/shared.jpg', 'https://files.test/own-3.jpg'] }),
      ]),
    );
    const { container } = renderSection();
    const photos = Array.from(container.querySelectorAll('img[data-unique-image="photo"]')).map((img) => img.getAttribute('src'));
    expect(photos).toEqual(['https://files.test/shared.jpg', 'https://files.test/own-3.jpg']);
    expect(container.querySelectorAll('[data-placeholder="factory"]')).toHaveLength(1);
  });

  it('shows a plain placeholder when a company has no photo, and never a logo in its place', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1, { photoCandidates: [], logoCandidates: ['https://files.test/only-logo.png'] })]));
    const { container } = renderSection();
    expect(container.querySelector('[data-placeholder="factory"]')).not.toBeNull();
    const imageSrcs = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'));
    expect(imageSrcs).toEqual(['https://files.test/only-logo.png']);
  });

  it('shows a neutral logo placeholder and no text logo when the logo is missing', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1, { logoCandidates: [] })]));
    const { container } = renderSection();
    expect(container.querySelector('[data-placeholder="logo"]')).not.toBeNull();
  });

  it('makes only claims the record supports', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(2, { businessType: null, tagline: 'Fasteners', exportCountryCount: null, yearsInBusiness: null })]));
    const { container } = renderSection();
    const card = within(cards(container)[0] as HTMLElement);
    expect(card.queryByText(/OEM|Bulk Supply|Worldwide Shipping/)).toBeNull();
    expect(container.querySelectorAll('.lv-tag')).toHaveLength(0);
  });

  it('filters by country, by category and by what is typed, and explains an empty result', async () => {
    const user = userEvent.setup();
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1), supplier(2), supplier(3, { name: 'Gamma Casting Works', categories: ['Machinery'] })]));
    const { container } = renderSection();
    expect(cards(container)).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: /Germany/ }));
    expect(cards(container)).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /All Suppliers/ }));
    expect(cards(container)).toHaveLength(3);

    await user.selectOptions(screen.getByLabelText('Category'), 'Machinery');
    expect(cards(container)).toHaveLength(2);

    await user.type(screen.getByRole('searchbox', { name: /Search verified suppliers/ }), 'gamma');
    expect(cards(container)).toHaveLength(1);
    expect(screen.getByText('Showing 1 of 3 verified suppliers')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: /Search verified suppliers/ }), ' zzz');
    expect(cards(container)).toHaveLength(0);
    expect(screen.getByText('No verified supplier matches these filters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(cards(container)).toHaveLength(3);
  });

  it('offers only the countries, categories and types that exist among the suppliers', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1), supplier(3)]));
    renderSection();
    const group = screen.getByRole('group', { name: 'Filter by country' });
    // the flag emoji is decorative (aria-hidden), so the accessible names are just the country names
    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: 'All Suppliers' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'India' })).toBeInTheDocument();
    const menu = screen.getByLabelText('Supplier type') as HTMLSelectElement;
    expect(Array.from(menu.options).map((o) => o.textContent)).toEqual(['Supplier Type', 'Manufacturer']);
  });

  it('says honestly that no supplier is verified yet, with a way to join, instead of showing filler', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([]));
    const { container } = renderSection();
    expect(screen.getByText('Verified suppliers will appear here')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join as Manufacturer' })).toHaveAttribute('href', '/register?role=supplier');
    expect(cards(container)).toHaveLength(0);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('shows loading placeholders, and a retry when the request fails', async () => {
    hooks.useVerifiedSuppliers.mockReturnValue(waiting());
    const { container, unmount } = renderSection();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    unmount();

    const state = broken();
    hooks.useVerifiedSuppliers.mockReturnValue(state);
    renderSection();
    await userEvent.setup().click(screen.getByRole('button', { name: /Try again/ }));
    expect(state.retry).toHaveBeenCalled();
  });

  it('links to the full directory', () => {
    hooks.useVerifiedSuppliers.mockReturnValue(ready([supplier(1)]));
    renderSection();
    expect(screen.getByRole('link', { name: /View All Verified Suppliers/ })).toHaveAttribute('href', '/manufacturers');
  });
});
