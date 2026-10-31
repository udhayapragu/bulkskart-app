import { Factory, Flame, Globe, Package } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMarketplaceOverview } from '@/hooks/useHomepageData';
import { formatNumber } from '@/lib/homepageData';

interface Tile {
  icon: ReactNode;
  value: number;
  label: string;
}

/** Marketplace figures, counted from the database. A figure that cannot be counted is left out, never guessed. */
export default function LandingStats() {
  const { data, loading } = useMarketplaceOverview();

  const tiles: Tile[] = [];
  if (data) {
    if (data.verifiedSuppliers !== null) tiles.push({ icon: <Factory className="h-6 w-6" aria-hidden="true" />, value: data.verifiedSuppliers, label: 'Verified suppliers' });
    if (data.activeProducts !== null) tiles.push({ icon: <Package className="h-6 w-6" aria-hidden="true" />, value: data.activeProducts, label: 'Products listed' });
    if (data.supplierCountries !== null) tiles.push({ icon: <Globe className="h-6 w-6" aria-hidden="true" />, value: data.supplierCountries.length, label: 'Supplier countries' });
    if (data.activeRequirements !== null && data.liveAuctions !== null) {
      tiles.push({ icon: <Flame className="h-6 w-6" aria-hidden="true" />, value: data.activeRequirements + data.liveAuctions, label: 'Live RFQs & auctions' });
    }
  }
  if (!loading && tiles.length === 0) return null;

  return (
    <section className="lv-section !py-10 lg:!py-12" aria-labelledby="marketplace-stats-title">
      <div className="lv-container">
        <h2 id="marketplace-stats-title" className="sr-only">
          Marketplace statistics
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" data-stats="marketplace" aria-busy={loading}>
          {loading
            ? [0, 1, 2, 3].map((key) => <div key={key} className="lv-skeleton h-[84px] rounded-[18px]" aria-hidden="true" />)
            : tiles.map((tile) => (
                <div key={tile.label} className="lv-stat !px-3 sm:!px-[18px]">
                  <div className="lv-stat-icon !h-11 !w-11 sm:!h-[52px] sm:!w-[52px]">{tile.icon}</div>
                  <div className="min-w-0">
                    <div className="lv-stat-value">{formatNumber(tile.value)}</div>
                    <div className="lv-stat-label !text-[0.82rem] !leading-tight sm:!text-[0.95rem]">{tile.label}</div>
                  </div>
                </div>
              ))}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--lv-faint)]">Counted live from the Bulkskart marketplace.</p>
      </div>
    </section>
  );
}
