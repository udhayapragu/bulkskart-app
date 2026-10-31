import React from 'react';
import { BadgeCheck, FileText, Globe, Lock, Tag, Truck } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';

const BENEFITS = [
  {
    title: 'Verified manufacturers',
    description: 'Each supplier profile shows its verification status, location and product categories.',
    icon: BadgeCheck,
  },
  {
    title: 'Competitive wholesale pricing',
    description: 'Compare bulk prices and quotations from more than one supplier before you order.',
    icon: Tag,
  },
  {
    title: 'Free delivery, subject to policy',
    description: 'Delivery is free on every order under Bulkskart\'s published delivery policy.',
    icon: Truck,
  },
  {
    title: 'Secure online payments',
    description: 'Pay online through a payment gateway when you place an order.',
    icon: Lock,
  },
  {
    title: 'Easy RFQ posting',
    description: 'Describe what you need once. Interested manufacturers respond with quotations.',
    icon: FileText,
  },
  {
    title: 'Global supplier discovery',
    description: 'Find suppliers by product, category and country.',
    icon: Globe,
  },
];

export default function BuyerBenefits() {
  return (
    <section aria-label="Buyer benefits" className="border-y border-border bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="For buyers"
          icon={<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />}
          title="Why buyers choose Bulkskart"
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ title, description, icon: Icon }) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
