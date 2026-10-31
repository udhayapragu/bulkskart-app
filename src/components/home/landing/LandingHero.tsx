import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, FileText, Globe, Lock, Search, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HERO_IMAGE_ALT, HERO_IMAGE_SRC } from '@/config/homepage';
import type { Category } from '@/types/types';

type SearchScope = 'products' | 'suppliers' | 'categories';

const SEARCH_SCOPES: Array<{ value: SearchScope; label: string; placeholder: string }> = [
  { value: 'products', label: 'Products', placeholder: 'Search products, e.g. steel pipes, corrugated boxes' },
  { value: 'suppliers', label: 'Suppliers', placeholder: 'Search verified suppliers by name or city' },
  { value: 'categories', label: 'Categories', placeholder: 'Search industry categories' },
];

const TRUST_HIGHLIGHTS = [
  { label: 'Verified Manufacturers', icon: BadgeCheck },
  { label: 'Free Delivery on Every Order', icon: Truck },
  { label: 'Secure Online Payments', icon: Lock },
  { label: 'Trade Assurance', icon: ShieldCheck },
  { label: 'Global Shipping', icon: Globe },
];

interface LandingHeroProps {
  categories: Category[] | null;
  /** Count of countries with verified manufacturers. Null hides the count from the copy. */
  countryCount: number | null;
}

export default function LandingHero({ categories, countryCount }: LandingHeroProps) {
  const navigate = useNavigate();
  const [scope, setScope] = useState<SearchScope>('products');
  const [term, setTerm] = useState('');

  const activeScope = SEARCH_SCOPES.find((item) => item.value === scope) ?? SEARCH_SCOPES[0];
  const countryClause =
    countryCount && countryCount > 0
      ? ` and ${countryCount} other ${countryCount === 1 ? 'country' : 'countries'}`
      : '';

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = term.trim();
    if (scope === 'suppliers') {
      navigate(query ? `/manufacturers?q=${encodeURIComponent(query)}` : '/manufacturers');
      return;
    }
    if (scope === 'categories') {
      if (!query) {
        navigate('/categories');
        return;
      }
      const match = categories?.find((category) => category.name.toLowerCase().includes(query.toLowerCase()));
      if (match) {
        navigate(`/products?category=${encodeURIComponent(match.slug)}`);
        return;
      }
    }
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
  };

  return (
    <section aria-label="Introduction" className="relative isolate overflow-hidden border-b border-border bg-background">
      {HERO_IMAGE_SRC ? (
        <>
          <img
            src={HERO_IMAGE_SRC}
            alt={HERO_IMAGE_ALT}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/50" />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_0%,hsl(var(--primary)/0.16),transparent_55%)]"
        />
      )}

      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 md:py-14 lg:px-8 lg:py-20">
        <div className="max-w-3xl space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Global B2B marketplace
          </p>
          <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Buy in Bulk. <span className="text-primary">Source Global.</span> Grow Faster.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Connect directly with verified manufacturers and suppliers from India{countryClause}. Discover wholesale
            products, compare quotations and grow your business globally.
          </p>

          <ul aria-label="Trust highlights" className="flex flex-wrap gap-2">
            {TRUST_HIGHLIGHTS.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <form
            role="search"
            onSubmit={handleSearch}
            className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row sm:items-center"
          >
            <label htmlFor="home-search-scope" className="sr-only">
              Search in
            </label>
            <select
              id="home-search-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as SearchScope)}
              className="h-11 rounded-xl bg-muted px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SEARCH_SCOPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <label htmlFor="home-search-term" className="sr-only">
              {`Search ${activeScope.label.toLowerCase()}`}
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                id="home-search-term"
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={activeScope.placeholder}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl px-6 font-bold">
              Search
            </Button>
          </form>

          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">Popular:</span>
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6 font-bold text-primary">
              <Link to="/products">Explore Marketplace</Link>
            </Button>
            <Button asChild size="lg" className="h-12 rounded-xl px-6 font-bold">
              <Link to="/post-requirement" className="gap-2">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Post a Requirement
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
