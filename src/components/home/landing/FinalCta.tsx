import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="rounded-3xl border border-primary/40 bg-card px-6 py-10 text-center sm:px-10 sm:py-14">
        <h2 id="final-cta-title" className="mx-auto max-w-2xl text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Ready to Grow Your Business with Bulkskart?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Create an account to post requirements as a buyer, or to list your products and respond to buying
          requirements as a manufacturer.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-xl px-7 font-bold">
            <Link to="/register">Join as Buyer</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-7 font-bold text-primary">
            <Link to="/auth?tab=supplier">Join as Manufacturer</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
