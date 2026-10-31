import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Calculator, Globe, Ship } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';
import { StateMessage } from '@/components/home/landing/shared';
import { REFERENCE_PORTS } from '@/config/homepage';
import { type CountryCount, formatNumber } from '@/lib/homepageData';

const TOOLS = [
  { label: 'AI Import & Export Assistant', href: '/trade-assistant' },
  { label: 'Shipping Calculator', href: '/shipping-calculator' },
  { label: 'Order Loan Calculator', href: '/loan-calculator' },
];

interface TradeRoutesProps {
  countries: CountryCount[] | null;
  loading: boolean;
}

export default function TradeRoutes({ countries, loading }: TradeRoutesProps) {
  return (
    <section aria-label="Global trade routes" className="border-y border-border bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Global trade"
          icon={<Globe className="h-3.5 w-3.5" aria-hidden="true" />}
          title="Global trade routes"
          subtitle="Countries where verified manufacturers are listed, major ports for reference, and the import and export tools. Shipping routes and live cargo movements are not shown."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <section aria-labelledby="trade-countries" className="rounded-2xl border border-border bg-card p-5">
            <h3 id="trade-countries" className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
              Countries with verified manufacturers
            </h3>
            {loading && countries === null ? (
              <div aria-hidden="true" className="h-40 animate-pulse rounded-xl bg-muted/60" />
            ) : countries === null ? (
              <StateMessage message="Country figures are unavailable right now." />
            ) : countries.length === 0 ? (
              <StateMessage message="No verified manufacturer has a country listed yet." />
            ) : (
              <ul className="divide-y divide-border">
                {countries.slice(0, 8).map((item) => (
                  <li key={item.country}>
                    <Link
                      to={`/products?country=${encodeURIComponent(item.country)}`}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm text-foreground hover:text-primary"
                    >
                      <span className="font-medium">{item.country}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(item.count)} verified {item.count === 1 ? 'company' : 'companies'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="trade-ports" className="rounded-2xl border border-border bg-card p-5">
            <h3 id="trade-ports" className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
              <Anchor className="h-4 w-4 text-primary" aria-hidden="true" />
              Major ports
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">Reference list only. Not shipping schedules.</p>
            <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {REFERENCE_PORTS.map((port) => (
                <li key={port.name} className="flex items-center gap-2 border-b border-border py-2 text-sm">
                  <Ship className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-foreground">{port.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{port.country}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="trade-tools" className="rounded-2xl border border-border bg-card p-5">
            <h3 id="trade-tools" className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Calculator className="h-4 w-4 text-primary" aria-hidden="true" />
              Import and export tools
            </h3>
            <ul className="divide-y divide-border">
              {TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link to={tool.href} className="block py-3 text-sm font-medium text-foreground hover:text-primary">
                    {tool.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
