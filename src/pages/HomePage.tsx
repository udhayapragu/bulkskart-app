import React from 'react';
import PageMeta from '@/components/common/PageMeta';
import MainLayout from '@/components/layouts/MainLayout';
import BuyerBenefits from '@/components/home/landing/BuyerBenefits';
import DeliveryPromise from '@/components/home/landing/DeliveryPromise';
import FeaturedProducts from '@/components/home/landing/FeaturedProducts';
import FinalCta from '@/components/home/landing/FinalCta';
import IndustryCategories from '@/components/home/landing/IndustryCategories';
import LandingHero from '@/components/home/landing/LandingHero';
import LiveAuctions from '@/components/home/landing/LiveAuctions';
import LiveRequirements from '@/components/home/landing/LiveRequirements';
import ManufacturerWallet from '@/components/home/landing/ManufacturerWallet';
import MarketStats from '@/components/home/landing/MarketStats';
import TradeRoutes from '@/components/home/landing/TradeRoutes';
import VerifiedManufacturers from '@/components/home/landing/VerifiedManufacturers';
import { useMarketplaceOverview, useTopCategories } from '@/hooks/useHomepageData';

export default function HomePage() {
  const overview = useMarketplaceOverview();
  const categories = useTopCategories();
  const countries = overview.data?.countries ?? null;
  // The hero says "India and N other countries", so India is not counted twice.
  const otherCountryCount = countries
    ? countries.filter((item) => item.country.toLowerCase() !== 'india').length
    : null;

  return (
    <MainLayout>
      <PageMeta
        title="BulkSkart | B2B Wholesale Marketplace & Bulk Suppliers in India"
        description="Source from verified manufacturers and wholesale suppliers in India and abroad. Compare quotations, post a buying requirement and follow live auctions on BulkSkart."
        keywords="B2B marketplace India, wholesale suppliers India, bulk suppliers, manufacturers in India, post RFQ, factory direct wholesale, MOQ, bulk buying"
        canonical="https://www.bulkskart.com/"
        ogImage="https://www.bulkskart.com/brand/bulkskart-logo.jpg"
        ogType="website"
        breadcrumbs={[{ name: 'Home', item: '/' }]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': 'https://www.bulkskart.com/#webpage',
          url: 'https://www.bulkskart.com/',
          name: 'BulkSkart | B2B Wholesale Marketplace & Bulk Suppliers in India',
          inLanguage: 'en-IN',
          isPartOf: { '@id': 'https://www.bulkskart.com/#website' },
          about: { '@id': 'https://www.bulkskart.com/#organization' },
        }}
      />

      <LandingHero categories={categories.data} countryCount={otherCountryCount} />
      <DeliveryPromise />
      <MarketStats overview={overview} />
      <IndustryCategories categories={categories} />
      <FeaturedProducts />
      <VerifiedManufacturers />
      <LiveRequirements />
      <LiveAuctions />
      <TradeRoutes countries={countries} loading={overview.loading} />
      <ManufacturerWallet />
      <BuyerBenefits />
      <FinalCta />
    </MainLayout>
  );
}
