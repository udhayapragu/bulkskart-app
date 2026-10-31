import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StickySearch from '@/components/landing/StickySearch';

function Where() {
  const location = useLocation();
  return <div data-testid="where">{`${location.pathname}${location.search}`}</div>;
}

let panel: HTMLElement;
let panelBottom: number;

function mount() {
  const view = render(
    <MemoryRouter>
      <div data-hero-search />
      <StickySearch />
      <Where />
    </MemoryRouter>,
  );
  panel = view.container.querySelector('[data-hero-search]') as HTMLElement;
  panel.getBoundingClientRect = () => ({ bottom: panelBottom, top: panelBottom - 200, left: 0, right: 300, width: 300, height: 200, x: 0, y: panelBottom - 200, toJSON: () => ({}) });
  return view;
}

// animation frames wait until the test lets them run, as in a browser
let frames: Array<() => void> = [];
function runFrames() {
  const pending = frames;
  frames = [];
  act(() => {
    for (const frame of pending) frame();
  });
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    fireEvent.scroll(window);
  });
  runFrames();
}

const bar = () => screen.getByRole('search', { name: 'Quick search', hidden: true });

beforeEach(() => {
  panelBottom = 400; // the hero search panel is still on screen
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  frames = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(() => callback(0));
    return frames.length;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('StickySearch (phones)', () => {
  it('is out of sight at the top of the page', () => {
    mount();
    expect(bar()).toHaveAttribute('data-visible', 'false');
  });

  it('stays hidden while the hero search panel is still on screen, even when scrolling up', () => {
    mount();
    scrollTo(300);
    scrollTo(200);
    expect(bar()).toHaveAttribute('data-visible', 'false');
  });

  it('slides in when the visitor scrolls up after passing the hero panel, and out again on the way down', () => {
    mount();
    panelBottom = -50; // panel has scrolled off the top
    scrollTo(1200);
    expect(bar()).toHaveAttribute('data-visible', 'false'); // reading downwards
    scrollTo(1100);
    expect(bar()).toHaveAttribute('data-visible', 'true'); // coming back up
    scrollTo(1300);
    expect(bar()).toHaveAttribute('data-visible', 'false');
  });

  it('ignores tiny scroll jitters', () => {
    mount();
    panelBottom = -50;
    scrollTo(1200);
    scrollTo(1100);
    expect(bar()).toHaveAttribute('data-visible', 'true');
    scrollTo(1103);
    expect(bar()).toHaveAttribute('data-visible', 'true');
  });

  it('hides again once the visitor is back above the hero panel', () => {
    mount();
    panelBottom = -50;
    scrollTo(1200);
    scrollTo(1100);
    expect(bar()).toHaveAttribute('data-visible', 'true');
    panelBottom = 120;
    scrollTo(900);
    expect(bar()).toHaveAttribute('data-visible', 'false');
  });

  it('stays put while the visitor is typing, even if the on-screen keyboard makes the page scroll down', async () => {
    const user = userEvent.setup();
    mount();
    panelBottom = -50;
    scrollTo(1200);
    scrollTo(1100);
    await user.click(screen.getByRole('searchbox', { hidden: true }));
    scrollTo(1250);
    expect(bar()).toHaveAttribute('data-visible', 'true');
  });

  it('has a labelled field and a search button', () => {
    mount();
    expect(screen.getByLabelText('Search products, suppliers and categories')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search', hidden: true })).toHaveAttribute('type', 'submit');
  });

  it('searches products for what was typed', async () => {
    const user = userEvent.setup();
    mount();
    await user.type(screen.getByRole('searchbox', { hidden: true }), '  steel pipes ');
    await user.click(screen.getByRole('button', { name: 'Search', hidden: true }));
    expect(screen.getByTestId('where')).toHaveTextContent('/products?q=steel%20pipes');
  });

  it('opens the product list when nothing was typed', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('button', { name: 'Search', hidden: true }));
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/products$/);
  });
});
