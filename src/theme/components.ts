// Shared canvas components — docs/DESIGN_SPEC.md §3.
// One title, one CLOSE, one button, one toggle, one slider, one card — reused everywhere.
//
// Every function pre-saves and post-restores ctx, so callers don't need to.
// Interactive components return their hit bounds. Non-interactive ones return void.

import { COLOR, LETTER_SPACING, TEXT } from './tokens';
import { applyScaledGlow, clearGlow, displayFont } from './canvas';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ButtonOptions {
  scale?: number;
  disabled?: boolean;
}

export type Rarity = 'common' | 'rare' | 'legendary';
export type HazardKind = 'deadly' | 'neutral';
export type GlyphDraw = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
) => void;

// ---------------------------------------------------------------------------
// Hit-testing helper
// ---------------------------------------------------------------------------

export function hitTest(bounds: Bounds, x: number, y: number): boolean {
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

// ---------------------------------------------------------------------------
// Screen title + subtitle
// ---------------------------------------------------------------------------

/** Centered green title with glow. Same treatment on every modal. */
export function drawScreenTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  scale: number = 1,
): void {
  ctx.save();
  ctx.font = displayFont(TEXT.screenTitle * scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR.green;
  applyScaledGlow(ctx, 'green', scale);
  drawSpacedText(ctx, text, cx, y, LETTER_SPACING.title * scale);
  ctx.restore();
}

/** Optional gold subtitle ("FOOD TYPES"). */
export function drawScreenSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  scale: number = 1,
): void {
  ctx.save();
  ctx.font = displayFont(TEXT.sectionLabel * scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR.gold;
  applyScaledGlow(ctx, 'gold', scale);
  drawSpacedText(ctx, text, cx, y, LETTER_SPACING.title * scale);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// CLOSE — green-dim, bottom-center, NEVER coral (§3)
// ---------------------------------------------------------------------------

export function drawCloseButton(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  scale: number = 1,
): Bounds {
  const size = TEXT.closeButton * scale;
  const label = 'CLOSE';
  const arrowSize = size * 0.6;
  const arrowGap = size * 0.7;

  ctx.save();
  ctx.font = displayFont(size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR.greenDim;
  clearGlow(ctx);

  const textWidth = measureSpacedText(ctx, label, LETTER_SPACING.title * scale);
  const totalWidth = arrowSize + arrowGap + textWidth;
  const startX = cx - totalWidth / 2;

  // Triangle arrow — drawn as a path so it sits exactly on the text's vertical middle
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(startX + arrowSize, y - arrowSize * 0.55);
  ctx.lineTo(startX + arrowSize, y + arrowSize * 0.55);
  ctx.closePath();
  ctx.fill();

  drawSpacedText(
    ctx,
    label,
    startX + arrowSize + arrowGap,
    y,
    LETTER_SPACING.title * scale,
  );
  ctx.restore();

  const tapPad = Math.max(20, size * 1.5);
  return {
    x: cx - totalWidth / 2 - tapPad,
    y: y - size - tapPad / 2,
    width: totalWidth + tapPad * 2,
    height: size + tapPad,
  };
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

/** Primary CTA — filled green, dark text, green glow. */
export function drawPrimaryButton(
  ctx: CanvasRenderingContext2D,
  rect: Bounds,
  label: string,
  opts: ButtonOptions = {},
): Bounds {
  const { scale = 1, disabled = false } = opts;
  ctx.save();
  applyScaledGlow(ctx, disabled ? 'none' : 'green', scale);
  ctx.fillStyle = disabled ? COLOR.greenDeep : COLOR.green;
  roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 9 * scale);
  ctx.fill();
  clearGlow(ctx);
  ctx.font = displayFont(TEXT.button * scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = disabled ? COLOR.bg : COLOR.primaryButtonText;
  drawSpacedText(
    ctx,
    label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    LETTER_SPACING.label * scale,
  );
  ctx.restore();
  return rect;
}

/** Secondary — transparent, bone text, line border. */
export function drawSecondaryButton(
  ctx: CanvasRenderingContext2D,
  rect: Bounds,
  label: string,
  opts: ButtonOptions = {},
): Bounds {
  const { scale = 1, disabled = false } = opts;
  ctx.save();
  clearGlow(ctx);
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 9 * scale);
  ctx.stroke();
  ctx.font = displayFont(TEXT.button * scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = disabled ? COLOR.greenDeep : COLOR.bone;
  drawSpacedText(
    ctx,
    label,
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    LETTER_SPACING.label * scale,
  );
  ctx.restore();
  return rect;
}

// ---------------------------------------------------------------------------
// Toggle — pill 46×22 at scale 1
// ---------------------------------------------------------------------------

export function drawToggle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  on: boolean,
  scale: number = 1,
): Bounds {
  const w = 46 * scale;
  const h = 22 * scale;
  const knobSize = 17 * scale;
  const knobInset = 2 * scale;
  const radius = h / 2;

  ctx.save();
  clearGlow(ctx);
  roundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = on ? 'rgba(54,248,122,0.25)' : 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.strokeStyle = on ? COLOR.green : COLOR.greenDeep;
  ctx.lineWidth = 1;
  ctx.stroke();

  const knobY = y + (h - knobSize) / 2;
  const knobX = on ? x + w - knobSize - knobInset : x + knobInset;
  if (on) applyScaledGlow(ctx, 'greenS', scale);
  ctx.fillStyle = on ? COLOR.green : COLOR.greenDeep;
  ctx.beginPath();
  ctx.arc(knobX + knobSize / 2, knobY + knobSize / 2, knobSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return { x, y, width: w, height: h };
}

// ---------------------------------------------------------------------------
// Slider — track + green fill + green value
// ---------------------------------------------------------------------------

export function drawSlider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  totalWidth: number,
  value: number, // 0..100
  scale: number = 1,
): Bounds {
  const valueLabelWidth = 26 * scale;
  const gap = 8 * scale;
  const trackHeight = 6 * scale;
  const trackWidth = totalWidth - valueLabelWidth - gap;
  const trackY = y - trackHeight / 2;

  ctx.save();
  clearGlow(ctx);
  roundedRect(ctx, x, trackY, trackWidth, trackHeight, trackHeight / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  const clamped = Math.max(0, Math.min(100, value));
  const fillWidth = (trackWidth * clamped) / 100;
  if (fillWidth > 0) {
    applyScaledGlow(ctx, 'greenS', scale);
    roundedRect(ctx, x, trackY, fillWidth, trackHeight, trackHeight / 2);
    ctx.fillStyle = COLOR.green;
    ctx.fill();
    clearGlow(ctx);
  }

  ctx.font = displayFont(TEXT.cardName * scale);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLOR.green;
  ctx.fillText(`${Math.round(clamped)}`, x + totalWidth, y);
  ctx.restore();

  const tapHeight = Math.max(36, trackHeight * 6);
  return { x, y: y - tapHeight / 2, width: trackWidth, height: tapHeight };
}

// ---------------------------------------------------------------------------
// Card — 2px rarity border on surface bg
// ---------------------------------------------------------------------------

export function drawCard(
  ctx: CanvasRenderingContext2D,
  rect: Bounds,
  rarity: Rarity,
  scale: number = 1,
): void {
  const radius = 11 * scale;
  const borderColor = rarityColor(rarity);
  ctx.save();
  roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fillStyle = '#0a0f0b';
  ctx.fill();
  applyScaledGlow(ctx, rarityGlow(rarity), scale);
  ctx.lineWidth = 2;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();
}

export function rarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'common':    return COLOR.bone;
    case 'rare':      return COLOR.cyan;
    case 'legendary': return COLOR.gold;
  }
}

function rarityGlow(rarity: Rarity): 'bone' | 'cyan' | 'gold' {
  return rarity === 'common' ? 'bone' : rarity === 'rare' ? 'cyan' : 'gold';
}

// ---------------------------------------------------------------------------
// Rarity chip / hazard tag — small ALL-CAPS labels with colored outline
// ---------------------------------------------------------------------------

export function drawRarityChip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  rarity: Rarity,
  scale: number = 1,
): void {
  const label = rarity.toUpperCase();
  ctx.save();
  ctx.font = displayFont(TEXT.rarityChip * scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rarityColor(rarity);
  clearGlow(ctx);
  drawSpacedText(ctx, label, cx, y, LETTER_SPACING.tag * scale);
  ctx.restore();
}

export function drawHazardTag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: HazardKind,
  scale: number = 1,
): Bounds {
  const label = kind.toUpperCase();
  const size = TEXT.hazardTag * scale;
  const padX = 5 * scale;
  const padY = 3 * scale;
  ctx.save();
  ctx.font = displayFont(size);
  ctx.textBaseline = 'middle';
  const textWidth = measureSpacedText(ctx, label, LETTER_SPACING.tag * scale);
  const boxWidth = textWidth + padX * 2;
  const boxHeight = size + padY * 2;
  const color = kind === 'deadly' ? COLOR.coral : COLOR.cyan;
  roundedRect(ctx, x, y, boxWidth, boxHeight, 3 * scale);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  drawSpacedText(ctx, label, x + padX, y + boxHeight / 2, LETTER_SPACING.tag * scale);
  ctx.restore();
  return { x, y, width: boxWidth, height: boxHeight };
}

// ---------------------------------------------------------------------------
// Carousel dots — page indicator
// ---------------------------------------------------------------------------

export function drawCarouselDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  count: number,
  activeIndex: number,
  scale: number = 1,
): void {
  const dot = 7 * scale;
  const gap = 8 * scale;
  const totalWidth = count * dot + (count - 1) * gap;
  let x = cx - totalWidth / 2 + dot / 2;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const isActive = i === activeIndex;
    if (isActive) applyScaledGlow(ctx, 'greenS', scale);
    else clearGlow(ctx);
    ctx.fillStyle = isActive ? COLOR.green : COLOR.greenDeep;
    ctx.beginPath();
    ctx.arc(x, y, dot / 2, 0, Math.PI * 2);
    ctx.fill();
    x += dot + gap;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Held power-up chip — 30×30 bordered tile + caller-drawn pixel glyph
// ---------------------------------------------------------------------------

export function drawHeldChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  drawGlyph: GlyphDraw,
  count: number | null = null,
  scale: number = 1,
): Bounds {
  const size = 30 * scale;
  ctx.save();
  roundedRect(ctx, x, y, size, size, 7 * scale);
  ctx.fillStyle = '#0a0f0b';
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Glyph inset by ~5px
  const glyphSize = size - 10 * scale;
  drawGlyph(ctx, x + size / 2, y + size / 2, glyphSize);

  if (count !== null && count > 1) {
    const badgeFont = TEXT.rarityChip * scale;
    ctx.font = displayFont(badgeFont);
    ctx.textBaseline = 'middle';
    const text = `${count}`;
    const textW = ctx.measureText(text).width;
    const padX = 3 * scale;
    const padY = 2 * scale;
    const bw = textW + padX * 2;
    const bh = badgeFont + padY * 2;
    const bx = x + size - bw + 4 * scale;
    const by = y + size - bh + 4 * scale;
    clearGlow(ctx);
    roundedRect(ctx, bx, by, bw, bh, 3 * scale);
    ctx.fillStyle = COLOR.gold;
    ctx.fill();
    ctx.fillStyle = COLOR.bg;
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + bw / 2, by + bh / 2);
  }
  ctx.restore();

  return { x, y, width: size, height: size };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Draw text with manual letter-spacing (canvas has no native letter-spacing pre-2024 widely). */
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  letterSpacing: number,
): number {
  if (letterSpacing <= 0.01) {
    ctx.fillText(text, cx, y);
    return ctx.measureText(text).width;
  }
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth =
    widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
  const align = ctx.textAlign;
  let cursor: number;
  if (align === 'center') cursor = cx - totalWidth / 2;
  else if (align === 'right') cursor = cx - totalWidth;
  else cursor = cx;
  ctx.save();
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i]!, cursor, y);
    cursor += widths[i]! + letterSpacing;
  }
  ctx.restore();
  return totalWidth;
}

function measureSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  if (letterSpacing <= 0.01) return ctx.measureText(text).width;
  const chars = [...text];
  return (
    chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) +
    letterSpacing * (chars.length - 1)
  );
}

function roundedRect(
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
