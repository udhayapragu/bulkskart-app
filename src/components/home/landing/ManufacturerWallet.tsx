import React from 'react';
import { Link } from 'react-router-dom';
import { Banknote, History, Lock, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The intended payment flow. This is a description, not a live wallet: it shows no balance and promises no settlement timing. */
const PAYMENT_FLOW = [
  'Buyer places an order.',
  'Buyer completes online payment.',
  'Payment is confirmed by the payment gateway.',
  "Applicable supplier proceeds are reflected in the manufacturer's Bulkskart wallet.",
  'Manufacturer can view wallet balance and transaction history.',
  'Eligible funds can be withdrawn to the registered bank account according to settlement rules.',
];

const WALLET_BENEFITS = [
  { label: 'Secure Online Payments', icon: Lock },
  { label: 'Supplier Wallet', icon: Wallet },
  { label: 'Payment Tracking', icon: Receipt },
  { label: 'Transaction History', icon: History },
  { label: 'Withdrawal Requests', icon: Banknote },
];

export default function ManufacturerWallet() {
  return (
    <section aria-labelledby="manufacturer-wallet-title" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            For manufacturers
          </span>
          <h2 id="manufacturer-wallet-title" className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Get Paid. Manage Your Earnings. Grow Your Business.
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">How payments are intended to flow on Bulkskart:</p>
          <ol className="space-y-3">
            {PAYMENT_FLOW.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This page describes the intended payment flow only. Settlement timing and withdrawal eligibility follow
            Bulkskart's settlement rules. Bulkskart does not promise instant settlement.
          </p>
        </div>

        <div className="space-y-6 self-start rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="text-lg font-bold text-foreground">What manufacturers get</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {WALLET_BENEFITS.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-xl border border-border bg-background/60 px-3 py-3 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 px-6 font-bold">
              <Link to="/auth?tab=supplier">For Manufacturers</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-6 font-semibold text-primary">
              <Link to="/pricing">View subscription plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
