import type { ReactNode } from 'react';
import { LANDING_PHOTOS, type LandingSlot, validateLandingPhotos } from '@/config/landingImages';
import { landingImages } from '@/lib/imageRegistry';

/**
 * Backdrop for a section. If a licensed photograph is registered for the slot (and it passes the
 * checks and nobody else shows it), it is used. Otherwise the section's own original artwork is.
 */
export function SectionBackdrop({ slot, children }: { slot: LandingSlot; children: ReactNode }) {
  const photo = LANDING_PHOTOS[slot];
  const usable = photo && validateLandingPhotos({ [slot]: photo }).length === 0 && landingImages.claim(`backdrop:${slot}`, photo.src);
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {usable ? (
        <>
          <img src={photo.src} alt="" width={photo.width} height={photo.height} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050914] via-[#050914]/70 to-[#050914]" />
        </>
      ) : (
        children
      )}
    </div>
  );
}

/** Isometric crates in outline: warehouse and wholesale. */
export function ProductsArt() {
  const cube = (x: number, y: number, s: number, o: number) => {
    const h = s * 0.5;
    return (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} opacity={o} fill="none" stroke="#ff6500" strokeWidth="1.4" strokeLinejoin="round">
        <path d={`M0 ${-s} L${s * 0.87} ${-h} L${s * 0.87} ${h} L0 ${s} L${-s * 0.87} ${h} L${-s * 0.87} ${-h} Z`} />
        <path d={`M0 0 L0 ${s} M0 0 L${s * 0.87} ${-h} M0 0 L${-s * 0.87} ${-h}`} />
      </g>
    );
  };
  return (
    <svg className="absolute right-0 top-0 h-full w-[70%] min-w-[520px]" viewBox="0 0 700 600" preserveAspectRatio="xMaxYMid slice">
      <defs>
        <pattern id="iso-grid" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(0.9)">
          <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L28 97 M0 48 L0 81 M56 48 L56 81" fill="none" stroke="#8aa0d0" strokeOpacity="0.09" />
        </pattern>
        <linearGradient id="iso-fade" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="iso-mask">
          <rect width="700" height="600" fill="url(#iso-fade)" />
        </mask>
      </defs>
      <rect width="700" height="600" fill="url(#iso-grid)" mask="url(#iso-mask)" />
      {[cube(560, 150, 70, 0.34), cube(470, 260, 46, 0.22), cube(610, 330, 58, 0.28), cube(520, 450, 40, 0.18)]}
    </svg>
  );
}

/** Radar rings with a slow sweep: live demand. */
export function MarketArt() {
  return (
    <div className="absolute -right-24 top-1/2 h-[560px] w-[560px] -translate-y-1/2 opacity-80 sm:-right-10">
      {[1, 0.74, 0.5, 0.28].map((scale) => (
        <div key={scale} className="absolute inset-0 m-auto rounded-full border border-[#ff6500]/15" style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }} />
      ))}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, rgba(255,101,0,0) 0deg, rgba(255,101,0,0) 300deg, rgba(255,101,0,0.22) 350deg, rgba(255,101,0,0) 360deg)',
          animation: 'lv-sweep 14s linear infinite',
        }}
      />
      {[[22, 30], [68, 24], [74, 66], [38, 74], [55, 48]].map(([x, y]) => (
        <span key={`${x}-${y}`} className="absolute h-2 w-2 rounded-full bg-[#ff7d22]" style={{ left: `${x}%`, top: `${y}%`, boxShadow: '0 0 14px 3px rgba(255,101,0,0.55)' }} />
      ))}
    </div>
  );
}

/** Honeycomb cells: categories. */
export function CategoriesArt() {
  const hex =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'><path d='M30 2 L58 18 L58 50 L30 66 L2 50 L2 18 Z M30 66 L30 100 M2 50 L2 84 L30 100 L58 84 L58 50' fill='none' stroke='%238aa0d0' stroke-opacity='0.12'/></svg>";
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url("${hex}")`,
        backgroundSize: '60px 104px',
        WebkitMaskImage: 'radial-gradient(70% 80% at 85% 10%, #000, transparent 75%)',
        maskImage: 'radial-gradient(70% 80% at 85% 10%, #000, transparent 75%)',
      }}
    />
  );
}

/** A factory skyline at dusk: sawtooth roofs and chimneys. */
export function PromoArt() {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(70%_80%_at_50%_100%,rgba(255,101,0,0.32),rgba(124,58,237,0.12)_55%,transparent_80%)]" />
      <svg className="absolute inset-x-0 bottom-0 h-[46%] w-full" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice">
        <path
          fill="#070c1a"
          d="M0 220 V150 L60 120 V150 L120 120 V150 L180 120 V150 H230 V70 H252 V150 H330 V110 L380 80 V110 L430 80 V110 L480 80 V110 H540 V60 H562 V150 H650 V120 L710 90 V120 L770 90 V120 L830 90 V150 H900 V40 H928 V150 H1000 V115 L1050 85 V115 L1100 85 V115 L1150 85 V150 H1200 V220 Z"
        />
        <g fill="#ff8a24" opacity="0.85">
          <rect x="243" y="84" width="3" height="3" />
          <rect x="553" y="74" width="3" height="3" />
          <rect x="919" y="54" width="3" height="3" />
        </g>
      </svg>
    </>
  );
}
