import { ChevronRight, ClipboardList, Factory, PackagePlus, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PromoArt, SectionBackdrop } from '@/components/landing/SectionArt';

const STEPS = [
  { icon: Factory, title: 'Create your supplier profile', body: 'Add your company details, location and business type.' },
  { icon: ShieldCheck, title: 'Complete verification', body: 'Verified suppliers carry the Verified badge on their profile and listings.' },
  { icon: PackagePlus, title: 'List your products', body: 'Publish products with your own photographs, prices and minimum order quantities.' },
  { icon: ClipboardList, title: 'Respond to buyer RFQs', body: 'Open buyer requirements and send your quotation.' },
];

/** An invitation to suppliers. It states what the platform does and makes no claim about results. */
export default function ManufacturerPromo() {
  return (
    <section id="for-manufacturers" className="lv-section !pb-0" aria-labelledby="for-manufacturers-title">
      <SectionBackdrop slot="promo">
        <PromoArt />
      </SectionBackdrop>
      <div className="lv-container pb-40 sm:pb-48">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lv-eyebrow">
            <Factory className="h-5 w-5" aria-hidden="true" />
            For manufacturers
          </span>
          <h2 id="for-manufacturers-title" className="lv-title" style={{ fontSize: 'clamp(2rem, 5.4vw, 3.2rem)', textWrap: 'balance' }}>
            Put your factory in front of <span className="lv-grad">bulk buyers</span>
          </h2>
          <p className="lv-lead mx-auto">Join Bulkskart as a manufacturer or wholesaler, get verified and start receiving requirements from buyers.</p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="lv-card flex gap-4 p-5">
              <span className="lv-stat-icon !h-12 !w-12 shrink-0">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--lv-orange-2)]">Step {index + 1}</p>
                <h3 className="mt-0.5 text-base font-bold leading-snug text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--lv-muted)]">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/register?role=supplier" className="lv-btn lv-btn--primary px-8">
            Join as Manufacturer
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link to="/pricing" className="lv-btn lv-btn--outline px-8">
            View Supplier Plans
          </Link>
        </div>
      </div>
    </section>
  );
}
