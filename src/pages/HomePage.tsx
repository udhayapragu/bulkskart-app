import { useEffect } from 'react';
import PageMeta from '@/components/common/PageMeta';
import LandingSections from '@/components/landing/LandingSections';
import StickySearch from '@/components/landing/StickySearch';
import HeroSection3D from '@/components/home/HeroSection3D';
import MainLayout from '@/components/layouts/MainLayout';
import { landingImages } from '@/lib/imageRegistry';

/**
 * Landing page. Every figure, supplier, product, RFQ and auction on it is read from the database.
 * Sections with nothing real to show say so. Each photograph appears at most once on the page.
 */
export default function HomePage() {
  useEffect(() => {
    landingImages.clear();
    return () => landingImages.clear();
  }, []);

  return (
    <MainLayout>
      <PageMeta
        title="BulkSkart | B2B Wholesale Marketplace & Bulk Suppliers in India"
        description="Find verified manufacturers and wholesale suppliers in India. Every BulkSkart order includes free delivery. Compare bulk prices, estimate an order installment, post free RFQs, and source factory-direct products."
        keywords="B2B marketplace India, wholesale suppliers India, bulk suppliers, manufacturers in India, post RFQ, factory direct wholesale, MOQ, bulk buying"
        canonical="https://www.bulkskart.com/"
        ogImage="https://www.bulkskart.com/brand/bulkskart-logo.jpg"
        ogType="website"
        breadcrumbs={[
          { name: 'Home', item: '/' },
        ]}
        faq={[
          {
            question: "What is BulkSkart?",
            answer: "BulkSkart is India's leading global B2B wholesale marketplace connecting verified bulk buyers directly with verified global manufacturers and industrial exporters across India, USA, UAE, Germany, and 180+ countries.",
          },
          {
            question: "Is posting a bulk requirement (RFQ) free for buyers?",
            answer: "Yes, verified buyers can post unlimited bulk buying requirements (RFQs) 100% free with zero platform commissions or hidden fees.",
          },
          {
            question: "How does BulkSkart verify suppliers and factories?",
            answer: "Every manufacturer undergoes rigorous verification including business license audits, tax identification (GST/IEC), production facility certifications (ISO, CE, FDA), and historical trade performance reviews.",
          },
          {
            question: "What is Trade Assurance on BulkSkart?",
            answer: "Trade Assurance protects buyer purchase orders with guaranteed on-time dispatch, product quality standards, milestone escrow payments, and secure dispute resolution.",
          },
          {
            question: "Can suppliers receive live buyer requirements?",
            answer: "Yes, verified manufacturers receive instant alerts for live buying tenders matching their product categories and can submit direct factory quotations to buyers.",
          },
          {
            question: "Is delivery free on BulkSkart?",
            answer: "Yes. Free delivery applies to every order placed on BulkSkart. No delivery fee is added at checkout, for any order value or product category.",
          },
          {
            question: "Can I estimate a monthly installment for a bulk order?",
            answer: "Yes. The order loan calculator on the homepage estimates a monthly installment from the order value, down payment, interest rate, and tenure. Delivery on that order stays free. The figure is for planning and is not a credit approval.",
          },
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': 'https://www.bulkskart.com/#webpage',
          url: 'https://www.bulkskart.com/',
          name: 'BulkSkart | B2B Wholesale Marketplace & Bulk Suppliers in India',
          description: 'Find verified manufacturers and wholesale suppliers in India. Every BulkSkart order includes free delivery. Compare bulk prices, estimate an order installment, post free RFQs, and source factory-direct products.',
          isPartOf: { '@id': 'https://www.bulkskart.com/#website' },
          about: { '@id': 'https://www.bulkskart.com/#organization' },
          inLanguage: 'en-IN',
        }}
      />

      <HeroSection3D />
      <StickySearch />

      <LandingSections />
    </MainLayout>
  );
}
