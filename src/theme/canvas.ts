// Canvas helpers that consume the tokens (docs/DESIGN_SPEC.md §2.3, §2.4).
// Keeps screen renderers free of stringified font math and shadow bookkeeping.

import { COLOR, CRT, FONT, GLOW, type GlowName } from './tokens';

/**
 * Compose a canvas font string from the display face.
 * Use for titles, menu items, buttons, HUD numbers, card names, labels — anything ALL CAPS.
 */
export function displayFont(sizePx: number): string {
  return `${Math.round(sizePx)}px ${FONT.display}`;
}

/** Compose a canvas font string from the body face (descriptions, helper text). */
export function bodyFont(sizePx: number): string {
  return `${Math.round(sizePx)}px ${FONT.body}`;
}

/** Apply a named glow (sets shadowColor + shadowBlur). Pair with clearGlow() in a save/restore block. */
export function applyGlow(ctx: CanvasRenderingContext2D, glow: GlowName): void {
  const g = GLOW[glow];
  ctx.shadowColor = g.color;
  ctx.shadowBlur = g.blur;
}

/** Reset shadow state. Cheaper than save/restore when you only need the glow off. */
export function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Draw a scaled glow — same color, blur scaled with text size so HUD numbers
 * and 60px titles get proportional bloom.
 */
export function applyScaledGlow(
  ctx: CanvasRenderingContext2D,
  glow: GlowName,
  scale: number,
): void {
  const g = GLOW[glow];
  ctx.shadowColor = g.color;
  ctx.shadowBlur = g.blur * scale;
}

/**
 * Full-screen CRT scanline overlay (§2.4). Costs a fill per frame — gate behind
 * the CRT Effect setting at the call site, not here.
 */
export function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = CRT.scanlineOpacity;
  // 4px repeating row: 2px transparent, 1px dark, 1px transparent.
  // Cache on an offscreen canvas if this becomes a hotspot.
  ctx.fillStyle = CRT.scanlineColor;
  for (let y = 2; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }
  ctx.restore();
}

/**
 * Inset vignette ring — the "bezel" effect that makes the empty bands
 * around the arena read as intentional (§2.4).
 */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.72,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, CRT.vignetteShadow);
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Opaque app background. Use whenever a screen needs to fully cover the canvas. */
export function fillBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, width, height);
}
