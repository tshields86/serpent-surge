// Item + hazard glyphs (docs/DESIGN_SPEC.md §4).
// Geometry adapted from docs/mocks/serpent-surge-items.html and docs/mocks/serpent-surge-gameplay.html.
// Food = soft rounded silhouettes; hazards = hard/spiky/hazy.

import { applyGlow, clearGlow, COLOR } from '../theme';
import { FoodType } from '../game/Food';
import { HazardType } from '../game/Hazard';

/** Draw a food glyph centered at (cx, cy) inside a `cellSize` cell. */
export function drawFood(
  ctx: CanvasRenderingContext2D,
  type: FoodType,
  cx: number,
  cy: number,
  cellSize: number,
  timeMs: number,
): void {
  ctx.save();
  switch (type) {
    case FoodType.APPLE:        drawApple(ctx, cx, cy, cellSize); break;
    case FoodType.GOLDEN_APPLE: drawGoldenApple(ctx, cx, cy, cellSize, timeMs); break;
    case FoodType.SHRINK_PELLET: drawShrinkPellet(ctx, cx, cy, cellSize); break;
    case FoodType.SPEED_FRUIT:  drawSpeedFruit(ctx, cx, cy, cellSize); break;
    case FoodType.BOMB_FRUIT:   drawBombFruit(ctx, cx, cy, cellSize, timeMs); break;
  }
  ctx.restore();
}

/** Draw a hazard glyph centered at (cx, cy). state-aware where it matters. */
export function drawHazard(
  ctx: CanvasRenderingContext2D,
  type: HazardType,
  state: 'active' | 'inactive',
  ticksRemaining: number | null,
  cx: number,
  cy: number,
  cellSize: number,
  timeMs: number,
): void {
  ctx.save();
  switch (type) {
    case HazardType.WALL_BLOCK:    drawWallBlock(ctx, cx, cy, cellSize); break;
    case HazardType.SPIKE_TRAP:    drawSpikeTrap(ctx, cx, cy, cellSize, state); break;
    case HazardType.POISON_TRAIL:  drawPoisonTrail(ctx, cx, cy, cellSize, ticksRemaining); break;
    case HazardType.WARP_HOLE:     drawWarpHole(ctx, cx, cy, cellSize, timeMs); break;
    case HazardType.MAGNET:        drawMagnet(ctx, cx, cy, cellSize); break;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Food glyphs — soft / rounded
// ---------------------------------------------------------------------------

function drawApple(ctx: CanvasRenderingContext2D, cx: number, cy: number, cellSize: number): void {
  const r = cellSize * 0.34;
  applyGlow(ctx, 'apple');
  ctx.fillStyle = COLOR.apple;
  // Slightly flattened apple silhouette (rounded teardrop)
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.9, cx - r * 1.05, cy + r * 1.05, cx, cy + r * 1.05);
  ctx.bezierCurveTo(cx + r * 1.05, cy + r * 1.05, cx + r * 1.2, cy - r * 0.9, cx, cy - r * 0.9);
  ctx.closePath();
  ctx.fill();

  clearGlow(ctx);
  // Stem
  ctx.fillStyle = COLOR.appleStem;
  const stemH = cellSize * 0.18;
  const stemW = cellSize * 0.08;
  ctx.fillRect(cx - stemW / 2, cy - r * 1.05 - stemH * 0.5, stemW, stemH);
  // Tiny highlight
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.4, cy - r * 0.1, cellSize * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoldenApple(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  timeMs: number,
): void {
  const pulse = (Math.sin(timeMs / 350) + 1) / 2;            // 0..1
  const r = cellSize * 0.34;

  // Halo ring
  ctx.strokeStyle = COLOR.goldenApple;
  ctx.globalAlpha = 0.25 + pulse * 0.35;
  ctx.lineWidth = Math.max(1, cellSize * 0.04);
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 1.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Apple body
  applyGlow(ctx, 'gold');
  ctx.fillStyle = COLOR.goldenApple;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.9, cx - r * 1.05, cy + r * 1.05, cx, cy + r * 1.05);
  ctx.bezierCurveTo(cx + r * 1.05, cy + r * 1.05, cx + r * 1.2, cy - r * 0.9, cx, cy - r * 0.9);
  ctx.closePath();
  ctx.fill();
  clearGlow(ctx);

  // Stem + sparkle (top-left)
  ctx.fillStyle = COLOR.goldenAppleStem;
  const stemH = cellSize * 0.18;
  const stemW = cellSize * 0.08;
  ctx.fillRect(cx - stemW / 2, cy - r * 1.05 - stemH * 0.5, stemW, stemH);

  ctx.fillStyle = COLOR.goldenAppleSparkle;
  const sx = cx - r * 0.95;
  const sy = cy - r * 0.95;
  const s = cellSize * 0.1 * (0.7 + pulse * 0.3);
  ctx.beginPath();
  ctx.moveTo(sx, sy - s);
  ctx.lineTo(sx + s * 0.4, sy);
  ctx.lineTo(sx, sy + s);
  ctx.lineTo(sx - s * 0.4, sy);
  ctx.closePath();
  ctx.fill();
}

function drawShrinkPellet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  // Capsule pill with a downward chevron (the "shrink" arrow)
  const w = cellSize * 0.62;
  const h = cellSize * 0.42;
  applyGlow(ctx, 'cyan');
  ctx.fillStyle = COLOR.shrinkPellet;
  roundedRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fill();
  clearGlow(ctx);

  ctx.strokeStyle = COLOR.shrinkPelletInk;
  ctx.lineWidth = Math.max(2, cellSize * 0.07);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const a = cellSize * 0.14;
  ctx.beginPath();
  ctx.moveTo(cx - a, cy - a * 0.4);
  ctx.lineTo(cx, cy + a * 0.4);
  ctx.lineTo(cx + a, cy - a * 0.4);
  ctx.stroke();
}

