import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Cog, Cpu, Factory, FlaskConical, Layers, Package, Shirt, Wheat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';
import { SectionLink, SkeletonCards, StateMessage } from '@/components/home/landing/shared';
import type { LoadState } from '@/hooks/useHomepageData';
import { isUsableImageUrl } from '@/lib/homepageData';
import type { Category } from '@/types/types';

/** Icon tiles for categories without an uploaded photo. These are interface icons, not product images. */
const CATEGORY_ICONS: Array<[RegExp, LucideIcon]> = [
  [/machin|equipment|industrial/i, Cog],
  [/steel|metal|alumin|iron/i, Factory],
  [/textile|garment|fabric|apparel|cloth/i, Shirt],
  [/chemi|raw material|polymer|plastic/i, FlaskConical],
  [/packag|carton|box/i, Package],
  [/electr|electronic|circuit/i, Cpu],
  [/agri|food|grain|spice/i, Wheat],
  [/construct|cement|building/i, Building2],
];

function iconFor(name: string): LucideIcon {
  return CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Layers;
}

interface IndustryCategoriesProps {
  categories: LoadState<Category[]>;
}

export default function IndustryCategories({ categories }: IndustryCategoriesProps) {
  const items = categories.data ?? [];

  return (
    <section aria-label="Industry categories" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <SectionHeader
        eyebrow="Industry categories"
        icon={<Layers className="h-3.5 w-3.5" aria-hidden="true" />}
        title="Shop by industry category"
        subtitle="Browse listings from verified manufacturers in each industry."
        action={<SectionLink to="/categories">View all categories <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></SectionLink>}
      />

      <div className="mt-8">
        {categories.loading && !categories.data ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
            <SkeletonCards count={8} heightClass="h-36" />
          </div>
        ) : categories.failed ? (
          <StateMessage message="Categories could not be loaded right now." onRetry={categories.retry} />
        ) : items.length === 0 ? (
          <StateMessage message="Categories will appear here once they are published." actionHref="/products" actionLabel="Browse products" />
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
            {items.map((category) => {
              const Icon = iconFor(category.name);
              const photo = isUsableImageUrl(category.image_url) ? category.image_url : null;
              return (
                <li key={category.id}>
                  <Link
                    to={`/products?category=${encodeURIComponent(category.slug)}`}
                    className="group flex h-full min-h-[140px] flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="mb-3 h-20 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                      </div>
                    )}
                    <h3 className="mt-auto text-sm font-bold leading-snug text-foreground group-hover:text-primary sm:text-base">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
