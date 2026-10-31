import { useEffect, useRef } from 'react';
import {
  angularDistance,
  decodeLandMask,
  HUBS,
  isBehindGlobe,
  laneArc,
  LANES,
  latLonToVector,
  lighting,
  sampleLandPoints,
  type Vec3,
} from './globeMath';

interface EarthGlobeProps {
  /** 'full' for desktop and tablets. 'lite' for phones: fewer dots and lanes, lower frame rate. */
  quality: 'full' | 'lite';
  /** Draws one still frame and never starts the animation loop. */
  reducedMotion: boolean;
  className?: string;
}

const TILT = 0.46; // radians. We look slightly down on the northern hemisphere.
const START_YAW = -1.36; // India faces the viewer when the page loads.
const SPIN = 0.055; // radians per second, about 3 degrees: one turn takes roughly two minutes.
const LEVELS = 16;
const TRAIL = 0.22; // share of a lane that a comet's tail covers

const LIGHT: Vec3 = (() => {
  const v: Vec3 = [0.8, -0.2, 0.58];
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
})();

const PALETTE: string[] = Array.from({ length: LEVELS }, (_, index) => {
  const t = index / (LEVELS - 1);
  const alpha = 0.1 + 0.84 * t ** 1.15;
  const warm = Math.min(1, Math.max(0, (t - 0.3) / 0.7)) ** 1.4;
  const r = Math.round(190 + (255 - 190) * warm);
  const g = Math.round(222 + (138 - 222) * warm);
  const b = Math.round(255 + (36 - 255) * warm);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
});

interface Lane {
  arc: Float32Array;
  duration: number;
  offset: number;
  toTeal: boolean;
}

interface Scene {
  size: number;
  dpr: number;
  radius: number;
  base: HTMLCanvasElement;
  rim: HTMLCanvasElement;
}

function makeLayer(size: number, dpr: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const layer = document.createElement('canvas');
  layer.width = Math.round(size * dpr);
  layer.height = Math.round(size * dpr);
  const context = layer.getContext('2d');
  if (!context) throw new Error('2d context unavailable');
  context.scale(dpr, dpr);
  return [layer, context];
}

/** Everything that does not move: the dark sphere with its warm light, and the bright rim. */
function paintStatic(size: number, dpr: number, radius: number): Pick<Scene, 'base' | 'rim'> {
  const centre = size / 2;

  const [base, b] = makeLayer(size, dpr);
  const body = b.createRadialGradient(centre + 0.64 * radius, centre + 0.3 * radius, radius * 0.04, centre + 0.1 * radius, centre, radius * 1.06);
  body.addColorStop(0, 'rgba(255,112,32,0.3)');
  body.addColorStop(0.2, 'rgba(76,54,66,0.5)');
  body.addColorStop(0.5, 'rgba(26,36,66,0.78)');
  body.addColorStop(0.82, 'rgba(12,18,34,0.95)');
  body.addColorStop(1, 'rgba(8,11,19,0.99)');
  b.beginPath();
  b.arc(centre, centre, radius, 0, Math.PI * 2);
  b.fillStyle = body;
  b.fill();
  // Darken the side that faces the headline so text on top stays easy to read.
  const shade = b.createLinearGradient(centre - radius, 0, centre + radius * 0.55, 0);
  shade.addColorStop(0, 'rgba(8,11,19,0.62)');
  shade.addColorStop(1, 'rgba(8,11,19,0)');
  b.fillStyle = shade;
  b.fill();

  const [rim, r] = makeLayer(size, dpr);
  const edge = r.createLinearGradient(centre - radius * 0.7, centre - radius * 0.8, centre + radius * 0.9, centre + radius * 0.6);
  edge.addColorStop(0, 'rgba(255,138,36,0)');
  edge.addColorStop(0.45, 'rgba(255,138,36,0.18)');
  edge.addColorStop(1, 'rgba(255,150,60,0.95)');
  r.strokeStyle = edge;
  r.lineWidth = Math.max(1.2, radius / 190);
  r.shadowColor = 'rgba(255,90,0,0.85)';
  r.shadowBlur = radius * 0.09;
  r.beginPath();
  r.arc(centre, centre, radius, 0, Math.PI * 2);
  r.stroke();

  return { base, rim };
}