function drawSpeedFruit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  // Round lime body with double forward chevron + motion streaks behind
  const r = cellSize * 0.3;

  // Motion streaks (behind)
  clearGlow(ctx);
  ctx.strokeStyle = COLOR.speedFruit;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = Math.max(1, cellSize * 0.05);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const sy = cy + (i - 1) * cellSize * 0.18;
    ctx.beginPath();
    ctx.moveTo(cx - r - cellSize * 0.32, sy);
    ctx.lineTo(cx - r - cellSize * 0.08, sy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  applyGlow(ctx, 'lime');
  ctx.fillStyle = COLOR.speedFruit;
  ctx.beginPath();
  ctx.arc(cx + cellSize * 0.06, cy, r, 0, Math.PI * 2);
  ctx.fill();
  clearGlow(ctx);

  // Double forward chevrons (>>)
  ctx.strokeStyle = COLOR.speedFruitInk;
  ctx.lineWidth = Math.max(2, cellSize * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const cw = cellSize * 0.14;
  const ch = cellSize * 0.16;
  for (let i = 0; i < 2; i++) {
    const xOff = cx + cellSize * 0.06 + (i - 0.5) * cw * 0.9;
    ctx.beginPath();
    ctx.moveTo(xOff - cw / 2, cy - ch / 2);
    ctx.lineTo(xOff + cw / 2, cy);
    ctx.lineTo(xOff - cw / 2, cy + ch / 2);
    ctx.stroke();
  }
}

function drawBombFruit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  timeMs: number,
): void {
  const r = cellSize * 0.32;
  applyGlow(ctx, 'orange');
  ctx.fillStyle = COLOR.bombFruit;
  ctx.beginPath();
  ctx.arc(cx, cy + cellSize * 0.04, r, 0, Math.PI * 2);
  ctx.fill();
  clearGlow(ctx);

  // Curling fuse top-right
  ctx.strokeStyle = COLOR.bombFruitFuse;
  ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.6, cy - r * 0.6);
  ctx.quadraticCurveTo(
    cx + r * 1.4,
    cy - r * 1.2,
    cx + r * 1.5,
    cy - r * 0.5,
  );
  ctx.stroke();

  // Spark — pulses
  const pulse = (Math.sin(timeMs / 80) + 1) / 2;
  ctx.fillStyle = COLOR.bombFruitSpark;
  ctx.globalAlpha = 0.7 + pulse * 0.3;
  const sx = cx + r * 1.5;
  const sy = cy - r * 0.5;
  const sp = cellSize * 0.08 * (0.8 + pulse * 0.4);
  ctx.beginPath();
  ctx.moveTo(sx, sy - sp);
  ctx.lineTo(sx + sp * 0.5, sy);
  ctx.lineTo(sx, sy + sp);
  ctx.lineTo(sx - sp * 0.5, sy);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Hazard glyphs — hard / spiky / hazy
// ---------------------------------------------------------------------------

function drawWallBlock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  const w = cellSize * 0.78;
  const h = cellSize * 0.66;
  const x = cx - w / 2;
  const y = cy - h / 2;
  applyGlow(ctx, 'apple'); // dull red glow — matches mock's drop-shadow
  ctx.globalAlpha = 0.6;
  ctx.shadowBlur = 6;
  ctx.fillStyle = COLOR.wallBlock;
  roundedRectPath(ctx, x, y, w, h, Math.max(1, cellSize * 0.05));
  ctx.fill();
  ctx.globalAlpha = 1;
  clearGlow(ctx);

  // Brick courses (horizontal + staggered verticals)
  ctx.strokeStyle = COLOR.wallBlockLine;
  ctx.lineWidth = Math.max(1, cellSize * 0.03);
  ctx.beginPath();
  ctx.moveTo(x, y + h / 3); ctx.lineTo(x + w, y + h / 3);
  ctx.moveTo(x, y + (h * 2) / 3); ctx.lineTo(x + w, y + (h * 2) / 3);
  // Staggered vertical mortar lines
  ctx.moveTo(x + w * 0.33, y); ctx.lineTo(x + w * 0.33, y + h / 3);
  ctx.moveTo(x + w * 0.66, y + h / 3); ctx.lineTo(x + w * 0.66, y + (h * 2) / 3);
  ctx.moveTo(x + w * 0.33, y + (h * 2) / 3); ctx.lineTo(x + w * 0.33, y + h);
  ctx.stroke();
}

