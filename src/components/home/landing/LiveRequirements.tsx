import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, FileText } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';
import { SectionLink, SkeletonCards, StateMessage } from '@/components/home/landing/shared';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveRequirements } from '@/hooks/useHomepageData';
import { formatDate, type LiveRequirement } from '@/lib/homepageData';

function RequirementCard({ requirement, signedIn }: { requirement: LiveRequirement; signedIn: boolean }) {
  const detailPath = `/requirement/${encodeURIComponent(requirement.routeId)}`;
  // Manufacturers reply from the RFQ page. Signed-out visitors sign in first, then return to it.
  const contactPath = signedIn
    ? detailPath
    : `/auth?tab=supplier&redirect=${encodeURIComponent(detailPath)}`;

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {requirement.buyerVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            Verified buyer
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Buyer not verified
          </span>
        )}
        {requirement.categoryName && (
          <span className="text-[11px] text-muted-foreground">{requirement.categoryName}</span>
        )}
      </div>

      <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{requirement.title}</h3>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Quantity</dt>
          <dd className="font-semibold text-foreground">{requirement.quantity}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Buyer location</dt>
          <dd className="font-semibold text-foreground">{requirement.location ?? 'Not specified'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Posted</dt>
          <dd className="font-semibold text-foreground">{formatDate(requirement.postedAt)}</dd>
        </div>
      </dl>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <Button asChild variant="outline" size="sm" className="font-semibold text-primary">
          <Link to={detailPath}>View Details</Link>
        </Button>
        <Button asChild size="sm" className="font-bold">
          <Link to={contactPath}>Contact Buyer</Link>
        </Button>
      </div>
    </article>
  );
}

export default function LiveRequirements() {
  const requirements = useLiveRequirements();
  const { user } = useAuth();
  const items = requirements.data ?? [];

  return (
    <section aria-label="Live buying requirements" className="border-y border-border bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Live buying requirements"
          icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />}
          title="Live buying requirements"
          subtitle="Active requirements posted by buyers on Bulkskart. Respond with a quotation if you can supply them."
          action={<SectionLink to="/requirements">View all RFQs <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></SectionLink>}
        />

        <div className="mt-8">
          {requirements.loading && !requirements.data ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCards count={3} heightClass="h-64" />
            </div>
          ) : requirements.failed ? (
            <StateMessage message="Buying requirements could not be loaded right now." onRetry={requirements.retry} />
          ) : items.length === 0 ? (
            <StateMessage
              message="There are no active buying requirements right now."
              actionHref="/post-requirement"
              actionLabel="Post a Requirement"
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((requirement) => (
                <li key={requirement.id}>
                  <RequirementCard requirement={requirement} signedIn={Boolean(user)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
