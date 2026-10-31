import {
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Factory,
  Flame,
  Globe,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionBackdrop } from '@/components/landing/SectionArt';
import { CardSkeleton, EmptyState, ErrorState, FlagDot } from '@/components/landing/shared';
import { UniqueImage } from '@/components/landing/UniqueImage';
import { useMarketplaceOverview, useVerifiedSuppliers } from '@/hooks/useHomepageData';
import { useMediaQuery, useNearViewport, usePrefersReducedMotion } from '@/components/home/hero/useHeroEnvironment';
import { findCountry } from '@/lib/countries';
import { formatNumber, type VerifiedSupplier } from '@/lib/homepageData';
import { landingImages } from '@/lib/imageRegistry';
import {
  buildSupplierTags,
  categoryOptions,
  countryOptions,
  filterSuppliers,
  NO_FILTERS,
  type SupplierFilters,
  supplierBadge,
  supplierSummary,
  typeOptions,
} from '@/lib/supplierView';

const EarthGlobe = lazy(() => import('@/components/home/hero/EarthGlobe'));

interface SupplierCardData {
  supplier: VerifiedSupplier;
  /** A company photo nobody else on the page shows, or null. */
  photo: string | null;
  logo: string | null;
}

const SupplierCard = memo(function SupplierCard({ supplier, photo, logo }: SupplierCardData) {
  const tags = buildSupplierTags(supplier);
  const summary = supplierSummary(supplier);
  const label = supplier.categories[0] ?? supplier.keyProducts[0] ?? null;
  const place = [supplier.city, supplier.country].filter(Boolean).join(', ');

  return (
    <article className="lv-card lv-lift flex flex-col overflow-hidden" data-supplier-card data-supplier-id={supplier.id}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a1222]">
        <UniqueImage
          src={photo}
          alt={`${supplier.name}: company photo`}
          placeholderKind="factory"
          sizes="(min-width: 1100px) 380px, (min-width: 768px) 46vw, 86vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        <span className="lv-badge-verified absolute left-4 top-4 max-w-[calc(100%-2rem)]">
          <Crown className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{supplierBadge(supplier)}</span>
        </span>
        {label && (
          <span className="lv-pill absolute bottom-4 left-4 max-w-[calc(100%-2rem)] sm:max-w-[58%]">
            <MapPin className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </span>
        )}
        {supplier.productCount !== null && supplier.productCount > 0 && (
          <span className="lv-pill absolute bottom-4 right-4 hidden sm:inline-flex">
            <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
            {formatNumber(supplier.productCount)} {supplier.productCount === 1 ? 'product' : 'products'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#eef1f7]">
            <UniqueImage src={logo} alt={`${supplier.name} logo`} kind="logo" placeholderKind="logo" showCaption={false} />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white sm:text-xl">{supplier.name}</h3>
            {place && (
              <p className="mt-1 flex items-center gap-2 text-[0.95rem] text-[var(--lv-muted)]">
                <FlagDot iso2={supplier.iso2} className="!h-6 !w-6 !text-base" />
                <span className="truncate">{place}</span>
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-1.5 font-bold text-[var(--lv-orange-2)]">
              <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              Verified Supplier
            </p>
            {supplier.productCount !== null && supplier.productCount > 0 && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--lv-muted)] sm:hidden">
                <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
                {formatNumber(supplier.productCount)} {supplier.productCount === 1 ? 'product' : 'products'}
              </p>
            )}
          </div>
        </div>

        {summary && (
          <p className="mt-4 line-clamp-2 text-[0.98rem] leading-relaxed text-[var(--lv-muted)]">
            {summary}
            {supplier.businessType && !summary.toLowerCase().includes(supplier.businessType.toLowerCase()) ? ` • ${supplier.businessType}` : ''}
          </p>
        )}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="lv-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-6">
          <Link to={`/manufacturers/${supplier.slug}`} className="lv-btn lv-btn--primary lv-btn--block" aria-label={`View products from ${supplier.name}`}>
            View Products
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
});

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="lv-stat !gap-3 !px-3 first:odd:last:col-span-2 odd:last:col-span-2 sm:min-w-[200px] sm:!gap-3.5 sm:!px-[18px] sm:pr-8 sm:odd:last:col-span-1">
      <div className="lv-stat-icon !h-11 !w-11 sm:!h-[52px] sm:!w-[52px]">{icon}</div>
      <div className="min-w-0">
        <div className="lv-stat-value">{value}</div>
        <div className="lv-stat-label !text-[0.82rem] !leading-tight sm:!text-[0.95rem]">{label}</div>
      </div>
    </div>
  );
}

