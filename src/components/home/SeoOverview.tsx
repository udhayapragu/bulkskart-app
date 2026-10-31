import { Building2, FileText, Package, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionHeader from '@/components/home/SectionHeader';

/** Crawlable overview text with internal links to the sourcing hubs. Kept word for word from the previous page. */
export default function SeoOverview() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════
          CRAWLABLE B2B MARKETPLACE OVERVIEW (SEO & BUYER GUIDE)
      ═══════════════════════════════════════════════════ */}
      <section className="py-12 bg-card/60 border-t border-border">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <SectionHeader
                align="center"
                eyebrow="India sourcing ecosystem"
                title="India’s Premier B2B Bulk Buying & Wholesale Platform"
                subtitle="Bridging verified Indian manufacturing clusters with global procurement professionals through transparent quotation comparison and Trade Assurance."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <div className="space-y-3 bg-background/60 p-5 rounded-2xl border border-border">
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FF5A00]" />
                  <span>What Bulkskart Is & Who It Is For</span>
                </h3>
                <p>
                  Bulkskart is India’s dedicated digital B2B wholesale marketplace connecting commercial buyers directly with verified production facilities. Built specifically for corporate procurement teams, retail distributors, export trading houses, and institutional buyers, Bulkskart eliminates opaque broker tiers and delivers verified factory-direct pricing.
                </p>
                <p>
                  Whether you are an established enterprise sourcing high-volume industrial machinery or a growing retail brand restocking seasonal inventory, Bulkskart streamlines supplier discovery across all major manufacturing corridors.
                </p>
              </div>

              <div className="space-y-3 bg-background/60 p-5 rounded-2xl border border-border">
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF5A00]" />
                  <span>Manufacturers vs Wholesalers</span>
                </h3>
                <p>
                  Our verified network distinguishes between primary <Link to="/manufacturers" className="text-[#FF5A00] font-semibold hover:underline">Manufacturers</Link> offering custom OEM/ODM production runs and master <Link to="/wholesale-suppliers" className="text-[#FF5A00] font-semibold hover:underline">Wholesalers</Link> maintaining ready-to-ship pallet inventory.
                </p>
                <p>
                  Buyers can filter by business type, production capacity, ISO compliance, and location clusters like <Link to="/manufacturers-in-tamil-nadu" className="text-[#FF5A00] font-semibold hover:underline">Tamil Nadu</Link>, <Link to="/manufacturers-in-coimbatore" className="text-[#FF5A00] font-semibold hover:underline">Coimbatore</Link>, <Link to="/manufacturers-in-chennai" className="text-[#FF5A00] font-semibold hover:underline">Chennai</Link>, and Gujarat.
                </p>
              </div>

              <div className="space-y-3 bg-background/60 p-5 rounded-2xl border border-border">
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF5A00]" />
                  <span>RFQ Workflow & Quotation Comparison</span>
                </h3>
                <p>
                  Posting a <Link to="/post-requirement" className="text-[#FF5A00] font-semibold hover:underline">Request for Quotation (RFQ)</Link> takes less than 60 seconds. Specify required quantities, target prices, delivery incoterms (FOB, CIF, EXW), and technical drawings.
                </p>
                <p>
                  Qualified suppliers submit itemized quotes with clear breakdowns for unit costs, sample availability, mold tooling fees, and estimated production lead times, allowing buyers to compare bids side-by-side.
                </p>
              </div>

              <div className="space-y-3 bg-background/60 p-5 rounded-2xl border border-border">
                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF5A00]" />
                  <span>MOQ Flexibility & Tiered Bulk Pricing</span>
                </h3>
                <p>
                  Each listing in our <Link to="/bulk-products" className="text-[#FF5A00] font-semibold hover:underline">bulk products catalog</Link> clearly displays the Minimum Order Quantity (MOQ) alongside quantity-discount tiers.
                </p>
                <p>
                  Buyers can order pre-production commercial samples before approving full container volumes, with milestone payments safely protected through Trade Assurance until goods pass quality inspection.
                </p>
              </div>
            </div>

            {/* Quick Sourcing Hub Links */}
            <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="font-bold text-foreground mr-1">Popular Sourcing Hubs:</span>
              <Link to="/b2b-marketplace" className="text-muted-foreground hover:text-[#FF5A00] underline">B2B Marketplace</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/manufacturers-in-india" className="text-muted-foreground hover:text-[#FF5A00] underline">Manufacturers in India</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/wholesale-suppliers-in-india" className="text-muted-foreground hover:text-[#FF5A00] underline">Wholesale Suppliers India</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/manufacturers-in-tamil-nadu" className="text-muted-foreground hover:text-[#FF5A00] underline">Tamil Nadu Factories</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/manufacturers-in-coimbatore" className="text-muted-foreground hover:text-[#FF5A00] underline">Coimbatore Pumps & Textiles</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/manufacturers-in-chennai" className="text-muted-foreground hover:text-[#FF5A00] underline">Chennai Industrial Hub</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/blog/what-is-moq" className="text-muted-foreground hover:text-[#FF5A00] underline">What is MOQ?</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/blog/how-to-find-manufacturers-in-india" className="text-muted-foreground hover:text-[#FF5A00] underline">Finding Indian Factories Guide</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
