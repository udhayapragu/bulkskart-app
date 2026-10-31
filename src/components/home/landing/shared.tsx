import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Placeholder cards shown while a section loads. The caller supplies the grid. */
export function SkeletonCards({ count, heightClass }: { count: number; heightClass: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className={`${heightClass} animate-pulse rounded-2xl border border-border bg-card`} />
      ))}
    </>
  );
}

interface StateMessageProps {
  message: string;
  onRetry?: () => void;
  actionHref?: string;
  actionLabel?: string;
}

/**
 * Empty and error state. It says what is missing and never fills the gap with sample cards.
 */
export function StateMessage({ message, onRetry, actionHref, actionLabel }: StateMessageProps) {
  return (
    <div
      role="status"
      className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {(onRetry || actionHref) && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 font-semibold text-primary">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          )}
          {actionHref && actionLabel && (
            <Button asChild size="sm" className="font-bold">
              <Link to={actionHref}>{actionLabel}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** "View all" link used in section headers. */
export function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
