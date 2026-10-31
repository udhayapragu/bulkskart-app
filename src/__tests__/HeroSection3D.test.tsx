import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import HeroSection3D from '@/components/home/HeroSection3D';

// The canvas Earth needs a real browser; its maths is tested separately in globeMath.test.ts.
vi.mock('@/components/home/hero/EarthGlobe', () => ({ default: () => null }));

beforeAll(() => {
  // jsdom has none of these browser features.
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
});

afterEach(() => cleanup());

function Where() {
  const location = useLocation();
  return <div data-testid="where">{`${location.pathname}${location.search}`}</div>;
}

function renderHero(onSearch?: (query: string, type: string) => void) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/']}>
      <HeroSection3D onSearch={onSearch} />
      <Where />
    </MemoryRouter>,
  );
  return { user, where: () => screen.getByTestId('where').textContent };
}

describe('HeroSection3D content', () => {
  it('carries the redesigned headline and supporting copy', () => {
    renderHero();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Global Wholesale.Smarter Sourcing.');
    expect(screen.getByText('Global B2B marketplace')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Connect manufacturers, wholesalers and bulk buyers across the world. Search suppliers and products, compare offers and source with confidence.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps both feature badges and points them at the order benefits section', () => {
    renderHero();
    for (const name of ['Free delivery on all orders', 'Order loan calculator']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', '#order-benefits');
    }
  });

  it('has the two calls to action the brief asks for, each on a real route', () => {
    renderHero();
    expect(screen.getByRole('link', { name: /Browse Categories/ })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: /Join as Manufacturer/ })).toHaveAttribute('href', '/register?role=supplier');
  });

  it('keeps the search panel copy and shows no invented statistics', () => {
    renderHero();
    expect(screen.getByRole('heading', { level: 2, name: 'Find products and suppliers' })).toBeInTheDocument();
    expect(screen.getByText('Search verified catalogues, manufacturers and live RFQs.')).toBeInTheDocument();
    // the earlier hero printed round-number claims that were not read from the database; real counts now live in the stats strip below
    for (const text of ['50,000+', '1M+', '120+', '10,000+', 'Bulk products', 'Trade countries']) {
      expect(screen.queryByText(text)).toBeNull();
    }
  });

  it('marks the copy block so floating widgets can stay clear of it', () => {
    renderHero();
    expect(screen.getByRole('heading', { level: 1 }).closest('[data-keep-clear]')).not.toBeNull();
  });

  it('hides the decorative scene from assistive technology', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection3D />
      </MemoryRouter>,
    );
    expect(container.querySelector('.cin-ambient')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.cin-scene')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('HeroSection3D search', () => {
  it('gives the controls accessible names', () => {
    renderHero();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'What to search' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search products, suppliers and categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeInTheDocument();
  });

  it('searches products', async () => {
    const onSearch = vi.fn();
    const { user, where } = renderHero(onSearch);
    await user.type(screen.getByRole('textbox', { name: /Search products/ }), '  steel pipes ');
    await user.click(screen.getByRole('button', { name: 'Submit search' }));
    expect(where()).toBe('/products?q=steel%20pipes');
    expect(onSearch).toHaveBeenCalledWith('  steel pipes ', 'products');
  });

  it('searches manufacturers and live RFQs on their own pages', async () => {
    const { user, where } = renderHero();
    await user.selectOptions(screen.getByRole('combobox', { name: 'What to search' }), 'manufacturers');
    await user.type(screen.getByRole('textbox', { name: /Search products/ }), 'textile mill');
    await user.click(screen.getByRole('button', { name: 'Submit search' }));
    expect(where()).toBe('/manufacturers?q=textile%20mill');

    cleanup();
    const second = renderHero();
    await second.user.selectOptions(screen.getByRole('combobox', { name: 'What to search' }), 'rfqs');
    await second.user.type(screen.getByRole('textbox', { name: /Search products/ }), 'cotton yarn');
    await second.user.click(screen.getByRole('button', { name: 'Submit search' }));
    expect(second.where()).toBe('/auctions/reverse?search=cotton%20yarn');
  });

  it('opens the right listing page when nothing is typed', async () => {
    const { user, where } = renderHero();
    await user.click(screen.getByRole('button', { name: 'Submit search' }));
    expect(where()).toBe('/products');
  });

  it('does not call onSearch for an empty search', async () => {
    const onSearch = vi.fn();
    const { user } = renderHero(onSearch);
    await user.click(screen.getByRole('button', { name: 'Submit search' }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('keeps all eight popular categories and searches them', async () => {
    const { user, where } = renderHero();
    const group = screen.getByRole('group', { name: 'Popular categories' });
    const names = Array.from(group.querySelectorAll('button')).map((button) => button.textContent);
    expect(names).toEqual(['Textile', 'Steel', 'Chemical', 'Plastic', 'Machinery', 'Agriculture', 'Packaging', 'Electrical']);
    await user.click(screen.getByRole('button', { name: 'Machinery' }));
    expect(where()).toBe('/products?q=generator%20motor%20equipment');
  });
});

describe('HeroSection3D decoration', () => {
  it('mounts the atmosphere and scene after the first frame, and the Earth later still', async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <MemoryRouter>
          <HeroSection3D />
        </MemoryRouter>,
      );
      expect(container.querySelector('.cin-sky')).not.toBeNull();
      expect(container.querySelector('.cin-fx')).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(container.querySelector('.cin-fx')).not.toBeNull();
      expect(container.querySelector('.cin-ship')).not.toBeNull();
      expect(container.querySelector('canvas')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
