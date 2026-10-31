import { BadgeCheck, ChevronLeft, ChevronRight, Package, Sparkles } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrefersReducedMotion } from '@/components/home/hero/useHeroEnvironment';
import { ProductsArt, SectionBackdrop } from '@/components/landing/SectionArt';
import { CardSkeleton, EmptyState, ErrorState, FlagDot, SectionHeading } from '@/components/landing/shared';
import { UniqueImage } from '@/components/landing/UniqueImage';
import { useCategoryTree, useFeaturedProducts } from '@/hooks/useHomepageData';
import { useNow } from '@/hooks/useNow';
import { findCountry } from '@/lib/countries';
import type { FeaturedProduct } from '@/lib/homepageData';
import { landingImages } from '@/lib/imageRegistry';

const ROTATE_MS = 30_000;
const MAX_PRODUCTS = 12;

interface ProductCardData {
  product: FeaturedProduct;
  photo: string;
}

const ProductCard = memo(function ProductCard({ product, photo }: ProductCardData) {
  const info = findCountry(product.country);
  return (
    <article className="lv-card lv-lift flex flex-col overflow-hidden" data-product-card data-product-id={product.id}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a1222]">
        <UniqueImage src={photo} alt={product.name} placeholderKind="product" sizes="(min-width: 1100px) 300px, (min-width: 768px) 46vw, 78vw" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="lv-badge-verified absolute left-3 top-3 !px-3 !py-1.5 !text-[0.8rem]">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Verified Supplier
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {product.categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lv-orange-2)]">{product.categoryName}</p>}
        <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-white">{product.name}</h3>
        <Link to={`/manufacturers/${product.companySlug}`} className="-mb-2 flex items-center gap-2 py-2 text-sm text-[var(--lv-muted)] hover:text-white">
          <FlagDot iso2={info?.iso2} className="!h-6 !w-6 !text-base" />
          <span className="truncate">
            {product.companyName}
            {product.country ? ` · ${info?.name ?? product.country}` : ''}
          </span>
        </Link>
        <div className="mt-4">
          <p className="text-xl font-extrabold text-white">{product.priceLabel}</p>
          {product.moqLabel && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--lv-muted)]"><Package className="h-4 w-4" aria-hidden="true" />{product.moqLabel}</p>}
        </div>
        <div className="mt-auto pt-5">
          <Link to={`/products/${product.slug}`} className="lv-btn lv-btn--primary lv-btn--block !min-h-12" aria-label={`View product: ${product.name}`}>
            View Product
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
});

