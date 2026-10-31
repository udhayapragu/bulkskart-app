import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, Twitter, Youtube } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import LocaleControls from '@/components/layouts/LocaleControls';

interface FooterLink {
  label: string;
  href: string;
}

const FOOTER_COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: 'Bulkskart',
    links: [
      { label: 'About Bulkskart', href: '/about' },
      { label: 'Products', href: '/products' },
      { label: 'Manufacturers', href: '/manufacturers' },
      { label: 'RFQ', href: '/requirements' },
      { label: 'Auctions', href: '/auctions' },
    ],
  },
  {
    title: 'Trade tools',
    links: [
      { label: 'Import & Export Tools', href: '/trade-assistant' },
      { label: 'Shipping Calculator', href: '/shipping-calculator' },
      { label: 'Order Loan Calculator', href: '/loan-calculator' },
      { label: 'Categories', href: '/categories' },
    ],
  },
  {
    title: 'Join',
    links: [
      { label: 'Join as Buyer', href: '/register' },
      { label: 'Join as Manufacturer', href: '/auth?tab=supplier' },
      { label: 'Post a Requirement', href: '/post-requirement' },
      { label: 'Subscription Plans', href: '/pricing' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Help Centre', href: '/how-it-works' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Sitemap', href: '/sitemap' },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Linkedin, href: 'https://linkedin.com/company/bulkskart', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com/bulkskart', label: 'Twitter' },
  { icon: Facebook, href: 'https://facebook.com/bulkskart', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/bulkskart', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/@bulkskart', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="w-full max-w-[100vw] overflow-x-hidden border-t border-border bg-muted/40">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6 md:gap-6">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <BrandLogo size="md" variant="auto" linkTo="/" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Global B2B bulk trade platform by <span className="font-semibold text-foreground">BulkSkart</span>.
              Connecting verified manufacturers with bulk buyers.
            </p>
            <a
              href="mailto:info@bulkskart.com"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              info@bulkskart.com
            </a>
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 Tech Pod AI Database Private Limited · BulkSkart. All rights reserved.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs text-muted-foreground">Country and language</span>
            <LocaleControls variant="full" />
          </div>
        </div>
      </div>
    </footer>
  );
}
