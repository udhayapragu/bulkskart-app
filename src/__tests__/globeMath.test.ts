import { describe, expect, it } from 'vitest';
import {
  angularDistance,
  decodeLandMask,
  HUBS,
  isBehindGlobe,
  isLand,
  laneArc,
  LANES,
  latLonToVector,
  lighting,
  sampleLandPoints,
} from '@/components/home/hero/globeMath';
import { LAND_MASK_HEIGHT, LAND_MASK_WIDTH } from '@/data/landMask';

describe('land mask', () => {
  const mask = decodeLandMask();

  it('decodes to one byte per half-degree cell', () => {
    expect(mask).toHaveLength(LAND_MASK_WIDTH * LAND_MASK_HEIGHT);
  });

  it('covers about 29 percent of the planet with land, as Earth does', () => {
    const land = mask.reduce((sum, cell) => sum + cell, 0);
    const share = land / mask.length;
    expect(share).toBeGreaterThan(0.26);
    expect(share).toBeLessThan(0.32);
  });

  it.each([
    ['New Delhi', 28.6, 77.2],
    ['Sahara', 23, 10],
    ['Australian outback', -25, 134],
    ['Siberia', 62, 100],
    ['Amazon basin', -4, -62],
    ['Antarctica', -80, 0],
  ])('puts %s on land', (_name, lat, lon) => {
    expect(isLand(mask, lat, lon)).toBe(true);
  });

  it.each([
    ['central Pacific', 0, -150],
    ['Indian Ocean', -10, 80],
    ['North Atlantic', 35, -40],
    ['Southern Ocean', -55, 100],
  ])('puts the %s in the sea', (_name, lat, lon) => {
    expect(isLand(mask, lat, lon)).toBe(false);
  });

  it('is stable across calls', () => {
    expect(decodeLandMask()).toBe(mask);
  });
});

describe('sampleLandPoints', () => {
  const mask = decodeLandMask();
  const points = sampleLandPoints(mask, 12000);

  it('returns unit vectors in x, y, z triples', () => {
    expect(points.length % 3).toBe(0);
    for (let i = 0; i < points.length; i += 3 * 97) {
      expect(Math.hypot(points[i], points[i + 1], points[i + 2])).toBeCloseTo(1, 4);
    }
  });

  it('keeps roughly the land share of the lattice', () => {
    const share = points.length / 3 / 12000;
    expect(share).toBeGreaterThan(0.24);
    expect(share).toBeLessThan(0.34);
  });

  it('lays out more points when asked for a denser lattice', () => {
    expect(sampleLandPoints(mask, 24000).length).toBeGreaterThan(points.length * 1.8);
  });
});

describe('trade lanes', () => {
  it('only refers to hubs that exist', () => {
    for (const [from, to] of LANES) {
      expect(HUBS[from]).toBeDefined();
      expect(HUBS[to]).toBeDefined();
      expect(from).not.toBe(to);
    }
  });

  it('starts and ends exactly on the two hubs', () => {
    const arc = laneArc(HUBS.mumbai, HUBS.rotterdam, 40, 0.15);
    const start = latLonToVector(HUBS.mumbai.lat, HUBS.mumbai.lon);
    const end = latLonToVector(HUBS.rotterdam.lat, HUBS.rotterdam.lon);
    expect(Array.from(arc.slice(0, 3))).toEqual(start.map((v) => expect.closeTo(v, 5)));
    expect(Array.from(arc.slice(-3))).toEqual(end.map((v) => expect.closeTo(v, 5)));
  });

  it('rises above the surface in the middle and never dips below it', () => {
    const arc = laneArc(HUBS.chennai, HUBS.sydney, 60, 0.2);
    const radii = Array.from({ length: arc.length / 3 }, (_, i) => Math.hypot(arc[i * 3], arc[i * 3 + 1], arc[i * 3 + 2]));
    expect(Math.max(...radii)).toBeGreaterThan(1.18);
    expect(Math.min(...radii)).toBeGreaterThan(0.999);
    expect(radii[30]).toBeCloseTo(Math.max(...radii), 2);
  });

  it('measures distance between hubs sensibly', () => {
    // Mumbai to Rotterdam is a little over 6,000 km: about 1 radian of arc on a 6,371 km sphere.
    expect(angularDistance(HUBS.mumbai, HUBS.rotterdam)).toBeGreaterThan(0.9);
    expect(angularDistance(HUBS.mumbai, HUBS.rotterdam)).toBeLessThan(1.2);
    expect(angularDistance(HUBS.mumbai, HUBS.mumbai)).toBeCloseTo(0, 6);
  });
});

describe('view helpers', () => {
  it('hides points behind the disc but not points beyond its edge', () => {
    expect(isBehindGlobe(0.2, 0.1, -0.5)).toBe(true);
    expect(isBehindGlobe(1.1, 0.4, -0.5)).toBe(false);
    expect(isBehindGlobe(0.2, 0.1, 0.5)).toBe(false);
  });

  it('lights surfaces that face the light and leaves the others dark', () => {
    expect(lighting(1, 0, 0, [1, 0, 0])).toBe(1);
    expect(lighting(-1, 0, 0, [1, 0, 0])).toBe(0);
    expect(lighting(0, 1, 0, [1, 0, 0])).toBe(0);
  });
});
