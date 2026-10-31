import React, { lazy, Suspense, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, Factory, Globe, LayoutGrid, Search, Truck } from 'lucide-react';
import { PlaneArt, PortArt, ShipArt, TruckArt } from './hero/TransportArt';
import {
  useAfterFirstPaint,
  useAfterPaint,
  useHeroActivity,
  useHeroParallax,
  useMediaQuery,
  usePrefersReducedMotion,
} from './hero/useHeroEnvironment';
import './hero/cinematic-hero.css';

// The Earth is drawn on a canvas and loaded after the first paint, so the headline is never held up.
const EarthGlobe = lazy(() => import('./hero/EarthGlobe'));

interface HeroSection3DProps {
  onSearch?: (query: string, category: string) => void;
}

const POPULAR_CATEGORIES = [
  { name: 'Textile', query: 'cotton fabric yarn' },
  { name: 'Steel', query: 'steel pipe rebar sheet' },
  { name: 'Chemical', query: 'polymers dyes industrial' },
  { name: 'Plastic', query: 'granules polymer hdpe' },
  { name: 'Machinery', query: 'generator motor equipment' },
  { name: 'Agriculture', query: 'spices grains coffee' },
  { name: 'Packaging', query: 'corrugated boxes cartons' },
  { name: 'Electrical', query: 'cables transformers switchgear' },
];

/** Floating embers. Fixed values keep every render identical; phones show only the first eight. */
const PARTICLES = (() => {
  let state = 42;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: 22 }, () => ({
    '--x': `${(4 + random() * 92).toFixed(1)}%`,
    '--s': `${(2 + random() * 3.2).toFixed(1)}px`,
    '--d': `${(22 + random() * 16).toFixed(1)}s`,
    '--t': `-${(random() * 30).toFixed(1)}s`,
    '--dx': `${Math.round((random() - 0.5) * 80)}px`,
    '--o': (0.45 + random() * 0.5).toFixed(2),
  })) as React.CSSProperties[];
})();

const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as React.CSSProperties;

/** Faint orbit lines around the Earth with two lights travelling along them (desktop only). */
function OrbitRings() {
  return (
    <svg className="cin-orbit" viewBox="-110 -110 220 220" aria-hidden="true" focusable="false">
      <g fill="none" stroke="rgba(255,138,36,0.3)" strokeWidth="0.35" strokeDasharray="1.2 2.4">
        <ellipse rx="104" ry="36" transform="rotate(-24)" />
        <ellipse rx="98" ry="30" transform="rotate(22)" />
      </g>
      <g transform="rotate(-24)">
        <circle r="1.7" fill="#FF8A24">
          <animateMotion dur="28s" repeatCount="indefinite" path="M104 0 A104 36 0 1 1 -104 0 A104 36 0 1 1 104 0" />
        </circle>
      </g>
      <g transform="rotate(22)">
        <circle r="1.5" fill="#00D6A3">
          <animateMotion dur="34s" repeatCount="indefinite" path="M-98 0 A98 30 0 1 1 98 0 A98 30 0 1 1 -98 0" />
        </circle>
      </g>
    </svg>
  );
}

