/**
 * Bundled sample suppliers and products are demo data. They are merged into listings only when
 * VITE_SAMPLE_CATALOG=true is set at build time, so visitors see database records by default.
 */
export const SAMPLE_CATALOG_ENABLED = String(import.meta.env.VITE_SAMPLE_CATALOG ?? 'false').toLowerCase() === 'true';