function drawSpikeTrap(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  state: 'active' | 'inactive',
): void {
  // Base bar — always visible (so retraction reads as "still here, just safe")
  const barW = cellSize * 0.78;
  const barH = cellSize * 0.14;
  const baseY = cy + cellSize * 0.2;
  clearGlow(ctx);
  ctx.fillStyle = COLOR.spikeTrapBase;
  roundedRectPath(ctx, cx - barW / 2, baseY - barH / 2, barW, barH, barH * 0.3);
  ctx.fill();

  if (state === 'active') {
    // Three red triangular spikes growing up from the base
    applyGlow(ctx, 'coral');
    ctx.fillStyle = COLOR.spikeTrap;
    const tipY = cy - cellSize * 0.34;
    const spikeBaseY = baseY - barH / 2;
    const spikeBaseW = cellSize * 0.18;
    for (let i = -1; i <= 1; i++) {
      const baseX = cx + i * cellSize * 0.22;
      ctx.beginPath();
      ctx.moveTo(baseX - spikeBaseW / 2, spikeBaseY);
      ctx.lineTo(baseX, tipY);
      ctx.lineTo(baseX + spikeBaseW / 2, spikeBaseY);
      ctx.closePath();
      ctx.fill();
    }
    clearGlow(ctx);
  } else {
    // Retracted — small inert nubs on top of the base
    ctx.fillStyle = COLOR.spikeTrap;
    ctx.globalAlpha = 0.35;
    const nubR = cellSize * 0.05;
    for (let i = -1; i <= 1; i++) {
      const x = cx + i * cellSize * 0.22;
      ctx.beginPath();
      ctx.arc(x, baseY - barH * 0.6, nubR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawPoisonTrail(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  ticksRemaining: number | null,
): void {
  const fade = ticksRemaining !== null ? Math.max(0, Math.min(1, ticksRemaining / 8)) : 1;
  const r = cellSize * 0.42 * (0.65 + fade * 0.35);

  applyGlow(ctx, 'purple');
  ctx.globalAlpha = 0.45 + fade * 0.45;
  ctx.fillStyle = COLOR.poisonTrail;

  // Irregular bubbling blob — three overlapping bumps
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy + r * 0.1, r * 0.78, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.4, cy - r * 0.05, r * 0.7, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.05, cy + r * 0.45, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Lighter bubble specks
  clearGlow(ctx);
  ctx.fillStyle = COLOR.poisonTrailBubble;
  ctx.globalAlpha = 0.7 * fade + 0.2;
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy - r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.3, cy + r * 0.25, r * 0.1, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.05, cy - r * 0.3, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWarpHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
  timeMs: number,
): void {
  const pulse = (Math.sin(timeMs / 600) + 1) / 2; // 0..1
  // Concentric rings + filled core — non-deadly cyan beacon
  ctx.lineWidth = Math.max(1.5, cellSize * 0.06);

  // Outer ring (faint)
  ctx.strokeStyle = COLOR.warpHole;
  ctx.globalAlpha = 0.35 + pulse * 0.2;
  applyGlow(ctx, 'cyan');
  ctx.beginPath();
  ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  // Mid ring
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.arc(cx, cy, cellSize * 0.27, 0, Math.PI * 2);
  ctx.stroke();

  // Core dot
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLOR.warpHole;
  ctx.beginPath();
  ctx.arc(cx, cy, cellSize * 0.12, 0, Math.PI * 2);
  ctx.fill();
  clearGlow(ctx);
}

function drawMagnet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cellSize: number,
): void {
  // Horseshoe magnet: two prongs + curve, with white poles on the ends.
  const armWidth = cellSize * 0.16;
  const armHeight = cellSize * 0.42;
  const span = cellSize * 0.42;
  const topY = cy - cellSize * 0.22;

  applyGlow(ctx, 'amber');
  ctx.strokeStyle = COLOR.magnet;
  ctx.lineWidth = armWidth;
  ctx.lineCap = 'butt';

  // U-shape via stroked path
  ctx.beginPath();
  ctx.moveTo(cx - span / 2, topY);
  ctx.lineTo(cx - span / 2, topY + armHeight * 0.5);
  ctx.quadraticCurveTo(cx - span / 2, topY + armHeight, cx, topY + armHeight);
  ctx.quadraticCurveTo(cx + span / 2, topY + armHeight, cx + span / 2, topY + armHeight * 0.5);
  ctx.lineTo(cx + span / 2, topY);
  ctx.stroke();
  clearGlow(ctx);

  // White pole caps at the prong tips
  ctx.fillStyle = COLOR.magnetPole;
  const poleW = armWidth * 1.1;
  const poleH = armWidth * 0.85;
  ctx.fillRect(cx - span / 2 - poleW / 2, topY - poleH * 0.1, poleW, poleH);
  ctx.fillRect(cx + span / 2 - poleW / 2, topY - poleH * 0.1, poleW, poleH);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