export default function HeroSection3D({ onSearch }: HeroSection3DProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'products' | 'manufacturers' | 'rfqs'>('products');

  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const compact = useMediaQuery('(max-width: 767px)', true);
  // on the narrowest phones the field has room for one word, so the placeholder says less
  const tiny = useMediaQuery('(max-width: 359px)', false);
  // Order of arrival: headline and panel, then the atmosphere and scene, then the canvas Earth.
  const decorationReady = useAfterPaint();
  const showGlobe = useAfterFirstPaint(350);
  useHeroActivity(rootRef);
  useHeroParallax(rootRef, !reducedMotion && decorationReady);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      if (selectedType === 'manufacturers') navigate('/manufacturers');
      else if (selectedType === 'rfqs') navigate('/auctions/reverse');
      else navigate('/products');
      return;
    }

    if (onSearch) {
      onSearch(searchQuery, selectedType);
    }

    if (selectedType === 'manufacturers') {
      navigate(`/manufacturers?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (selectedType === 'rfqs') {
      navigate(`/auctions/reverse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickTagClick = (tagQuery: string) => {
    navigate(`/products?q=${encodeURIComponent(tagQuery)}`);
  };

  return (
    <section ref={rootRef} className="cin-hero" data-active="true" aria-labelledby="hero-heading">
      {/* Atmosphere for the whole hero: sky, stars, moving light, sweep, trails and embers */}
      <div className="cin-ambient" aria-hidden="true">
        <div className="cin-sky" />
        {decorationReady && (
          <div className="cin-fx">
            <div className="cin-stars" />
            <div className="cin-layer" data-depth="0.3">
              <div className="cin-zoom">
                <div className="cin-glow cin-glow-1" />
                <div className="cin-glow cin-glow-2" />
                <div className="cin-glow cin-glow-3" />
                <div className="cin-smoke cin-smoke-1" />
                <div className="cin-smoke cin-smoke-2" />
              </div>
            </div>
            <div className="cin-sweep" />
            <div className="cin-trail cin-trail-1" />
            <div className="cin-trail cin-trail-2" />
            <div className="cin-trail cin-trail-3" />
            <div className="cin-particles">
              {PARTICLES.map((style, index) => (
                <i key={index} className="cin-p" style={style} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="cin-top">
        {/* Earth, aircraft, port, ship and truck. Decorative only. */}
        <div className="cin-scene" aria-hidden="true">
          {decorationReady && (
            <div className="cin-fx">
              <div className="cin-earth" data-depth="0.7">
                <div className="cin-earth-halo" />
                {showGlobe && (
                  <Suspense fallback={null}>
                    <EarthGlobe quality={compact ? 'lite' : 'full'} reducedMotion={reducedMotion} className="cin-earth-canvas" />
                  </Suspense>
                )}
                {!compact && !reducedMotion && <OrbitRings />}
              </div>
              <div className="cin-scrim" />
              <div className="cin-plane-lane" data-depth="0.4">
                <div className="cin-plane">
                  <PlaneArt className="cin-plane-art" />
                </div>
              </div>
              <div className="cin-horizon" data-depth="-0.35">
                <div className="cin-horizon-glow" />
                <div className="cin-port">
                  <PortArt className="cin-port-art" />
                </div>
                <div className="cin-sea" />
                <div className="cin-ship-lane">
                  <div className="cin-ship">
                    <ShipArt className="cin-ship-art" />
                  </div>
                </div>
                <div className="cin-truck-lane">
                  <div className="cin-road" />
                  <div className="cin-truck">
                    <TruckArt className="cin-truck-art" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Copy and primary actions */}
        <div className="cin-copy" data-keep-clear>
          <span className="cin-eyebrow cin-in" style={delay(60)}>
            <Globe className="h-3.5 w-3.5" style={{ color: 'var(--cin-orange)' }} aria-hidden="true" />
            Global B2B marketplace
          </span>

          <h1 id="hero-heading" className="cin-h1 cin-slide">
            Global Wholesale.
            <br />
            <span className="cin-accent">Smarter Sourcing.</span>
          </h1>

          <p className="cin-sub cin-soft" style={delay(200)}>
            Connect manufacturers, wholesalers and bulk buyers across the world. Search suppliers and products, compare offers and source with confidence.
          </p>

          <div className="cin-feats cin-in" style={delay(360)}>
            <a href="#order-benefits" className="cin-feat cin-feat-teal">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Free delivery on all orders
            </a>
            <a href="#order-benefits" className="cin-feat cin-feat-orange">
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              Order loan calculator
            </a>
          </div>

          <div className="cin-ctas">
            <Link to="/categories" className="cin-btn cin-btn-primary cin-in" style={delay(480)}>
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              Browse Categories
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/register?role=supplier" className="cin-btn cin-btn-ghost cin-in" style={delay(600)}>
              <Factory className="h-4 w-4" aria-hidden="true" />
              Join as Manufacturer
            </Link>
          </div>
        </div>
      </div>

      {/* Search panel */}
      <div className="cin-panel-wrap cin-in" style={delay(720)} data-hero-search>
        <div className="cin-panel">
          <div>
            <h2 className="cin-panel-title">Find products and suppliers</h2>
            <p className="cin-panel-sub">Search verified catalogues, manufacturers and live RFQs.</p>
          </div>

          <div>
            <form onSubmit={handleSearchSubmit} role="search" className="cin-form" data-keep-clear>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'products' | 'manufacturers' | 'rfqs')}
                className="cin-select"
                aria-label="What to search"
              >
                <option value="products">Products</option>
                <option value="manufacturers">Manufacturers</option>
                <option value="rfqs">Live RFQs</option>
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tiny ? 'Search…' : 'Search products, suppliers, categories…'}
                aria-label="Search products, suppliers and categories"
                className="cin-input"
              />
              <button type="submit" className="cin-submit" aria-label="Submit search">
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <div className="cin-chips" role="group" aria-label="Popular categories">
              <span className="cin-chips-label">Popular:</span>
              {POPULAR_CATEGORIES.map((cat) => (
                <button key={cat.name} type="button" onClick={() => handleQuickTagClick(cat.query)} className="cin-chip">
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
