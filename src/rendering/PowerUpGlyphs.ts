// Pixel glyphs for the held-power-up chips (docs/DESIGN_SPEC.md §3 + §5 bottom HUD).
// One small ALL-CAPS shape per power-up — no emoji. Each painter receives the
// chip's inner center (cx, cy) and a size in CSS px.

import { COLOR, type GlyphDraw } from '../theme';
import { PowerUpId } from '../game/PowerUp';

/** Look up the glyph painter for a power-up. Falls back to a generic dot. */
export function drawPowerUpGlyph(id: PowerUpId): GlyphDraw {
  return PAINTERS[id] ?? genericDot;
}

const PAINTERS: Partial<Record<PowerUpId, GlyphDraw>> = {
  [PowerUpId.GHOST_MODE]: paintGhost,
  [PowerUpId.WALL_WRAP]: paintWrap,
  [PowerUpId.VENOM_TRAIL]: paintVenom,
  [PowerUpId.HEAD_BASH]: paintBash,
  [PowerUpId.IRON_GUT]: paintShield,
  [PowerUpId.SCAVENGER]: paintApple,
  [PowerUpId.DASH]: paintBolt,
  [PowerUpId.TIME_DILATION]: paintRings,
  [PowerUpId.REWIND]: paintArrowBack,
  [PowerUpId.SINGULARITY]: paintSwirl,
  [PowerUpId.SPLIT_STRIKE]: paintScissors,
  [PowerUpId.OUROBOROS]: paintOuroboros,
  [PowerUpId.LUCKY]: paintClover,
  [PowerUpId.AFTERIMAGE]: paintAfterimage,
  [PowerUpId.SHOCKWAVE]: paintShockwave,
};

// ---------------------------------------------------------------------------
// Painters
// ---------------------------------------------------------------------------

function paintGhost(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const w = size * 0.62;
  const h = size * 0.78;
  ctx.fillStyle = COLOR.green;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy - h / 4);
  ctx.quadraticCurveTo(cx - w / 2, cy - h / 2, cx, cy - h / 2);
  ctx.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 4);
  ctx.lineTo(cx + w / 2, cy + h / 2);
  // Wavy bottom
  ctx.lineTo(cx + w / 4, cy + h / 3);
  ctx.lineTo(cx, cy + h / 2);
  ctx.lineTo(cx - w / 4, cy + h / 3);
  ctx.closePath();
  ctx.fill();
  // Eyes
  ctx.fillStyle = COLOR.primaryButtonText;
  const eye = size * 0.08;
  ctx.fillRect(cx - w * 0.22, cy - h * 0.1, eye, eye);
  ctx.fillRect(cx + w * 0.14, cy - h * 0.1, eye, eye);
}

function paintWrap(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Two opposing arrows — exit one side, enter the other
  ctx.strokeStyle = COLOR.green;
  ctx.lineWidth = Math.max(1.5, size * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const r = size * 0.34;
  const dy = size * 0.18;
  // Right arrow (top)
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - dy);
  ctx.lineTo(cx + r * 0.5, cy - dy);
  ctx.lineTo(cx + r * 0.2, cy - dy - r * 0.35);
  ctx.moveTo(cx + r * 0.5, cy - dy);
  ctx.lineTo(cx + r * 0.2, cy - dy + r * 0.35);
  ctx.stroke();
  // Left arrow (bottom)
  ctx.beginPath();
  ctx.moveTo(cx + r, cy + dy);
  ctx.lineTo(cx - r * 0.5, cy + dy);
  ctx.lineTo(cx - r * 0.2, cy + dy - r * 0.35);
  ctx.moveTo(cx - r * 0.5, cy + dy);
  ctx.lineTo(cx - r * 0.2, cy + dy + r * 0.35);
  ctx.stroke();
}