export default function LandingProducts() {
  const tree = useCategoryTree();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const categoryIds = useMemo(() => {
    if (!categoryId || !tree.data) return null;
    return [categoryId, ...(tree.data.childIds[categoryId] ?? [])];
  }, [categoryId, tree.data]);
  const state = useFeaturedProducts(categoryId, categoryIds);
  const reducedMotion = usePrefersReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [page, setPage] = useState({ index: 0, count: 1 });
  const now = useNow(1000);

  const cards = useMemo<ProductCardData[]>(() => {
    // One photo per product, and never one that another card or section already shows.
    landingImages.releaseGroup('products:');
    const out: ProductCardData[] = [];
    for (const product of state.data ?? []) {
      const photo = landingImages.claimFirst(`products:${product.id}`, product.imageCandidates);
      if (photo) out.push({ product, photo });
      if (out.length === MAX_PRODUCTS) break;
    }
    return out;
  }, [state.data]);

  // One "page" is as many whole cards as fit across the rail.
  const pageMetrics = (element: HTMLDivElement) => {
    const first = element.firstElementChild as HTMLElement | null;
    const step = (first?.offsetWidth ?? element.clientWidth) + 24;
    const perPage = Math.max(1, Math.floor((element.clientWidth + 24) / step));
    return { step, perPage, pageWidth: step * perPage, total: element.children.length };
  };

  const measure = () => {
    const element = railRef.current;
    if (!element) return;
    const { pageWidth, perPage, total } = pageMetrics(element);
    const count = Math.max(1, Math.ceil(total / perPage));
    setPage({ index: Math.min(count - 1, Math.round(element.scrollLeft / pageWidth)), count });
  };

  useEffect(() => {
    measure();
    const element = railRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cards.length]);

  // Rotate to the next set every 30 seconds while nobody is interacting.
  useEffect(() => {
    const element = railRef.current;
    if (!element || reducedMotion || paused || page.count < 2) return undefined;
    const timer = window.setInterval(() => {
      const next = page.index + 1 >= page.count ? 0 : page.index + 1;
      element.scrollTo({ left: next * pageMetrics(element).pageWidth, behavior: 'smooth' });
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [page.index, page.count, paused, reducedMotion]);

  const goTo = (index: number) => {
    const element = railRef.current;
    if (element) element.scrollTo({ left: index * pageMetrics(element).pageWidth, behavior: reducedMotion ? 'auto' : 'smooth' });
  };
  const secondsSince = state.updatedAt ? Math.max(0, Math.round((now - state.updatedAt) / 1000)) : null;
  const refreshing = secondsSince !== null ? Math.min(100, (secondsSince / (ROTATE_MS / 1000)) * 100) : 0;

  return (
    <section id="featured-products" className="lv-section lv-section--alt" aria-labelledby="featured-products-title">
      <SectionBackdrop slot="products">
        <ProductsArt />
      </SectionBackdrop>
      <div className="lv-container">
        <SectionHeading
          eyebrow="Wholesale catalogue"
          eyebrowIcon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
          title="Featured"
          accent="Products"
          lead="Listings from verified suppliers, with their own photos, wholesale prices and minimum order quantities."
          actions={
            <Link to="/products" className="lv-btn lv-btn--outline">
              View All Products
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
        {/* heading id for the section landmark */}
        <span id="featured-products-title" className="sr-only">
          Featured products
        </span>

        {tree.data && tree.data.top.length > 0 && (
          <div className="mt-8 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter products by category">
            <button type="button" className="lv-chip" aria-pressed={categoryId === null} onClick={() => setCategoryId(null)}>
              All Products
            </button>
            {tree.data.top.slice(0, 9).map((category) => (
              <button key={category.id} type="button" className="lv-chip" aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>
                {category.name}
              </button>
            ))}
          </div>
        )}

        {/* Live indicator */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--lv-muted)]" data-live-indicator>
          <span className="inline-flex items-center gap-2 font-semibold text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--lv-green)]" style={{ animation: 'lv-pulse-ring 2s ease-out infinite' }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--lv-green)]" />
            </span>
            Live
          </span>
          <span>{secondsSince === null ? 'Loading…' : `Updated ${secondsSince}s ago · refreshes every 30s`}</span>
          <span className="lv-progress hidden w-28 sm:block" aria-hidden="true">
            <span style={{ left: 0, width: `${refreshing}%` }} />
          </span>
        </div>

        {state.loading && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            <CardSkeleton />
            <CardSkeleton />
            <div className="hidden lg:block"><CardSkeleton /></div>
            <div className="hidden lg:block"><CardSkeleton /></div>
          </div>
        )}
        {state.failed && (
          <div className="mt-8">
            <ErrorState what="the featured products" onRetry={state.retry} />
          </div>
        )}
        {!state.loading && !state.failed && cards.length === 0 && (
          <div className="mt-8">
            <EmptyState
              icon={<Package className="h-8 w-8" aria-hidden="true" />}
              title={categoryId ? 'No products in this category yet' : 'Products from verified suppliers will appear here'}
              body="A product is shown once its supplier is verified and it has its own photograph. Nothing is added to fill space."
              actions={[
                { label: 'Browse all products', to: '/products', primary: true },
                { label: 'Join as Manufacturer', to: '/register?role=supplier' },
              ]}
            />
          </div>
        )}

        {cards.length > 0 && (
          <div
            className="relative mt-6"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
          >
            <div ref={railRef} className="lv-rail lv-rail--products" onScroll={measure} role="region" aria-label="Featured products" tabIndex={0}>
              {cards.map((card) => (
                <ProductCard key={card.product.id} {...card} />
              ))}
            </div>
            {page.count > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <button type="button" className="lv-arrow" aria-label="Previous products" disabled={page.index === 0} onClick={() => goTo(page.index - 1)}>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {page.count <= 6 ? (
                  <div className="flex items-center" role="group" aria-label="Product sets">
                    {Array.from({ length: page.count }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => goTo(index)}
                        aria-label={`Show product set ${index + 1} of ${page.count}`}
                        aria-current={index === page.index}
                        className="grid h-6 place-items-center px-[7px]"
                      >
                        <span className={`block h-2.5 rounded-full transition-all ${index === page.index ? 'w-8 bg-[var(--lv-orange)]' : 'w-2.5 bg-white/25'}`} />
                      </button>
                    ))}
                  </div>
                ) : (
                  // too many sets for dots a finger can hit: say where we are instead
                  <p className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums text-white" aria-live="polite" aria-label={`Set ${page.index + 1} of ${page.count}`}>
                    {page.index + 1} <span className="font-normal text-[var(--lv-muted)]">/ {page.count}</span>
                  </p>
                )}
                <button type="button" className="lv-arrow" aria-label="Next products" disabled={page.index >= page.count - 1} onClick={() => goTo(page.index + 1)}>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
