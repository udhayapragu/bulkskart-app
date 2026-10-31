import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Package } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';
import { SectionLink, SkeletonCards, StateMessage } from '@/components/home/landing/shared';
import { Button } from '@/components/ui/button';
import { useFeaturedProducts } from '@/hooks/useHomepageData';
import type { FeaturedProduct } from '@/lib/homepageData';

function ProductCard({ product }: { product: FeaturedProduct }) {
  const productPath = `/products/${encodeURIComponent(product.slug)}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      <Link to={productPath} tabIndex={-1} aria-hidden="true" className="relative block aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-foreground sm:text-[15px]">
          <Link to={productPath} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm font-black text-primary">{product.priceLabel}</p>
        {product.moqLabel && <p className="text-xs text-muted-foreground">{product.moqLabel}</p>}

        <div className="mt-auto space-y-1 border-t border-border pt-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            <span className="truncate">{product.companyName}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Verified{product.country ? ` · ${product.country}` : ''}
          </p>
        </div>

        <Button asChild size="sm" className="mt-1 w-full font-bold">
          <Link to={productPath}>Get Best Price</Link>
        </Button>
      </div>
    </article>
  );
}

export default function FeaturedProducts() {
  const products = useFeaturedProducts();
  const items = products.data ?? [];

  return (
    <section aria-label="Featured bulk products" className="border-b border-border bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Featured bulk products"
          icon={<Package className="h-3.5 w-3.5" aria-hidden="true" />}
          title="Featured bulk products"
          subtitle="Listings from verified manufacturers, with the photo, MOQ and price each supplier published."
          action={<SectionLink to="/products">View all products <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></SectionLink>}
        />

        <div className="mt-8">
          {products.loading && !products.data ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              <SkeletonCards count={4} heightClass="h-72" />
            </div>
          ) : products.failed ? (
            <StateMessage message="Featured products could not be loaded right now." onRetry={products.retry} />
          ) : items.length === 0 ? (
            <StateMessage
              message="No featured products with photographs are published yet."
              actionHref="/products"
              actionLabel="Browse all products"
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