function paintVenom(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Skull-ish drip — purple, matches DEADLY poison color
  ctx.fillStyle = COLOR.poisonTrail;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.05, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Drip
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.05);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.3);
  ctx.lineTo(cx + size * 0.1, cy + size * 0.3);
  ctx.closePath();
  ctx.fill();
  // Eye sockets
  ctx.fillStyle = COLOR.bg;
  const eye = size * 0.07;
  ctx.fillRect(cx - size * 0.12, cy - size * 0.1, eye, eye);
  ctx.fillRect(cx + size * 0.05, cy - size * 0.1, eye, eye);
}

function paintBash(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Burst star
  ctx.fillStyle = COLOR.bombFruit;
  const points = 8;
  const outer = size * 0.4;
  const inner = size * 0.2;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function paintShield(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.fillStyle = COLOR.cyan;
  const w = size * 0.5;
  const h = size * 0.66;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 3);
  ctx.lineTo(cx + w / 2, cy + h / 6);
  ctx.quadraticCurveTo(cx + w / 2, cy + h / 2, cx, cy + h / 2);
  ctx.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 6);
  ctx.lineTo(cx - w / 2, cy - h / 3);
  ctx.closePath();
  ctx.fill();
}

function paintApple(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const r = size * 0.3;
  ctx.fillStyle = COLOR.apple;
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.04, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOR.appleStem;
  ctx.fillRect(cx - size * 0.04, cy - r * 1.2, size * 0.08, size * 0.16);
}

function paintBolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.fillStyle = COLOR.gold;
  const w = size * 0.45;
  const h = size * 0.7;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.1, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h * 0.05);
  ctx.lineTo(cx, cy - h * 0.05);
  ctx.lineTo(cx + w * 0.2, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy + h * 0.05);
  ctx.lineTo(cx, cy + h * 0.05);
  ctx.closePath();
  ctx.fill();
}

function paintRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.strokeStyle = COLOR.cyan;
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLOR.cyan;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function paintArrowBack(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.fillStyle = COLOR.bone;
  // Double arrow ⟪
  const w = size * 0.42;
  const h = size * 0.5;
  const x1 = cx + w * 0.4;
  const x2 = cx - w * 0.1;
  drawTriangle(ctx, x1, cy, x1 - w, cy - h / 2, x1 - w, cy + h / 2);
  drawTriangle(ctx, x2, cy, x2 - w, cy - h / 2, x2 - w, cy + h / 2);
}

function paintSwirl(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Spiral approximated by arcs — singularity
  ctx.strokeStyle = COLOR.poisonTrail;
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  const turns = 1.5;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const r = size * 0.35 * (1 - t);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function paintScissors(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Two crossed blades
  ctx.strokeStyle = COLOR.bone;
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.lineCap = 'round';
  const r = size * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
  ctx.moveTo(cx - r, cy + r); ctx.lineTo(cx + r, cy - r);
  ctx.stroke();
  ctx.fillStyle = COLOR.bone;
  ctx.beginPath(); ctx.arc(cx - r * 0.85, cy - r * 0.85, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - r * 0.85, cy + r * 0.85, r * 0.16, 0, Math.PI * 2); ctx.fill();
}

function paintOuroboros(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Circle of snake biting its tail — gold for legendary
  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.32, 0.2, Math.PI * 1.85);
  ctx.stroke();
  // Tiny snake head dot
  ctx.fillStyle = COLOR.gold;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(0.2) * size * 0.32, cy + Math.sin(0.2) * size * 0.32, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function paintClover(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.fillStyle = COLOR.green;
  const r = size * 0.17;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paintAfterimage(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Stacked translucent silhouettes
  const w = size * 0.18;
  const h = size * 0.4;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.4 + i * 0.3;
    ctx.fillStyle = COLOR.green;
    ctx.fillRect(cx - w * 1.5 + i * w * 1.1, cy - h / 2, w, h);
  }
  ctx.globalAlpha = 1;
}

function paintShockwave(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.strokeStyle = COLOR.cyan;
  ctx.lineWidth = Math.max(1, size * 0.07);
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.3 + i * 0.25;
    ctx.beginPath();
    ctx.arc(cx, cy, size * (0.14 + i * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function genericDot(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.fillStyle = COLOR.bone;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}