function SelectField({
  icon,
  label,
  value,
  onChange,
  allLabel,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  allLabel: string;
  options: string[];
}) {
  return (
    <label className="lv-field">
      <span className="sr-only">{label}</span>
      {icon}
      <select className="lv-select" value={value} onChange={(event) => onChange(event.target.value)} disabled={options.length === 0}>
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="lv-select-caret" aria-hidden="true" />
    </label>
  );
}

export default function VerifiedSuppliers() {
  const suppliersState = useVerifiedSuppliers();
  const overview = useMarketplaceOverview();
  const [filters, setFilters] = useState<SupplierFilters>(NO_FILTERS);
  const reducedMotion = usePrefersReducedMotion();
  const compact = useMediaQuery('(max-width: 767px)', true);
  const artRef = useRef<HTMLDivElement>(null);
  const showGlobe = useNearViewport(artRef, '300px');
  const railRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [rail, setRail] = useState({ left: 0, width: 100, canPrev: false, canNext: false });
  const [chipsOverflow, setChipsOverflow] = useState(false);

  const suppliers = suppliersState.data;
  const cards = useMemo<SupplierCardData[]>(() => {
    // Every photo and logo is claimed once for the whole page. A repeat becomes a placeholder.
    landingImages.releaseGroup('suppliers:');
    return (suppliers ?? []).map((supplier) => ({
      supplier,
      photo: landingImages.claimFirst(`suppliers:${supplier.id}:photo`, supplier.photoCandidates),
      logo: landingImages.claimFirst(`suppliers:${supplier.id}:logo`, supplier.logoCandidates),
    }));
  }, [suppliers]);

  const all = useMemo(() => cards.map((card) => card.supplier), [cards]);
  const visible = useMemo(() => {
    const ids = new Set(filterSuppliers(all, filters).map((supplier) => supplier.id));
    return cards.filter((card) => ids.has(card.supplier.id));
  }, [all, cards, filters]);

  const countries = useMemo(() => countryOptions(all), [all]);
  const categories = useMemo(() => categoryOptions(all), [all]);
  const types = useMemo(() => typeOptions(all), [all]);
  const pins = useMemo(
    () =>
      countries
        .map((entry) => findCountry(entry.country))
        .filter((info): info is NonNullable<typeof info> => info !== null)
        .map((info) => ({ lat: info.lat, lon: info.lon })),
    [countries],
  );

  const data = overview.data;
  const countryCount = data?.supplierCountries?.length ?? null;
  const liveDemand = data && data.activeRequirements !== null && data.liveAuctions !== null ? data.activeRequirements + data.liveAuctions : null;

  const measureRail = () => {
    const element = railRef.current;
    if (!element) return;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const overflow = scrollWidth - clientWidth > 4;
    setRail({
      left: overflow ? (scrollLeft / scrollWidth) * 100 : 0,
      width: overflow ? Math.max(8, (clientWidth / scrollWidth) * 100) : 100,
      canPrev: overflow && scrollLeft > 4,
      canNext: overflow && scrollLeft + clientWidth < scrollWidth - 4,
    });
  };

  useEffect(() => {
    measureRail();
    const element = railRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(measureRail);
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible.length]);

  useEffect(() => {
    const element = chipsRef.current;
    if (!element) return undefined;
    const measure = () => setChipsOverflow(element.scrollWidth - element.clientWidth > 4);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [countries.length]);

  const scrollRail = (direction: 1 | -1) => {
    const element = railRef.current;
    if (!element) return;
    const first = element.firstElementChild as HTMLElement | null;
    const step = (first?.offsetWidth ?? 360) + 24;
    element.scrollBy({ left: direction * step, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const setFilter = <K extends keyof SupplierFilters>(key: K, value: SupplierFilters[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  return (
    <section id="verified-suppliers" className="lv-section" aria-labelledby="verified-suppliers-title">
      <SectionBackdrop slot="suppliers">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(124,58,237,0.16),transparent_70%)]" />
      </SectionBackdrop>

      <div className="lv-container">
        {/* Header: badge, heading, text, statistics and the Earth */}
        <div className="relative">
          <div ref={artRef} className="pointer-events-none absolute -right-[24%] -top-16 z-0 w-[84vw] max-w-[440px] opacity-70 md:-right-[12%] md:-top-56 md:w-[min(50vw,720px)] md:max-w-none md:opacity-100" aria-hidden="true">
            <div className="relative aspect-square w-full [mask-image:linear-gradient(90deg,transparent,#000_38%)] md:[mask-image:none]">
              {showGlobe && (
                <Suspense fallback={null}>
                  <EarthGlobe
                    quality={compact ? 'lite' : 'full'}
                    reducedMotion={reducedMotion}
                    className="absolute inset-0 h-full w-full"
                    lanes={false}
                    warm
                    facing={70}
                    pins={pins}
                  />
                </Suspense>
              )}
            </div>
            {data && data.verifiedSuppliers !== null && data.verifiedSuppliers > 0 && (
              <div
                className="absolute right-[10%] top-[52%] hidden w-[250px] rounded-3xl border border-white/15 bg-[rgba(20,22,48,0.72)] p-5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md md:block"
                style={{ transform: 'rotate(-9deg)', animation: reducedMotion ? undefined : 'lv-float 7s ease-in-out infinite' }}
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--lv-green)] text-white shadow-[0_0_24px_rgba(34,197,94,0.55)]">
                    <BadgeCheck className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--lv-muted)]">Verified suppliers</p>
                    <p className="text-2xl font-extrabold leading-tight text-white">{formatNumber(data.verifiedSuppliers)}</p>
                    {countryCount !== null && countryCount > 0 && (
                      <p className="text-sm text-[var(--lv-muted)]">in {countryCount} {countryCount === 1 ? 'country' : 'countries'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 max-w-3xl">
            <span className="lv-eyebrow">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Trusted Global Sourcing
            </span>
            <h2 id="verified-suppliers-title" className="lv-title">
              Verified <span className="lv-grad">Suppliers</span>
            </h2>
            <p className="lv-lead">
              Connect with manufacturers, wholesalers and exporters from around the world. Every supplier listed here has completed Bulkskart verification.
            </p>
          </div>

          {(data?.verifiedSuppliers != null || countryCount !== null || liveDemand !== null) && (
            <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:gap-4" data-stats="suppliers">
              {countryCount !== null && countryCount > 0 && (
                <StatChip icon={<Globe className="h-6 w-6" aria-hidden="true" />} value={formatNumber(countryCount)} label="Supplier countries" />
              )}
              {data?.verifiedSuppliers != null && (
                <StatChip icon={<Factory className="h-6 w-6" aria-hidden="true" />} value={formatNumber(data.verifiedSuppliers)} label="Verified suppliers" />
              )}
              {liveDemand !== null && (
                <StatChip icon={<Flame className="h-6 w-6" aria-hidden="true" />} value={formatNumber(liveDemand)} label="Live RFQs & auctions" />
              )}
            </div>
          )}
        </div>

        <div className="lv-progress relative z-10 mt-8" aria-hidden="true">
          <span style={{ left: `${rail.left}%`, width: `${rail.width}%` }} />
        </div>

        {suppliersState.loading && (
          <div className="relative z-10 mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            <CardSkeleton />
            <CardSkeleton />
            <div className="hidden lg:block">
              <CardSkeleton />
            </div>
          </div>
        )}

        {suppliersState.failed && (
          <div className="relative z-10 mt-10">
            <ErrorState what="the verified suppliers" onRetry={suppliersState.retry} />
          </div>
        )}

        {!suppliersState.loading && !suppliersState.failed && all.length === 0 && (
          <div className="relative z-10 mt-10">
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8" aria-hidden="true" />}
              title="Verified suppliers will appear here"
              body="A supplier is listed once its business verification is complete. None has completed it yet. If you run a manufacturing or wholesale business, you can start your profile today."
              actions={[
                { label: 'Join as Manufacturer', to: '/register?role=supplier', primary: true },
                { label: 'Post a requirement', to: '/post-requirement' },
              ]}
            />
          </div>
        )}

        {all.length > 0 && (
          <div className="relative z-10">
            {/* Country chips */}
            <div className="mt-8 flex items-center gap-3">
              <div ref={chipsRef} className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter by country">
                <button type="button" className="lv-chip" aria-pressed={filters.country === 'all'} onClick={() => setFilter('country', 'all')}>
                  <Globe className="h-5 w-5" aria-hidden="true" />
                  All Suppliers
                </button>
                {countries.slice(0, 14).map((entry) => (
                  <button
                    key={entry.country}
                    type="button"
                    className="lv-chip"
                    aria-pressed={filters.country === entry.country}
                    onClick={() => setFilter('country', filters.country === entry.country ? 'all' : entry.country)}
                  >
                    <FlagDot iso2={entry.iso2} />
                    {entry.country}
                  </button>
                ))}
              </div>
              {chipsOverflow && (
                <button
                  type="button"
                  className="lv-arrow hidden shrink-0 sm:grid"
                  aria-label="Show more countries"
                  onClick={() => chipsRef.current?.scrollBy({ left: 260, behavior: reducedMotion ? 'auto' : 'smooth' })}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Search and filters */}
            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_200px_220px] lg:gap-4">
              <label className="lv-field">
                <span className="sr-only">Search verified suppliers</span>
                <Search aria-hidden="true" />
                <input
                  type="search"
                  className="lv-input"
                  placeholder={compact ? 'Search verified suppliers…' : 'Search verified suppliers (e.g. packaging, machinery, textiles…)'}
                  value={filters.query}
                  onChange={(event) => setFilter('query', event.target.value)}
                />
              </label>
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:contents">
                <SelectField
                  icon={<SlidersHorizontal aria-hidden="true" />}
                  label="Category"
                  value={filters.category}
                  onChange={(value) => setFilter('category', value)}
                  allLabel="Categories"
                  options={categories}
                />
                <SelectField
                  icon={<Building2 aria-hidden="true" />}
                  label="Supplier type"
                  value={filters.type}
                  onChange={(value) => setFilter('type', value)}
                  allLabel="Supplier Type"
                  options={types}
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--lv-faint)]" aria-live="polite">
              {visible.length === all.length
                ? `${visible.length} verified ${visible.length === 1 ? 'supplier' : 'suppliers'}`
                : `Showing ${visible.length} of ${all.length} verified suppliers`}
            </p>

            {visible.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={<Search className="h-8 w-8" aria-hidden="true" />}
                  title="No verified supplier matches these filters"
                  body="Try a different country, category or search word."
                />
                {filtersActive && (
                  <div className="mt-5 flex justify-center">
                    <button type="button" className="lv-btn lv-btn--outline" onClick={() => setFilters(NO_FILTERS)}>
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative mt-5">
                <div ref={railRef} className="lv-rail" onScroll={measureRail} role="region" aria-label="Verified suppliers" tabIndex={0}>
                  {visible.map((card) => (
                    <SupplierCard key={card.supplier.id} {...card} />
                  ))}
                </div>
                {rail.canPrev && (
                  <button type="button" className="lv-arrow absolute -left-5 top-[30%] z-10 hidden lg:grid" aria-label="Previous suppliers" onClick={() => scrollRail(-1)}>
                    <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                  </button>
                )}
                {rail.canNext && (
                  <button type="button" className="lv-arrow absolute -right-5 top-[30%] z-10 hidden lg:grid" aria-label="Next suppliers" onClick={() => scrollRail(1)}>
                    <ChevronRight className="h-6 w-6" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <Link to="/manufacturers" className="lv-btn lv-btn--outline px-8">
                View All Verified Suppliers
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
