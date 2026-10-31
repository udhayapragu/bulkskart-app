import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, MapPin } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';
import { SectionLink, SkeletonCards, StateMessage } from '@/components/home/landing/shared';
import { Button } from '@/components/ui/button';
import { useVerifiedManufacturers } from '@/hooks/useHomepageData';
import type { VerifiedManufacturer } from '@/lib/homepageData';

function ManufacturerCard({ manufacturer }: { manufacturer: VerifiedManufacturer }) {
  const location = [manufacturer.city, manufacturer.country].filter(Boolean).join(', ');
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted">
        <img
          src={manufacturer.image}
          alt={manufacturer.imageIsLogo ? `${manufacturer.name} logo` : `${manufacturer.name}`}
          loading="lazy"
          decoding="async"
          className={manufacturer.imageIsLogo ? 'h-full w-full object-contain p-8' : 'h-full w-full object-cover'}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            Verified manufacturer
          </span>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{manufacturer.name}</h3>
          {location && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        {manufacturer.categories.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Product categories">
            {manufacturer.categories.map((name) => (
              <li key={name} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                {name}
              </li>
            ))}
          </ul>
        )}

        <Button asChild variant="outline" size="sm" className="mt-auto font-semibold text-primary">
          <Link to={`/companies/${encodeURIComponent(manufacturer.slug)}`}>View Profile</Link>
        </Button>
      </div>
    </article>
  );
}

export default function VerifiedManufacturers() {
  const manufacturers = useVerifiedManufacturers();
  const items = manufacturers.data ?? [];

  return (
    <section aria-label="Verified manufacturers" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <SectionHeader
        eyebrow="Verified manufacturers"
        icon={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />}
        title="Verified manufacturers"
        subtitle="Manufacturers with a verified status on Bulkskart. Each profile shows its location and product categories."
        action={<SectionLink to="/manufacturers">View all suppliers <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></SectionLink>}
      />

      <div className="mt-8">
        {manufacturers.loading && !manufacturers.data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCards count={3} heightClass="h-80" />
          </div>
        ) : manufacturers.failed ? (
          <StateMessage message="Verified manufacturers could not be loaded right now." onRetry={manufacturers.retry} />
        ) : items.length === 0 ? (
          <StateMessage
            message="No verified manufacturers with a company image are published yet."
            actionHref="/manufacturers"
            actionLabel="Browse suppliers"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((manufacturer) => (
              <li key={manufacturer.id}>
                <ManufacturerCard manufacturer={manufacturer} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
