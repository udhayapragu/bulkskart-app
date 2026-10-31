import React from 'react';
import { BadgeCheck, FileText, Globe, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LoadState } from '@/hooks/useHomepageData';
import { formatNumber, type MarketplaceOverview } from '@/lib/homepageData';

interface Metric {
  label: string;
  value: number;
  icon: LucideIcon;
}

interface MarketStatsProps {
  overview: LoadState<MarketplaceOverview>;
}

/**
 * Live counts from the database. A figure that fails to load, or is zero, is hidden.
 * Nothing on this strip is hardcoded.
 */
export default function MarketStats({ overview }: MarketStatsProps) {
  if (overview.loading && !overview.data) {
    return (
      <section aria-label="Live marketplace statistics" className="border-b border-border">
        <div aria-hidden="true" className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[72px] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </section>
    );
  }

  const data = overview.data;
  if (!data) return null;

  const candidates: Array<Metric | null> = [
    data.verifiedManufacturers === null
      ? null
      : { label: 'Verified manufacturers', value: data.verifiedManufacturers, icon: BadgeCheck },
    data.activeProducts === null ? null : { label: 'Active products', value: data.activeProducts, icon: Package },
    data.countries === null ? null : { label: 'Countries with verified suppliers', value: data.countries.length, icon: Globe },
    data.activeRequirements === null
      ? null
      : { label: 'Active buying requirements', value: data.activeRequirements, icon: FileText },
  ];
  const metrics = candidates.filter((metric): metric is Metric => metric !== null && metric.value > 0);
  if (metrics.length === 0) return null;

  return (
    <section aria-label="Live marketplace statistics" className="border-b border-border">
      <dl className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xl font-black tabular-nums text-foreground">{formatNumber(value)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