export default function EarthGlobe({ quality, reducedMotion, className }: EarthGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;
    const draw = context;
    const surface = canvas;

    const lite = quality === 'lite';
    const mask = decodeLandMask();
    const points = sampleLandPoints(mask, lite ? 11000 : 26000);
    const steps = lite ? 44 : 72;

    const lanes: Lane[] = LANES.slice(0, lite ? 6 : LANES.length).map(([from, to], index) => {
      const a = HUBS[from];
      const b = HUBS[to];
      const lift = 0.05 + 0.17 * (angularDistance(a, b) / Math.PI);
      return {
        arc: laneArc(a, b, steps, lift),
        duration: 7200 + ((index * 1700) % 4600),
        offset: (index * 0.37) % 1,
        toTeal: from === 'mumbai' || from === 'chennai',
      };
    });
    const nodes = Array.from(new Set(LANES.slice(0, lanes.length).flat())).map((key, index) => ({
      vector: latLonToVector(HUBS[key].lat, HUBS[key].lon),
      teal: !(key === 'mumbai' || key === 'chennai'),
      phase: (index * 0.23) % 1,
    }));

    const buckets = Array.from({ length: LEVELS }, () => new Float32Array(points.length));
    const counts = new Int32Array(LEVELS);
    const frameGap = lite ? 1000 / 30 : 0;

    let scene: Scene | null = null;
    let raf = 0;
    let timer = 0;
    let inView = true;
    let tabVisible = document.visibilityState !== 'hidden';
    let running = false;
    let startedAt = 0;

    const build = () => {
      const size = Math.round(surface.clientWidth);
      if (size < 8) return;
      const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.75 : 2);
      surface.width = Math.round(size * dpr);
      surface.height = Math.round(size * dpr);
      const radius = size * 0.4;
      scene = { size, dpr, radius, ...paintStatic(size, dpr, radius) };
    };

    const frame = (now: number, yaw: number) => {
      if (!scene) return;
      const { size, dpr, radius, base, rim } = scene;
      const centre = size / 2;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);

      draw.setTransform(1, 0, 0, 1, 0, 0);
      draw.globalCompositeOperation = 'source-over';
      draw.clearRect(0, 0, surface.width, surface.height);
      draw.drawImage(base, 0, 0);
      draw.scale(dpr, dpr);

      // View-space position of a unit vector, scaled by `scale` (1 = on the surface).
      const project = (x: number, y: number, z: number, out: number[]) => {
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        out[0] = x1;
        out[1] = y * cosT - z1 * sinT;
        out[2] = y * sinT + z1 * cosT;
      };
      const view = [0, 0, 0];

      // Graticule: faint longitude and latitude lines.
      draw.beginPath();
      for (let lon = -180; lon < 180; lon += 30) {
        let pen = false;
        for (let lat = -80; lat <= 80; lat += 5) {
          const v = latLonToVector(lat, lon);
          project(v[0], v[1], v[2], view);
          if (view[2] <= 0) {
            pen = false;
            continue;
          }
          const px = centre + radius * view[0];
          const py = centre - radius * view[1];
          if (pen) draw.lineTo(px, py);
          else draw.moveTo(px, py);
          pen = true;
        }
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        let pen = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const v = latLonToVector(lat, lon);
          project(v[0], v[1], v[2], view);
          if (view[2] <= 0) {
            pen = false;
            continue;
          }
          const px = centre + radius * view[0];
          const py = centre - radius * view[1];
          if (pen) draw.lineTo(px, py);
          else draw.moveTo(px, py);
          pen = true;
        }
      }
      draw.strokeStyle = 'rgba(150,190,255,0.075)';
      draw.lineWidth = 0.6;
      draw.stroke();

      // Land dots, grouped by brightness so each group is drawn with one fill.
      counts.fill(0);
      const dot = radius / 190 + (lite ? 0.62 : 0.42);
      for (let i = 0; i < points.length; i += 3) {
        project(points[i], points[i + 1], points[i + 2], view);
        const z = view[2];
        if (z <= 0.02) continue;
        const lit = lighting(view[0], view[1], z, LIGHT);
        const level = Math.min(LEVELS - 1, Math.floor((0.24 * z + 0.76 * lit) * LEVELS));
        const bucket = buckets[level];
        const at = counts[level];
        bucket[at] = centre + radius * view[0];
        bucket[at + 1] = centre - radius * view[1];
        bucket[at + 2] = dot * (0.6 + 0.55 * z);
        counts[level] = at + 3;
      }
      for (let level = 0; level < LEVELS; level += 1) {
        const total = counts[level];
        if (total === 0) continue;
        const bucket = buckets[level];
        draw.fillStyle = PALETTE[level];
        draw.beginPath();
        for (let k = 0; k < total; k += 3) {
          const d = bucket[k + 2];
          draw.rect(bucket[k] - d / 2, bucket[k + 1] - d / 2, d, d);
        }
        draw.fill();
      }

      // Trade lanes and travelling comets, added on top as light.
      draw.globalCompositeOperation = 'lighter';
      const unit = radius / 300;
      const seconds = now / 1000;
      for (const lane of lanes) {
        const arc = lane.arc;
        const count = arc.length / 3;
        const visible: boolean[] = new Array(count);
        const sx: number[] = new Array(count);
        const sy: number[] = new Array(count);
        for (let k = 0; k < count; k += 1) {
          project(arc[k * 3], arc[k * 3 + 1], arc[k * 3 + 2], view);
          visible[k] = !isBehindGlobe(view[0], view[1], view[2]);
          sx[k] = centre + radius * view[0];
          sy[k] = centre - radius * view[1];
        }

        draw.beginPath();
        let pen = false;
        for (let k = 0; k < count; k += 1) {
          if (!visible[k]) {
            pen = false;
            continue;
          }
          if (pen) draw.lineTo(sx[k], sy[k]);
          else draw.moveTo(sx[k], sy[k]);
          pen = true;
        }
        draw.strokeStyle = lane.toTeal ? 'rgba(255,138,36,0.2)' : 'rgba(0,214,163,0.17)';
        draw.lineWidth = Math.max(0.7, unit * 1.1);
        draw.stroke();

        const phase = (seconds * 1000) / lane.duration + lane.offset;
        const head = (phase - Math.floor(phase)) * (1 + TRAIL);
        const from = Math.max(0, Math.floor((head - TRAIL) * (count - 1)));
        const to = Math.min(count - 1, Math.floor(head * (count - 1)));
        for (let k = from; k < to; k += 1) {
          if (!visible[k] || !visible[k + 1]) continue;
          const fraction = (k - from) / Math.max(1, to - from);
          draw.strokeStyle = `rgba(255,${Math.round(150 + 80 * fraction)},${Math.round(70 + 90 * fraction)},${(0.05 + 0.9 * fraction * fraction).toFixed(3)})`;
          draw.lineWidth = Math.max(0.8, unit * (1 + 2.2 * fraction));
          draw.beginPath();
          draw.moveTo(sx[k], sy[k]);
          draw.lineTo(sx[k + 1], sy[k + 1]);
          draw.stroke();
        }
        if (head <= 1 && visible[to]) {
          draw.fillStyle = 'rgba(255,138,36,0.16)';
          draw.beginPath();
          draw.arc(sx[to], sy[to], Math.max(2.5, unit * 6), 0, Math.PI * 2);
          draw.fill();
          draw.fillStyle = 'rgba(255,236,205,0.95)';
          draw.beginPath();
          draw.arc(sx[to], sy[to], Math.max(1, unit * 2.1), 0, Math.PI * 2);
          draw.fill();
        }
      }

      // Port nodes with a slow pulse.
      for (const node of nodes) {
        project(node.vector[0], node.vector[1], node.vector[2], view);
        if (view[2] <= 0.03) continue;
        const px = centre + radius * view[0];
        const py = centre - radius * view[1];
        const pulse = (seconds / 2.4 + node.phase) % 1;
        const [r, g, b] = node.teal ? [0, 214, 163] : [255, 138, 36];
        draw.strokeStyle = `rgba(${r},${g},${b},${((1 - pulse) * 0.6).toFixed(3)})`;
        draw.lineWidth = Math.max(0.8, unit * 1.2);
        draw.beginPath();
        draw.arc(px, py, Math.max(2, unit * (2 + 11 * pulse)), 0, Math.PI * 2);
        draw.stroke();
        draw.fillStyle = `rgba(${r},${g},${b},0.95)`;
        draw.beginPath();
        draw.arc(px, py, Math.max(1.4, unit * 2.6), 0, Math.PI * 2);
        draw.fill();
      }

      draw.setTransform(1, 0, 0, 1, 0, 0);
      draw.drawImage(rim, 0, 0);
      draw.globalCompositeOperation = 'source-over';
    };

    const stillYaw = START_YAW + 0.5;
    const tick = (time: number) => {
      raf = 0;
      if (!running) return;
      if (!startedAt) startedAt = time;
      const elapsed = time - startedAt;
      frame(elapsed, START_YAW + (SPIN * elapsed) / 1000);
      if (frameGap > 0) {
        // Phones: sleep between frames instead of waking up every 16 ms just to skip one.
        const spent = performance.now() - time;
        timer = window.setTimeout(() => {
          timer = 0;
          if (running) raf = requestAnimationFrame(tick);
        }, Math.max(0, frameGap - spent - 4));
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    const shouldRun = () => !reducedMotion && inView && tabVisible;
    const sync = () => {
      const wanted = shouldRun();
      if (wanted && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!wanted && running) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        if (timer) window.clearTimeout(timer);
        raf = 0;
        timer = 0;
      }
    };

    const redraw = () => {
      build();
      if (reducedMotion) frame(2600, stillYaw);
      else if (!running) frame(performance.now() - startedAt, START_YAW);
      surface.dataset.ready = 'true';
    };

    redraw();
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(surface);
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      sync();
    });
    intersection.observe(surface);
    const onVisibility = () => {
      tabVisible = document.visibilityState !== 'hidden';
      sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    sync();

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [quality, reducedMotion]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" data-testid="hero-earth" />;
}
