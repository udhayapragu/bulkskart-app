import CategoryTiles from '@/components/landing/CategoryTiles';
import LandingProducts from '@/components/landing/LandingProducts';
import LandingStats from '@/components/landing/LandingStats';
import LiveMarket from '@/components/landing/LiveMarket';
import ManufacturerPromo from '@/components/landing/ManufacturerPromo';
import NewBuyLeads from '@/components/landing/NewBuyLeads';
import VerifiedSuppliers from '@/components/landing/VerifiedSuppliers';
import OrderBenefitsSection from '@/components/home/OrderBenefitsSection';
import PostRequirementsHomeSection from '@/components/home/PostRequirementsHomeSection';
import SeoOverview from '@/components/home/SeoOverview';
import '@/components/landing/landing-theme.css';

/** Everything below the hero. All of it shares one visual system, scoped under .lv-root. */
export default function LandingSections() {
  return (
    <div className="lv-root" data-landing="v2">
      <LandingStats />
      <VerifiedSuppliers />
      <LandingProducts />
      <LiveMarket />
      <NewBuyLeads />
      <CategoryTiles />
      {/* Free delivery and the order loan calculator. The hero badges link to #order-benefits. */}
      <OrderBenefitsSection />
      <PostRequirementsHomeSection />
      <ManufacturerPromo />
      <SeoOverview />
    </div>
  );
}
