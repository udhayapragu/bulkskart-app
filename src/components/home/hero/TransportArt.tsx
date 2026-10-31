/**
 * Original vector artwork for the hero: container ship, cargo aircraft, container truck and a port
 * skyline. Everything is drawn here, so there are no image files to download. Shapes are generated
 * from a fixed seed, which keeps the output identical on every render.
 */

interface ArtProps {
  className?: string;
}

const BOX_COLORS = ['#8C3F14', '#2B6A66', '#2A3556', '#9A5A2A', '#3B4A72', '#6D2F1E', '#4B7F7B', '#6F7889'];

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

function stackBoxes(columns: number[], startX: number, baseY: number, boxW: number, boxH: number, seed: number): Box[] {
  const random = seededRandom(seed);
  const boxes: Box[] = [];
  columns.forEach((levels, column) => {
    for (let level = 0; level < levels; level += 1) {
      boxes.push({
        x: startX + column * (boxW + 1),
        y: baseY - (level + 1) * (boxH + 0.6),
        w: boxW,
        h: boxH,
        fill: BOX_COLORS[Math.floor(random() * BOX_COLORS.length)],
      });
    }
  });
  return boxes;
}

/** One path per colour instead of one element per container. */
function pathsByColour(boxes: Box[]): Array<[string, string]> {
  const groups = new Map<string, string>();
  for (const box of boxes) {
    groups.set(box.fill, `${groups.get(box.fill) ?? ''}M${box.x} ${box.y}h${box.w}v${box.h}h${-box.w}z`);
  }
  return Array.from(groups);
}
const outline = (boxes: Box[]) => boxes.map((box) => `M${box.x} ${box.y}h${box.w}v${box.h}h${-box.w}z`).join('');
const topLines = (boxes: Box[], thickness: number) => boxes.map((box) => `M${box.x} ${box.y}h${box.w}v${thickness}h${-box.w}z`).join('');

const SHIP_BOXES = [
  ...stackBoxes([3, 4, 4, 3], 22, 118, 22, 10, 11),
  ...stackBoxes([4, 5, 5, 5, 4, 5, 5, 4, 5, 5, 4, 4, 3], 214, 118, 28, 10.5, 29),
];
const SHIP_PATHS = pathsByColour(SHIP_BOXES);
const SHIP_OUTLINE = outline(SHIP_BOXES);
const SHIP_TOPS = topLines(SHIP_BOXES, 1.1);
const SHIP_WINDOWS_LIT = [0, 1, 2]
  .flatMap((row) => Array.from({ length: 8 }, (_, col) => ({ row, col })))
  .filter(({ row, col }) => (row + col) % 3 !== 0)
  .map(({ row, col }) => `M${118 + col * 9} ${79 + row * 11}h5v5h-5z`)
  .join('');
const SHIP_WINDOWS_DIM = [0, 1, 2]
  .flatMap((row) => Array.from({ length: 8 }, (_, col) => ({ row, col })))
  .filter(({ row, col }) => (row + col) % 3 === 0)
  .map(({ row, col }) => `M${118 + col * 9} ${79 + row * 11}h5v5h-5z`)
  .join('');

