import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeliveryPolicy } from '@/hooks/useDeliveryPolicy';

/** Delivery promise. The wording comes from public/content/delivery-policy.json. */
export default function DeliveryPromise() {
  const policy = useDeliveryPolicy();

  return (
    <section id="free-delivery" aria-labelledby="free-delivery-title" className="scroll-mt-20 border-b border-border bg-card/40">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:px-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            Delivery
          </span>
          <h2 id="free-delivery-title" className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {policy.headline}
          </h2>
          <p className="text-2xl font-black text-emerald-400 sm:text-3xl">{policy.charges}</p>
          {policy.note && <p className="text-sm leading-relaxed text-muted-foreground">{policy.note}</p>}
          <Button asChild className="h-11 px-6 font-bold">
            <Link to="/post-requirement">Post a Requirement</Link>
          </Button>
        </div>

        <ul className="grid gap-3 self-center sm:grid-cols-2">
          {policy.points.map((point) => (
            <li
              key={point}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
