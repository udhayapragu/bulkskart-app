import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { flagEmoji } from '@/lib/countries';

export function SectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  accent,
  lead,
  actions,
}: {
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: string;
  accent?: string;
  lead?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && (
          <span className="lv-eyebrow">
            {eyebrowIcon}
            {eyebrow}
          </span>
        )}
        <h2 className="lv-title" style={{ fontSize: 'clamp(2rem, 5.4vw, 3.2rem)' }}>
          {title} {accent && <span className="lv-grad">{accent}</span>}
        </h2>
        {lead && <p className="lv-lead">{lead}</p>}
      </div>
      {actions}
    </div>
  );
}

export function FlagDot({ iso2, className = '' }: { iso2: string | null | undefined; className?: string }) {
  const flag = flagEmoji(iso2);
  return (
    <span className={`lv-chip-flag ${className}`} aria-hidden="true">
      {flag || '🌐'}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actions,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  actions?: Array<{ label: string; to: string; primary?: boolean }>;
}) {
  return (
    <div className="lv-card mx-auto flex max-w-3xl flex-col items-center px-6 py-12 text-center sm:px-10" data-empty-state>
      <div className="lv-stat-icon" style={{ width: 64, height: 64 }}>
        {icon}
      </div>
      <h3 className="lv-h3 mt-5">{title}</h3>
      <p className="lv-lead mx-auto" style={{ fontSize: '1rem' }}>
        {body}
      </p>
      {actions && actions.length > 0 && (
        <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} className={`lv-btn ${action.primary ? 'lv-btn--primary' : 'lv-btn--outline'}`}>
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="lv-card mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-10 text-center" role="alert">
      <p className="text-base text-[var(--lv-muted)]">We could not load {what} right now.</p>
      <button type="button" onClick={onRetry} className="lv-btn lv-btn--outline">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export function CardSkeleton({ tall = true }: { tall?: boolean }) {
  return (
    <div className="lv-card overflow-hidden" aria-hidden="true">
      <div className={`lv-skeleton ${tall ? 'aspect-[4/3]' : 'aspect-[16/10]'}`} />
      <div className="space-y-3 p-5">
        <div className="lv-skeleton h-5 w-2/3 rounded-md" />
        <div className="lv-skeleton h-4 w-full rounded-md" />
        <div className="lv-skeleton h-4 w-4/5 rounded-md" />
        <div className="lv-skeleton mt-4 h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
