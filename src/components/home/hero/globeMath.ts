import { LAND_MASK_HEIGHT, LAND_MASK_RLE, LAND_MASK_WIDTH } from '@/data/landMask';

/**
 * Pure maths for the hero globe. Nothing here touches the DOM, so it can be tested directly.
 *
 * Conventions: unit vectors are [x, y, z] with y pointing north and z pointing at the viewer when
 * the globe is not turned. Longitude 0 sits at +z, longitude +90 (east) at +x.
 */

export type Vec3 = readonly [number, number, number];

export interface Hub {
  name: string;
  lat: number;
  lon: number;
}

/** Container ports that anchor the decorative trade lanes. These are map points, not business claims. */
export const HUBS: Record<string, Hub> = {
  mumbai: { name: 'Nhava Sheva', lat: 18.95, lon: 72.95 },
  chennai: { name: 'Chennai', lat: 13.08, lon: 80.29 },
  dubai: { name: 'Jebel Ali', lat: 25.01, lon: 55.06 },
  singapore: { name: 'Singapore', lat: 1.26, lon: 103.82 },
  shanghai: { name: 'Shanghai', lat: 31.23, lon: 121.47 },
  rotterdam: { name: 'Rotterdam', lat: 51.95, lon: 4.14 },
  losAngeles: { name: 'Los Angeles', lat: 33.74, lon: -118.27 },
  newYork: { name: 'New York', lat: 40.67, lon: -74.04 },
  durban: { name: 'Durban', lat: -29.87, lon: 31.03 },
  sydney: { name: 'Sydney', lat: -33.97, lon: 151.2 },
  santos: { name: 'Santos', lat: -23.96, lon: -46.3 },
};

/** Lanes in the order they are shown. The first few are used on small screens. */
export const LANES: ReadonlyArray<readonly [keyof typeof HUBS, keyof typeof HUBS]> = [
  ['mumbai', 'rotterdam'],
  ['chennai', 'singapore'],
  ['mumbai', 'dubai'],
  ['shanghai', 'losAngeles'],
  ['mumbai', 'newYork'],
  ['singapore', 'shanghai'],
  ['mumbai', 'durban'],
  ['chennai', 'sydney'],
  ['dubai', 'santos'],
];

export function latLonToVector(latDeg: number, lonDeg: number): Vec3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

/** Reads a base-128 varint stream. */
function* readVarints(bytes: Uint8Array): Generator<number> {
  let value = 0;
  let shift = 0;
  for (const byte of bytes) {
    value |= (byte & 0x7f) << shift;
    if (byte & 0x80) {
      shift += 7;
    } else {
      yield value;
      value = 0;
      shift = 0;
    }
  }
}

let cachedMask: Uint8Array | null = null;

/** Decodes the run-length land mask into one byte per cell (1 = land). Cached after the first call. */
export function decodeLandMask(): Uint8Array {
  if (cachedMask) return cachedMask;
  const binary = atob(LAND_MASK_RLE);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  const mask = new Uint8Array(LAND_MASK_WIDTH * LAND_MASK_HEIGHT);
  const numbers = readVarints(bytes);
  for (let row = 0; row < LAND_MASK_HEIGHT; row += 1) {
    const runCount = numbers.next().value as number;
    let col = 0;
    let isLand = 0;
    for (let run = 0; run < runCount; run += 1) {
      const length = numbers.next().value as number;
      if (isLand) mask.fill(1, row * LAND_MASK_WIDTH + col, row * LAND_MASK_WIDTH + col + length);
      col += length;
      isLand ^= 1;
    }
  }
  cachedMask = mask;
  return mask;
}

export function isLand(mask: Uint8Array, latDeg: number, lonDeg: number): boolean {
  const col = Math.min(LAND_MASK_WIDTH - 1, Math.max(0, Math.floor(((lonDeg + 180) / 360) * LAND_MASK_WIDTH)));
  const row = Math.min(LAND_MASK_HEIGHT - 1, Math.max(0, Math.floor(((90 - latDeg) / 180) * LAND_MASK_HEIGHT)));
  return mask[row * LAND_MASK_WIDTH + col] === 1;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Evenly spaced points on the sphere (Fibonacci lattice) that fall on land, as a flat [x, y, z, ...]
 * array. `lattice` is how many points are laid over the whole sphere before the land filter.
 */
export function sampleLandPoints(mask: Uint8Array, lattice: number): Float32Array {
  const kept: number[] = [];
  for (let i = 0; i < lattice; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / lattice;
    const ring = Math.sqrt(1 - y * y);
    const theta = i * GOLDEN_ANGLE;
    const x = ring * Math.sin(theta);
    const z = ring * Math.cos(theta);
    const latDeg = (Math.asin(y) * 180) / Math.PI;
    const lonDeg = (Math.atan2(x, z) * 180) / Math.PI;
    if (isLand(mask, latDeg, lonDeg)) kept.push(x, y, z);
  }
  return new Float32Array(kept);
}

/** Angle in radians between two hubs, seen from the centre of the globe. */
export function angularDistance(from: Hub, to: Hub): number {
  const a = latLonToVector(from.lat, from.lon);
  const b = latLonToVector(to.lat, to.lon);
  return Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
}

/**
 * Points along the great circle from `from` to `to`, raised above the surface by up to `lift` of the
 * radius in the middle so the lane arcs over the globe like a flight path. Returns [x, y, z, ...].
 */
export function laneArc(from: Hub, to: Hub, steps: number, lift: number): Float32Array {
  const a = latLonToVector(from.lat, from.lon);
  const b = latLonToVector(to.lat, to.lon);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const angle = Math.acos(dot);
  const sine = Math.sin(angle) || 1;
  const out = new Float32Array((steps + 1) * 3);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const wa = Math.sin((1 - t) * angle) / sine;
    const wb = Math.sin(t * angle) / sine;
    const radius = 1 + lift * Math.sin(Math.PI * t);
    out[i * 3] = (a[0] * wa + b[0] * wb) * radius;
    out[i * 3 + 1] = (a[1] * wa + b[1] * wb) * radius;
    out[i * 3 + 2] = (a[2] * wa + b[2] * wb) * radius;
  }
  return out;
}

/** True when a point (in view space) is hidden behind the globe's disc. */
export function isBehindGlobe(x: number, y: number, z: number): boolean {
  return z < 0 && x * x + y * y < 1;
}

/** Brightness 0..1 for a unit normal lit from `light`. */
export function lighting(nx: number, ny: number, nz: number, light: Vec3): number {
  return Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
}
