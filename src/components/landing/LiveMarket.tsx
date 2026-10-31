import { BadgeCheck, ChevronRight, Clock, Flame, Gavel, MapPin, Package, Radio } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketArt, SectionBackdrop } from '@/components/landing/SectionArt';
import { CardSkeleton, EmptyState, ErrorState, SectionHeading } from '@/components/landing/shared';
import { UniqueImage } from '@/components/landing/UniqueImage';
import { useAuctions, useLiveRequirements } from '@/hooks/useHomepageData';
import { useNow } from '@/hooks/useNow';
import { type AuctionTab, formatAgo, formatCountdown, formatMoney, type HomeAuction, type LiveRequirement } from '@/lib/homepageData';
import { landingImages } from '@/lib/imageRegistry';

type Tab = 'rfqs' | AuctionTab;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'rfqs', label: 'Live RFQs' },
  { id: 'live', label: 'Live Auctions' },
  { id: 'upcoming', label: 'Upcoming' },
];

const PHASE_LABEL: Record<HomeAuction['phase'], string> = {
  live: 'Live',
  closing_soon: 'Closing soon',
  upcoming: 'Upcoming',
  ended: 'Ended',
};

const RfqCard = memo(function RfqCard({ rfq, photo, now }: { rfq: LiveRequirement; photo: string | null; now: number }) {
  return (
    <article className="lv-card lv-lift flex flex-col overflow-hidden" data-rfq-card>
      <div className={`relative w-full overflow-hidden bg-[#0a1222] ${photo ? 'aspect-[16/10]' : 'aspect-[16/5]'}`}>
        <UniqueImage src={photo} alt={`Reference photo for the requirement: ${rfq.title}`} placeholderKind="rfq" showCaption={false} sizes="(min-width: 1024px) 380px, 90vw" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {rfq.isNew && <span className="lv-pill !bg-[var(--lv-green)] !text-[#04210f]">New</span>}
          {rfq.isUrgent && <span className="lv-pill !bg-[#dc2626]">Urgent</span>}
        </div>
        {rfq.categoryName && <span className="lv-pill absolute bottom-3 left-3 max-w-[80%]"><span className="truncate">{rfq.categoryName}</span></span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white">{rfq.title}</h3>
        <dl className="mt-3 space-y-1.5 text-sm text-[var(--lv-muted)]">
          <div className="flex items-center gap-2"><Package className="h-4 w-4 shrink-0" aria-hidden="true" /><dt className="sr-only">Quantity</dt><dd>{rfq.quantity}</dd></div>
          {rfq.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /><dt className="sr-only">Deliver to</dt><dd className="truncate">{rfq.location}</dd></div>}
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" aria-hidden="true" /><dt className="sr-only">Posted</dt><dd>{formatAgo(rfq.postedAt, now)}</dd></div>
        </dl>
        {rfq.buyerVerified && <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--lv-orange-2)]"><BadgeCheck className="h-4 w-4" aria-hidden="true" />Verified buyer</p>}
        <div className="mt-auto pt-5">
          <Link to={`/requirements/${rfq.routeId}`} className="lv-btn lv-btn--outline lv-btn--block !min-h-12" aria-label={`View requirement: ${rfq.title}`}>
            View RFQ
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
});

const AuctionCard = memo(function AuctionCard({ auction, photo, now }: { auction: HomeAuction; photo: string | null; now: number }) {
  const target = auction.phase === 'upcoming' && auction.startTime ? new Date(auction.startTime).getTime() : new Date(auction.endTime).getTime();
  const bid = auction.currentBid && auction.currentBid > 0 ? auction.currentBid : auction.startingPrice;
  return (
    <article className="lv-card lv-lift flex flex-col overflow-hidden" data-auction-card>
      <div className={`relative w-full overflow-hidden bg-[#0a1222] ${photo ? 'aspect-[16/10]' : 'aspect-[16/6]'}`}>
        <UniqueImage src={photo} alt={`Photo for the auction: ${auction.title}`} placeholderKind="auction" showCaption={false} sizes="(min-width: 1024px) 380px, 90vw" />
        <span className={`lv-pill absolute left-3 top-3 ${auction.phase === 'live' ? '!bg-[#dc2626]' : auction.phase === 'closing_soon' ? '!bg-[#d97706]' : ''}`}>
          {auction.phase === 'live' && <Radio className="h-4 w-4" aria-hidden="true" />}
          {PHASE_LABEL[auction.phase]}
        </span>
        <span className="lv-pill absolute right-3 top-3 tabular-nums">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {formatCountdown(target - now)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white">{auction.title}</h3>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--lv-faint)]">{auction.currentBid && auction.currentBid > 0 ? 'Current bid' : 'Starting price'}</p>
            <p className="text-xl font-extrabold text-white">{bid !== null ? formatMoney(bid, 'INR') : 'On request'}</p>
          </div>
          <p className="text-sm text-[var(--lv-muted)]">{auction.totalBids} {auction.totalBids === 1 ? 'bid' : 'bids'}</p>
        </div>
        {auction.quantityLabel && <p className="mt-2 flex items-center gap-2 text-sm text-[var(--lv-muted)]"><Package className="h-4 w-4" aria-hidden="true" />{auction.quantityLabel}</p>}
        <div className="mt-auto pt-5">
          <Link to={`/auctions/${auction.type}/${auction.id}`} className="lv-btn lv-btn--primary lv-btn--block !min-h-12" aria-label={`View auction: ${auction.title}`}>
            {auction.phase === 'upcoming' ? 'View Auction' : 'Place Bid'}
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
});

export default function LiveMarket() {
  const [tab, setTab] = useState<Tab>('rfqs');
  const rfqs = useLiveRequirements(6);
  const auctions = useAuctions(tab === 'rfqs' ? 'live' : tab, 6);
  const now = useNow(1000);

  const rfqCards = useMemo(() => {
    landingImages.releaseGroup('rfqs:');
    return (rfqs.data ?? []).map((rfq) => ({ rfq, photo: landingImages.claimFirst(`rfqs:${rfq.id}`, rfq.imageCandidates) }));
  }, [rfqs.data]);
  const auctionCards = useMemo(() => {
    landingImages.releaseGroup('auctions:');
    return (auctions.data ?? []).map((auction) => ({ auction, photo: landingImages.claimFirst(`auctions:${auction.id}`, auction.imageCandidates) }));
  }, [auctions.data]);

  const active = tab === 'rfqs' ? rfqs : auctions;
  const items = tab === 'rfqs' ? rfqCards : auctionCards;

  return (
    <section id="live-market" className="lv-section" aria-labelledby="live-market-title">
      <SectionBackdrop slot="market">
        <MarketArt />
      </SectionBackdrop>
      <div className="lv-container">
        <SectionHeading
          eyebrow="Live demand"
          eyebrowIcon={<Flame className="h-5 w-5" aria-hidden="true" />}
          title="Live RFQs &"
          accent="Auctions"
          lead="Open buyer requirements and bulk auctions, read straight from the marketplace."
          actions={
            <Link to="/post-requirement" className="lv-btn lv-btn--primary">
              Post a Requirement
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
        <span id="live-market-title" className="sr-only">Live RFQs and auctions</span>

        <div className="mt-8 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Live RFQs and auctions">
          {TABS.map((entry) => (
            <button key={entry.id} type="button" role="tab" id={`market-tab-${entry.id}`} aria-selected={tab === entry.id} aria-pressed={tab === entry.id} aria-controls="market-panel" className="lv-chip" onClick={() => setTab(entry.id)}>
              {entry.id !== 'rfqs' && <Gavel className="h-5 w-5" aria-hidden="true" />}
              {entry.label}
            </button>
          ))}
        </div>

        <div id="market-panel" role="tabpanel" aria-labelledby={`market-tab-${tab}`} className="mt-6">
          {active.loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <CardSkeleton tall={false} />
              <CardSkeleton tall={false} />
              <div className="hidden lg:block"><CardSkeleton tall={false} /></div>
            </div>
          )}
          {active.failed && <ErrorState what={tab === 'rfqs' ? 'the live RFQs' : 'the auctions'} onRetry={active.retry} />}
          {!active.loading && !active.failed && items.length === 0 && (
            <EmptyState
              icon={tab === 'rfqs' ? <Package className="h-8 w-8" aria-hidden="true" /> : <Gavel className="h-8 w-8" aria-hidden="true" />}
              title={tab === 'rfqs' ? 'No open RFQs right now' : tab === 'live' ? 'No live auctions right now' : 'No upcoming auctions scheduled'}
              body={tab === 'rfqs' ? 'Buyers post requirements here as they raise them. Need something sourced? Post yours and suppliers will quote.' : 'Auctions appear here when a seller schedules or starts one.'}
              actions={[{ label: tab === 'rfqs' ? 'Post a requirement' : 'Browse auctions', to: tab === 'rfqs' ? '/post-requirement' : '/auctions', primary: true }]}
            />
          )}
          {!active.loading && !active.failed && items.length > 0 && (
            <div className="lv-phone-rail">
              {tab === 'rfqs'
                ? rfqCards.map((card) => <RfqCard key={card.rfq.id} rfq={card.rfq} photo={card.photo} now={now} />)
                : auctionCards.map((card) => <AuctionCard key={card.auction.id} auction={card.auction} photo={card.photo} now={now} />)}
            </div>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <Link to={tab === 'rfqs' ? '/requirements' : '/auctions'} className="lv-btn lv-btn--outline px-8">
            {tab === 'rfqs' ? 'View All RFQs' : 'View All Auctions'}
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
