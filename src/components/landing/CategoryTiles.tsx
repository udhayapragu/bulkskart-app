import { Building2, Car, ChevronRight, CircleDot, Cpu, FlaskConical, Gem, Gift, Layers, Leaf, Pill, Settings, Shirt, Sofa, Tags, type LucideIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CategoriesArt, SectionBackdrop } from '@/components/landing/SectionArt';
import { EmptyState, ErrorState, SectionHeading } from '@/components/landing/shared';
import { UniqueImage } from '@/components/landing/UniqueImage';
import { useCategoryTiles } from '@/hooks/useHomepageData';
import { type CategoryTile, formatNumber } from '@/lib/homepageData';
import { landingImages } from '@/lib/imageRegistry';

/** Icon names stored on categories, mapped to the icons the site already bundles. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
  settings: Settings,
  leaf: Leaf,
  'flask-conical': FlaskConical,
  cpu: Cpu,
  'building-2': Building2,
  sofa: Sofa,
  car: Car,
  pill: Pill,
  'circle-dot': CircleDot,
  gem: Gem,
  gift: Gift,
};

const Tile = memo(function Tile({ tile, photo }: { tile: CategoryTile; photo: string | null }) {
  const Icon = CATEGORY_ICONS[tile.category.icon ?? ''] ?? Tags;
  const count = tile.productCount;
  return (
    <Link
      to={`/categories/${tile.category.slug}`}
      className="lv-card lv-lift group relative flex aspect-square flex-col justify-end overflow-hidden p-4 sm:aspect-[4/3] sm:p-5"
      data-category-tile
      aria-label={`${tile.category.name}${count !== null ? `, ${formatNumber(count)} products` : ''}`}
    >
      {photo ? (
        <>
          <UniqueImage src={photo} alt={`${tile.category.name} category photo`} placeholderKind="category" sizes="(min-width: 1024px) 300px, 46vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-[#050914]/55 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_85%_0%,rgba(255,101,0,0.22),transparent_60%),linear-gradient(160deg,rgba(24,36,60,0.9),rgba(10,16,30,0.95))]" aria-hidden="true">
          <Icon className="absolute right-3.5 top-3.5 h-10 w-10 text-[var(--lv-orange)]/80 transition-transform duration-300 group-hover:scale-110 sm:right-4 sm:top-4 sm:h-14 sm:w-14" strokeWidth={1.4} />
        </div>
      )}
      <div className="relative">
        <h3 className="line-clamp-3 text-base font-bold leading-snug text-white sm:line-clamp-2 sm:text-lg">{tile.category.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-[var(--lv-orange-2)]">
          {count !== null ? `${formatNumber(count)} ${count === 1 ? 'product' : 'products'}` : 'Browse category'}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </p>
      </div>
    </Link>
  );
});

export default function CategoryTiles() {
  const state = useCategoryTiles();
  const tiles = useMemo(() => {
    landingImages.releaseGroup('categories:');
    return (state.data ?? []).map((tile) => ({ tile, photo: landingImages.claimFirst(`categories:${tile.category.id}`, tile.imageCandidates) }));
  }, [state.data]);

  return (
    <section id="categories" className="lv-section lv-section--alt" aria-labelledby="categories-title">
      <SectionBackdrop slot="categories">
        <CategoriesArt />
      </SectionBackdrop>
      <div className="lv-container">
        <SectionHeading
          eyebrow="Shop by industry"
          eyebrowIcon={<Layers className="h-5 w-5" aria-hidden="true" />}
          title="Browse"
          accent="Categories"
          lead="Find suppliers and products in the industries Bulkskart covers."
          actions={
            <Link to="/categories" className="lv-btn lv-btn--outline">
              View All Categories
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
        <span id="categories-title" className="sr-only">Categories</span>

        <div className="mt-8">
          {state.loading && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((key) => <div key={key} className="lv-skeleton aspect-[4/3] rounded-[22px]" />)}
            </div>
          )}
          {state.failed && <ErrorState what="the categories" onRetry={state.retry} />}
          {!state.loading && !state.failed && tiles.length === 0 && (
            <EmptyState icon={<Tags className="h-8 w-8" aria-hidden="true" />} title="Categories are being set up" body="Product categories will appear here once they are published." actions={[{ label: 'Browse all products', to: '/products', primary: true }]} />
          )}
          {tiles.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
              {tiles.map(({ tile, photo }) => <Tile key={tile.category.id} tile={tile} photo={photo} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
