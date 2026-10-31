import { ChevronRight, Clock, MapPin, Megaphone, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, SectionHeading } from '@/components/landing/shared';
import { useLiveRequirements } from '@/hooks/useHomepageData';
import { useNow } from '@/hooks/useNow';
import { formatAgo } from '@/lib/homepageData';

const TWO_DAYS_MS = 48 * 3_600_000;

/** The newest buyer requirements, as a compact list. Text only, so it never repeats a photograph. */
export default function NewBuyLeads() {
  const state = useLiveRequirements(5, TWO_DAYS_MS);
  const now = useNow(30_000);
  const leads = state.data ?? [];

  return (
    <section id="new-buy-leads" className="lv-section lv-section--alt !py-12 lg:!py-16" aria-labelledby="new-buy-leads-title">
      <div className="lv-container">
        <SectionHeading
          eyebrow="Last 48 hours"
          eyebrowIcon={<Megaphone className="h-5 w-5" aria-hidden="true" />}
          title="New Buy"
          accent="Leads"
          lead="Fresh requirements from buyers. Suppliers can open a lead and respond with a quote."
        />
        <span id="new-buy-leads-title" className="sr-only">New buy leads</span>

        <div className="mt-8">
          {state.loading && (
            <div className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((key) => <div key={key} className="lv-skeleton h-[88px] rounded-[18px]" />)}
            </div>
          )}
          {state.failed && <ErrorState what="the new buy leads" onRetry={state.retry} />}
          {!state.loading && !state.failed && leads.length === 0 && (
            <EmptyState
              icon={<Megaphone className="h-8 w-8" aria-hidden="true" />}
              title="No new buy leads in the last 48 hours"
              body="New requirements appear here the moment buyers post them. Looking to buy in bulk? Post yours."
              actions={[{ label: 'Post a requirement', to: '/post-requirement', primary: true }, { label: 'See all RFQs', to: '/requirements' }]}
            />
          )}
          {leads.length > 0 && (
            <ul className="space-y-3" data-buy-leads>
              {leads.map((lead) => (
                <li key={lead.id}>
                  <Link
                    to={`/requirements/${lead.routeId}`}
                    className="lv-card lv-lift grid items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:gap-6"
                    aria-label={`View lead: ${lead.title}`}
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--lv-green)]">
                        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-[var(--lv-green)]" style={{ animation: 'lv-pulse-ring 2s ease-out infinite' }} /><span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--lv-green)]" /></span>
                        <span className="whitespace-nowrap">New lead</span>
                        {lead.categoryName && <span className="text-[var(--lv-faint)]">· {lead.categoryName}</span>}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-bold text-white">{lead.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[var(--lv-muted)]">
                        <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4" aria-hidden="true" />{lead.quantity}</span>
                        {lead.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{lead.location}</span>}
                        <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{formatAgo(lead.postedAt, now)}</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--lv-orange-2)]">
                      View lead
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
