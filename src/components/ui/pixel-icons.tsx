/**
 * Pixel art SVG icons for dashboard widgets.
 * Each icon is drawn on an 8×8 pixel grid using <rect> elements.
 * Use shapeRendering="crispEdges" to preserve crisp pixel look.
 */

interface PixelIconProps {
  className?: string;
}

// ─── HEALTH WIDGET ───────────────────────────────────────────
// Pixel heart shape (8×8)
export function PixelHeart({ className }: PixelIconProps) {
  const pixels: [number, number][] = [
    // Row 0 — two bumps
    [1,0],[2,0],            [5,0],[6,0],
    // Row 1 — full width
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
    // Row 2
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
    // Row 3
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    // Row 4
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    // Row 5
    [2,5],[3,5],[4,5],[5,5],
    // Row 6 — tip
    [3,6],[4,6],
  ];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" fill="currentColor">
      {pixels.map(([x, y], i) => <rect key={i} x={x} y={y} width={1} height={1} />)}
    </svg>
  );
}

// ─── WORK WIDGET ─────────────────────────────────────────────
// Pixel clock face (8×8) — circle outline + hour hand pointing ~3 o'clock
export function PixelClock({ className }: PixelIconProps) {
  const pixels: [number, number][] = [
    // Row 0 — top arc
    [2,0],[3,0],[4,0],[5,0],
    // Row 1 — sides
    [1,1],[6,1],
    // Row 2 — 12 o'clock hand
    [0,2],[3,2],[7,2],
    // Row 3 — hand sweeps right
    [0,3],[3,3],[4,3],[5,3],[7,3],
    // Row 4 — center dot
    [0,4],[3,4],[7,4],
    // Row 5
    [1,5],[6,5],
    // Row 6 — bottom arc
    [2,6],[3,6],[4,6],[5,6],
  ];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" fill="currentColor">
      {pixels.map(([x, y], i) => <rect key={i} x={x} y={y} width={1} height={1} />)}
    </svg>
  );
}

// ─── FINANCE / MAIN WIDGET ───────────────────────────────────
// Pixel bar chart — 3 bars of different heights + baseline (8×8)
export function PixelChart({ className }: PixelIconProps) {
  const pixels: [number, number][] = [
    // Tall bar (col 6) — height 7
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],
    // Medium-tall bar (col 4-5) — height 5
    [4,2],[4,3],[4,4],[4,5],[4,6],
    [5,3],[5,4],[5,5],[5,6],
    // Short bar (col 1-2) — height 3
    [1,4],[1,5],[1,6],
    [2,5],[2,6],
    // Baseline
    [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
  ];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" fill="currentColor">
      {pixels.map(([x, y], i) => <rect key={i} x={x} y={y} width={1} height={1} />)}
    </svg>
  );
}

// ─── DAILY BRIEFING WIDGET ───────────────────────────────────
// Pixel terminal monitor — frame + ">" prompt line + stand (8×8)
export function PixelMonitor({ className }: PixelIconProps) {
  const pixels: [number, number][] = [
    // Row 0 — top border
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
    // Row 1 — sides
    [0,1],[7,1],
    // Row 2 — ">" prompt character
    [0,2],[2,2],[7,2],
    // Row 3 — continuation of ">"
    [0,3],[3,3],[7,3],
    // Row 4 — ">" closes + text line
    [0,4],[2,4],[5,4],[6,4],[7,4],
    // Row 5 — sides
    [0,5],[7,5],
    // Row 6 — bottom border
    [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],
    // Row 7 — monitor stand
    [3,7],[4,7],
  ];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" fill="currentColor">
      {pixels.map(([x, y], i) => <rect key={i} x={x} y={y} width={1} height={1} />)}
    </svg>
  );
}

// ─── SAVINGS WIDGET (bonus) ───────────────────────────────────
// Pixel piggy bank — round body + snout + ear + legs (8×8)
export function PixelPiggy({ className }: PixelIconProps) {
  const pixels: [number, number][] = [
    // ear
    [1,0],[2,0],
    // head/body top
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    // coin slot
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    // snout + eye
    [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    [0,5],[4,5],[5,5],[6,5],
    // legs
    [1,6],[2,6],[4,6],[5,6],
  ];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" fill="currentColor">
      {pixels.map(([x, y], i) => <rect key={i} x={x} y={y} width={1} height={1} />)}
    </svg>
  );
}