export function ShipArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 650 190" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ship-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2540" />
          <stop offset="1" stopColor="#0B1120" />
        </linearGradient>
        <linearGradient id="ship-glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF5A00" stopOpacity="0" />
          <stop offset="1" stopColor="#FF8A24" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="ship-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF8A24" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#0B1120" stopOpacity="0.2" />
          <stop offset="1" stopColor="#080B13" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Container stacks: one path per colour, lit from above by a single clipped gradient */}
      <g>
        <clipPath id="ship-boxes">
          <path d={SHIP_OUTLINE} />
        </clipPath>
        {SHIP_PATHS.map(([fill, d]) => (
          <path key={fill} d={d} fill={fill} />
        ))}
        <rect x="20" y="58" width="580" height="62" fill="url(#ship-dusk)" clipPath="url(#ship-boxes)" />
        <path d={SHIP_TOPS} fill="#FFB36B" opacity="0.4" />
      </g>

      {/* Hull */}
      <path d="M14 118 H592 L636 90 L608 152 H48 L14 136 Z" fill="url(#ship-hull)" />
      <path d="M40 141 H614 L608 152 H48 Z" fill="#3A1313" />
      <path d="M14 118 H592 L636 90" fill="none" stroke="#FF8A24" strokeOpacity="0.7" strokeWidth="1.4" />
      <path d="M24 129 H600" stroke="#2C3A5E" strokeWidth="1" opacity="0.8" />
      <path d="M300 118 H632 L608 152 H300 Z" fill="url(#ship-glow)" opacity="0.5" />

      {/* Superstructure */}
      <g>
        <rect x="104" y="58" width="94" height="14" fill="#18223A" />
        <rect x="112" y="72" width="78" height="46" fill="#121A2E" />
        <rect x="112" y="40" width="26" height="32" fill="#18223A" />
        <rect x="112" y="46" width="26" height="5" fill="#FF5A00" opacity="0.85" />
        <rect x="108" y="61" width="86" height="6" fill="#FFD9A0" opacity="0.9" />
        <path d={SHIP_WINDOWS_LIT} fill="#FFC77A" opacity="0.8" />
        <path d={SHIP_WINDOWS_DIM} fill="#FFC77A" opacity="0.25" />
        <path d="M170 58 V30 M162 38 H178" stroke="#2C3A5E" strokeWidth="2" />
        <circle cx="170" cy="29" r="2.4" fill="#FF3B3B" />
        <path d="M104 58 H198 M112 72 H190" stroke="#FF8A24" strokeOpacity="0.55" strokeWidth="1" />
      </g>

      {/* Navigation lights */}
      <circle cx="632" cy="94" r="2.6" fill="#00D6A3" />
      <circle cx="16" cy="120" r="2.2" fill="#FF3B3B" />

      {/* Bow wave */}
      <path d="M598 152 q16 -9 38 -2 q-12 4 -14 8 q-14 -2 -24 -6 Z" fill="#FFFFFF" opacity="0.22" />
    </svg>
  );
}

export function PlaneArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 270 96" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="plane-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A3656" />
          <stop offset="0.55" stopColor="#151D33" />
          <stop offset="1" stopColor="#0C1222" />
        </linearGradient>
      </defs>
      {/* Tail fin and stabiliser */}
      <path d="M30 44 L10 6 L40 6 L66 44 Z" fill="#18223A" />
      <path d="M10 6 L40 6" stroke="#FF8A24" strokeOpacity="0.8" strokeWidth="1.4" />
      <path d="M30 6 L40 6 L44 14 L33 14 Z" fill="#FF5A00" opacity="0.9" />
      <path d="M24 52 L2 48 L8 56 L34 58 Z" fill="#111A2E" />
      {/* Far wing, behind the body */}
      <path d="M150 52 L204 52 L172 70 L140 70 Z" fill="#0E1527" />
      {/* Fuselage */}
      <path d="M26 48 Q26 40 38 40 L212 40 Q248 40 266 53 Q248 66 212 66 L38 66 Q26 66 26 58 Z" fill="url(#plane-body)" />
      <path d="M38 40 L212 40 Q248 40 266 53" fill="none" stroke="#FF8A24" strokeOpacity="0.75" strokeWidth="1.4" />
      <path d="M30 60 H236" stroke="#FF5A00" strokeOpacity="0.55" strokeWidth="2" />
      {/* Cockpit and cargo-door line */}
      <path d="M232 46 L246 46 Q252 48 256 52 L238 52 Z" fill="#FFD9A0" opacity="0.85" />
      <path d="M86 44 V62 M138 44 V62 M178 44 V62" stroke="#0A0F1C" strokeWidth="1" opacity="0.7" />
      {/* Near wing and engine */}
      <path d="M118 62 L186 62 L124 94 L96 94 Z" fill="#1C2742" />
      <path d="M96 94 L124 94 L186 62" fill="none" stroke="#FF8A24" strokeOpacity="0.6" strokeWidth="1" />
      <ellipse cx="136" cy="80" rx="17" ry="7" fill="#101829" />
      <ellipse cx="150" cy="80" rx="3.6" ry="6" fill="#FFB36B" opacity="0.55" />
      <circle className="cin-strobe" cx="9" cy="8" r="2.2" fill="#FF3B3B" />
      <circle className="cin-strobe cin-strobe-b" cx="104" cy="93" r="2" fill="#FFFFFF" />
    </svg>
  );
}

