import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gavel } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';
import { SectionLink, SkeletonCards, StateMessage } from '@/components/home/landing/shared';
import { Button } from '@/components/ui/button';
import { useLiveAuctions } from '@/hooks/useHomepageData';
import { useNow } from '@/hooks/useNow';
import { formatCountdown, formatMoney, type LiveAuction } from '@/lib/homepageData';
import { cn } from '@/lib/utils';

function AuctionCard({ auction, now }: { auction: LiveAuction; now: number }) {
  const price = auction.currentBid ?? auction.startingPrice;
  const priceLabel = auction.currentBid !== null ? 'Current bid' : 'Starting price';
  const remaining = formatCountdown(new Date(auction.endTime).getTime() - now);
  const typeLabel = auction.type === 'forward' ? 'Forward auction' : 'Reverse auction';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {auction.image ? (
          <img src={auction.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Gavel className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
              auction.status === 'live' ? 'bg-red-600 text-white' : 'bg-amber-400 text-black',
            )}
          >
            {auction.status === 'live' ? 'Live' : 'Closing soon'}
          </span>
          <span className="rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">
            {typeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground sm:text-base">{auction.title}</h3>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">{priceLabel}</dt>
            <dd className="text-base font-black text-primary">
              {price === null ? 'Not set' : formatMoney(price, 'INR')}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time remaining</dt>
            <dd className="text-base font-bold tabular-nums text-foreground">{remaining}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Quantity</dt>
            <dd className="font-semibold text-foreground">{auction.quantityLabel ?? 'Not specified'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Bids</dt>
            <dd className="font-semibold text-foreground">{auction.totalBids}</dd>
          </div>
        </dl>
        <Button asChild className="mt-auto font-bold">
          <Link to={`/auctions/${auction.type}/${encodeURIComponent(auction.id)}`}>View Auction</Link>
        </Button>
      </div>
    </article>
  );
}

export default function LiveAuctions() {
  const auctions = useLiveAuctions();
  const now = useNow(1000);
  const items = auctions.data ?? [];

  return (
    <section aria-label="Live auctions" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <SectionHeader
        eyebrow="Live auctions"
        icon={<Gavel className="h-3.5 w-3.5" aria-hidden="true" />}
        title="Live auctions"
        subtitle="Auctions that are open or closing soon, with the current bid and bid count as recorded."
        action={<SectionLink to="/auctions">View all auctions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></SectionLink>}
      />

      <div className="mt-8">
        {auctions.loading && !auctions.data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCards count={3} heightClass="h-80" />
          </div>
        ) : auctions.failed ? (
          <StateMessage message="Live auctions could not be loaded right now." onRetry={auctions.retry} />
        ) : items.length === 0 ? (
          <StateMessage message="There are no live auctions at the moment." actionHref="/auctions" actionLabel="Browse auctions" />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((auction) => (
              <li key={auction.id}>
                <AuctionCard auction={auction} now={now} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
