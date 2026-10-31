import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

/**
 * A slim search bar for phones. The header has no search field on a phone, and this page is long,
 * so once the visitor has scrolled past the hero search panel the bar slides in whenever they scroll
 * back up. It stays out of the way while they read downwards. Wider screens already have the header search.
 */
export default function StickySearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      lastY = y;

      const panel = document.querySelector('[data-hero-search]');
      const pastPanel = panel ? panel.getBoundingClientRect().bottom < 0 : y > 600;
      if (!pastPanel) {
        setVisible(false);
        return;
      }
      // while the visitor is typing the bar must stay put, even though the keyboard resizes the page
      if (formRef.current?.contains(document.activeElement)) {
        setVisible(true);
        return;
      }
      if (delta < -6) setVisible(true);
      else if (delta > 6) setVisible(false);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    navigate(text ? `/products?q=${encodeURIComponent(text)}` : '/products');
  };

  return (
    <form
      ref={formRef}
      role="search"
      aria-label="Quick search"
      data-visible={visible}
      onSubmit={submit}
      className={`fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#050914]/95 pt-[env(safe-area-inset-top)] shadow-[0_10px_28px_rgba(0,0,0,0.5)] backdrop-blur-md transition-[transform,opacity,visibility] duration-200 motion-reduce:transition-none md:hidden ${
        visible ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-2">
        <label htmlFor="quick-search" className="sr-only">
          Search products, suppliers and categories
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a96b0]" aria-hidden="true" />
          <input
            id="quick-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products and suppliers"
            className="h-[44px] w-full rounded-xl border border-[#26334b] bg-[#0d1627] pl-10 pr-3 text-[16px] text-white outline-none placeholder:text-[#7d89a3] focus:border-[#ff6500] focus:ring-2 focus:ring-[#ff6500]/30"
          />
        </div>
        <button
          type="submit"
          aria-label="Search"
          className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ff6500] to-[#ff8a24] text-white shadow-[0_6px_18px_rgba(255,101,0,0.35)] active:scale-95"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