const TRUCK_RIBS = Array.from({ length: 37 }, (_, i) => `M${30 + i * 8} 22h1.6v54h-1.6z`).join('');

export function TruckArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 440 118" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="truck-box" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9A4A18" />
          <stop offset="1" stopColor="#4A2410" />
        </linearGradient>
        <linearGradient id="truck-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFE2B0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFE2B0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Headlight beam */}
      <path d="M424 80 L440 70 V104 Z" fill="url(#truck-beam)" />
      {/* Container */}
      <rect x="24" y="20" width="312" height="58" fill="url(#truck-box)" />
      <path d={TRUCK_RIBS} fill="#1A0D06" opacity="0.4" />
      <rect x="24" y="20" width="312" height="2" fill="#FFB36B" opacity="0.65" />
      <rect x="150" y="34" width="86" height="20" fill="#0E1526" opacity="0.18" />
      {/* Chassis */}
      <rect x="18" y="78" width="330" height="9" fill="#10192C" />
      {/* Cab */}
      <path d="M340 38 H392 Q404 38 410 50 L424 70 Q428 76 428 84 V92 H340 Z" fill="#18223C" />
      <path d="M392 44 L408 66 H356 V44 Z" fill="#8FB8D8" opacity="0.5" />
      <path d="M340 38 H392 Q404 38 410 50" fill="none" stroke="#FF8A24" strokeOpacity="0.8" strokeWidth="1.4" />
      <rect x="422" y="72" width="8" height="6" fill="#FFE2B0" />
      <rect x="18" y="64" width="5" height="8" fill="#FF3B3B" />
      {/* Wheels */}
      {[62, 92, 122, 366, 404].map((x) => (
        <g key={x}>
          <circle cx={x} cy="96" r="13" fill="#070A12" />
          <circle cx={x} cy="96" r="6" fill="#222C46" />
          <circle cx={x} cy="96" r="2" fill="#FF8A24" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

const CRANE_STACKS = [
  { x: 0, columns: [3, 4, 4, 3, 2] },
  { x: 250, columns: [2, 3, 3, 2] },
  { x: 520, columns: [4, 5, 5, 4, 3, 3] },
  { x: 860, columns: [3, 4, 3] },
  { x: 1010, columns: [2, 3, 3, 2, 2] },
];

const PORT_BOXES = CRANE_STACKS.flatMap((group, index) => stackBoxes(group.columns, group.x, 212, 30, 13, 101 + index * 17));
const PORT_PATHS = pathsByColour(PORT_BOXES);
const PORT_TOPS = topLines(PORT_BOXES, 1.2);

export function PortArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="port-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#080B13" stopOpacity="0" />
          <stop offset="1" stopColor="#080B13" stopOpacity="0.62" />
        </linearGradient>
        <symbol id="port-crane" viewBox="0 0 260 200" overflow="visible">
          <g fill="none" stroke="#1B2849" strokeWidth="5" strokeLinecap="square">
            <path d="M40 200 V58 M96 200 V58 M40 58 H96 M40 120 L96 90 M40 150 L96 120" />
            <path d="M-20 52 H238 M60 52 L196 12 M196 12 L238 52" strokeWidth="6" />
            <path d="M60 52 L130 12 L196 12" strokeWidth="3" />
          </g>
          <path d="M-20 50 H238 M60 50 L196 10" stroke="#FF8A24" strokeOpacity="0.75" strokeWidth="1.2" fill="none" />
          <rect x="150" y="62" width="14" height="10" fill="#1B2849" />
          <path d="M156 72 V104" stroke="#1B2849" strokeWidth="1.5" />
          <circle className="cin-beacon" cx="196" cy="10" r="2.6" fill="#FF3B3B" />
        </symbol>
      </defs>
      <g opacity="0.88">
        {PORT_PATHS.map(([fill, d]) => (
          <path key={fill} d={d} fill={fill} />
        ))}
        <path d={PORT_TOPS} fill="#FFB36B" opacity="0.3" />
      </g>
      <use href="#port-crane" x="120" y="10" width="260" height="200" />
      <use href="#port-crane" x="400" y="26" width="220" height="170" />
      <use href="#port-crane" x="760" y="6" width="270" height="206" />
      <rect x="0" y="0" width="1200" height="220" fill="url(#port-fade)" />
    </svg>
  );
}
