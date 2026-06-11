// How to Play — docs/DESIGN_SPEC.md §5 (mock: docs/mocks/serpent-surge-items.html).
//
// Food and Hazards pages now render the live ItemRenderer glyphs as legend art,
// and hazards carry a DEADLY/NEUTRAL tag so the legend matches the canvas. Text
// pages use the shared chrome — green title, gold subtitle, green-dim body
// (VT323), and the shared green CLOSE / carousel dots.

import { safeAreaInsetTop } from '../rendering/Renderer';
import {
  applyScaledGlow,
  bodyFont,
  clearGlow,
  COLOR,
  displayFont,
  drawCarouselDots,
  drawCloseButton,
  drawHazardTag,
  drawScreenSubtitle,
  drawScreenTitle,
  fillBackground,
  hitTest,
  TEXT,
  type Bounds,
} from '../theme';
import { drawFood, drawHazard } from '../rendering/ItemRenderer';
import { FoodType } from '../game/Food';
import { HazardType } from '../game/Hazard';

const PAGES = [
  { key: 'controls',  subtitle: '' },
  { key: 'food',      subtitle: 'FOOD TYPES' },
  { key: 'hazards',   subtitle: 'HAZARDS' },
  { key: 'waves',     subtitle: 'WAVES & ARENAS' },
  { key: 'powerups',  subtitle: 'POWER-UPS' },
  { key: 'scales',    subtitle: 'SCALES & UNLOCKS' },
] as const;
const TOTAL_PAGES = PAGES.length;

export class HowToPlayScreen {
  private visible = false;
  private currentPage = 0;
  private reducedMotion = false;
  private closeBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private prevBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private nextBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };

  show(): void {
    this.visible = true;
    this.currentPage = 0;
  }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }
  /** Jump to a specific page. Used by the screenshot harness. */
  setPage(index: number): void {
    this.currentPage = Math.max(0, Math.min(TOTAL_PAGES - 1, index));
  }

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    reducedMotion: boolean = false,
  ): void {
    if (!this.visible) return;
    this.reducedMotion = reducedMotion;

    ctx.save();
    fillBackground(ctx, width, height);
    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Shared chrome =====
    const titleY = Math.floor(usableHeight * 0.06);
    drawScreenTitle(ctx, 'HOW TO PLAY', width / 2, titleY, scale);

    const page = PAGES[this.currentPage]!;
    let contentY = titleY + 28 * scale;
    if (page.subtitle) {
      drawScreenSubtitle(ctx, page.subtitle, width / 2, contentY, scale);
      contentY += 28 * scale;
    } else {
      contentY += 16 * scale;
    }

    // ===== Page body =====
    const padding = Math.max(20, width * 0.06);
    const contentWidth = Math.min(380 * scale, width - padding * 2);
    const contentX = (width - contentWidth) / 2;

    switch (page.key) {
      case 'controls': this.drawControls(ctx, contentX, contentY, contentWidth, scale); break;
      case 'food':     this.drawFoodLegend(ctx, contentX, contentY, contentWidth, scale); break;
      case 'hazards':  this.drawHazardsLegend(ctx, contentX, contentY, contentWidth, scale); break;
      case 'waves':    this.drawTextSections(ctx, contentX, contentY, contentWidth, scale, WAVE_SECTIONS); break;
      case 'powerups': this.drawTextSections(ctx, contentX, contentY, contentWidth, scale, POWERUP_SECTIONS); break;
      case 'scales':   this.drawTextSections(ctx, contentX, contentY, contentWidth, scale, SCALES_SECTIONS); break;
    }

    // ===== Prev / Next tap targets (no visible arrow — dots indicate position) =====
    const navArrowSize = 22 * scale;
    const navY = usableHeight / 2;
    if (this.currentPage > 0) {
      drawNavArrow(ctx, padding * 0.5, navY, navArrowSize, 'left', scale);
      this.prevBounds = { x: 0, y: navY - navArrowSize, width: padding * 1.5, height: navArrowSize * 2 };
    } else {
      this.prevBounds = { x: 0, y: 0, width: 0, height: 0 };
    }
    if (this.currentPage < TOTAL_PAGES - 1) {
      drawNavArrow(ctx, width - padding * 0.5, navY, navArrowSize, 'right', scale);
      this.nextBounds = { x: width - padding * 1.5, y: navY - navArrowSize, width: padding * 1.5, height: navArrowSize * 2 };
    } else {
      this.nextBounds = { x: 0, y: 0, width: 0, height: 0 };
    }

    // ===== Dots + CLOSE =====
    const dotsY = usableHeight - Math.max(64, 64 * scale);
    drawCarouselDots(ctx, width / 2, dotsY, TOTAL_PAGES, this.currentPage, scale);

    const closeY = usableHeight - Math.max(36, 36 * scale);
    this.closeBounds = drawCloseButton(ctx, width / 2, closeY, scale);

    ctx.restore();
  }

  // ---- Pages ----

  private drawControls(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, scale: number,
  ): void {
    let cy = y;
    cy = drawHeading(ctx, 'MOBILE', x, cy, scale);
    cy = drawBody(ctx, 'Swipe in any direction to turn. Swipe again to queue your next move.', x, cy, w, scale);
    cy += 14 * scale;

    cy = drawHeading(ctx, 'KEYBOARD', x, cy, scale);
    cy = drawKeyRow(ctx, 'ARROW KEYS / WASD', 'Move', x, cy, scale);
    cy = drawKeyRow(ctx, 'ENTER / TAP', 'Start game', x, cy, scale);
    cy = drawKeyRow(ctx, 'ESC', 'Pause · Back', x, cy, scale);
    cy += 14 * scale;

    cy = drawHeading(ctx, 'GOAL', x, cy, scale);
    drawBody(ctx, 'Eat food, clear waves, avoid walls and your own tail. Survive as long as you can.', x, cy, w, scale);
  }

  private drawFoodLegend(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, scale: number,
  ): void {
    const items: { type: FoodType; name: string; effect: string; desc: string }[] = [
      { type: FoodType.APPLE,         name: 'APPLE',        effect: '+10 PTS · +1 LENGTH',     desc: 'Basic food. Eat to grow and score.' },
      { type: FoodType.GOLDEN_APPLE,  name: 'GOLDEN APPLE', effect: '+50 PTS · +1 LENGTH',     desc: 'Rare and valuable. Pulsing gold glow.' },
      { type: FoodType.SHRINK_PELLET, name: 'SHRINK PELLET',effect: '+25 PTS · −2 LENGTH',     desc: 'Makes you shorter. Great for tight spaces.' },
      { type: FoodType.SPEED_FRUIT,   name: 'SPEED FRUIT',  effect: '+15 PTS · 1.5× SPEED',    desc: 'Temporary speed boost for 3 seconds.' },
      { type: FoodType.BOMB_FRUIT,    name: 'BOMB FRUIT',   effect: '+30 PTS · CLEARS HAZARDS',desc: 'Destroys hazards in a 3×3 area.' },
    ];

    let cy = y;
    const now = this.reducedMotion ? 0 : performance.now();
    for (const item of items) {
      cy = drawItemRow(ctx, cy, x, w, scale, (gx, gy, size) => {
        drawFood(ctx, item.type, gx + size / 2, gy + size / 2, size, now);
      }, item.name, item.effect, item.desc);
    }
  }

  private drawHazardsLegend(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, scale: number,
  ): void {
    const items: { type: HazardType; name: string; tag: 'deadly' | 'neutral'; desc: string }[] = [
      { type: HazardType.WALL_BLOCK,   name: 'WALL BLOCK',   tag: 'deadly',  desc: 'Static obstacle. Destroyed by Bomb Fruit or Head Bash.' },
      { type: HazardType.SPIKE_TRAP,   name: 'SPIKE TRAP',   tag: 'deadly',  desc: 'Toggles every few ticks. Safe when retracted, deadly when red.' },
      { type: HazardType.POISON_TRAIL, name: 'POISON TRAIL', tag: 'deadly',  desc: 'Fades after 8 ticks. Avoid the purple glow until it clears.' },
      { type: HazardType.WARP_HOLE,    name: 'WARP HOLE',    tag: 'neutral', desc: 'Comes in pairs. Enter one, exit the other. Disorienting, not deadly.' },
      { type: HazardType.MAGNET,       name: 'MAGNET',       tag: 'neutral', desc: 'Pulls nearby food toward it each tick. Plan your route.' },
    ];

    let cy = y;
    const now = this.reducedMotion ? 0 : performance.now();
    for (const item of items) {
      cy = drawItemRow(ctx, cy, x, w, scale, (gx, gy, size) => {
        drawHazard(ctx, item.type, 'active', null, gx + size / 2, gy + size / 2, size, now);
      }, item.name, '', item.desc, item.tag);
    }
  }

  private drawTextSections(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, scale: number,
    sections: readonly [string, string][],
  ): void {
    let cy = y;
    for (const [heading, body] of sections) {
      cy = drawHeading(ctx, heading, x, cy, scale);
      cy = drawBody(ctx, body, x, cy, w, scale);
      cy += 12 * scale;
    }
  }

  handleClick(x: number, rawY: number): 'close' | null {
    if (!this.visible) return null;
    const y = rawY - safeAreaInsetTop;
    if (hitTest(this.closeBounds, x, y)) return 'close';
    if (this.prevBounds.width > 0 && hitTest(this.prevBounds, x, y)) {
      this.currentPage = Math.max(0, this.currentPage - 1);
      return null;
    }
    if (this.nextBounds.width > 0 && hitTest(this.nextBounds, x, y)) {
      this.currentPage = Math.min(TOTAL_PAGES - 1, this.currentPage + 1);
      return null;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}

function drawHeading(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
): number {
  const size = Math.min(11 * scale, Math.floor(ctx.canvas.width / 32));
  ctx.save();
  ctx.font = displayFont(size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR.green;
  applyScaledGlow(ctx, 'greenS', scale);
  ctx.fillText(text, x, y);
  clearGlow(ctx);
  ctx.restore();
  return y + size + 10 * scale;
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  scale: number,
): number {
  const size = Math.min(18 * scale, Math.floor(ctx.canvas.width / 24));
  const lineHeight = size + 4 * scale;
  ctx.save();
  ctx.font = bodyFont(size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR.greenDim;
  clearGlow(ctx);
  const lines = wrapText(ctx, text, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, x, y + i * lineHeight);
  }
  ctx.restore();
  return y + lines.length * lineHeight;
}

function drawKeyRow(
  ctx: CanvasRenderingContext2D,
  key: string,
  desc: string,
  x: number,
  y: number,
  scale: number,
): number {
  const keySize = Math.min(9 * scale, Math.floor(ctx.canvas.width / 38));
  const descSize = Math.min(17 * scale, Math.floor(ctx.canvas.width / 26));
  ctx.save();
  ctx.font = displayFont(keySize);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR.gold;
  clearGlow(ctx);
  ctx.fillText(key, x, y);

  ctx.font = bodyFont(descSize);
  ctx.fillStyle = COLOR.greenDim;
  ctx.fillText(desc, x + 14 * scale, y + keySize + 4 * scale);
  ctx.restore();
  return y + keySize + descSize + 14 * scale;
}

function drawItemRow(
  ctx: CanvasRenderingContext2D,
  y: number,
  x: number,
  maxWidth: number,
  scale: number,
  paintGlyph: (gx: number, gy: number, size: number) => void,
  name: string,
  effect: string,
  desc: string,
  tag?: 'deadly' | 'neutral',
): number {
  const glyphSize = Math.max(36, 42 * scale);
  const gap = 14 * scale;
  const textX = x + glyphSize + gap;
  const textW = maxWidth - glyphSize - gap;

  paintGlyph(x, y, glyphSize);

  // Name
  const nameSize = Math.min(TEXT.menuItem * scale, Math.floor(ctx.canvas.width / 30));
  ctx.save();
  ctx.font = displayFont(nameSize);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR.bone;
  clearGlow(ctx);
  ctx.fillText(name, textX, y);

  let tagWidth = 0;
  if (tag) {
    const nameMetrics = ctx.measureText(name);
    const tagX = textX + nameMetrics.width + 10 * scale;
    const tagBounds = drawHazardTag(ctx, tagX, y - 2 * scale, tag, scale);
    tagWidth = tagBounds.width + 10 * scale;
    void tagWidth;
  }

  let cy = y + nameSize + 6 * scale;
  if (effect) {
    const effectSize = Math.min(17 * scale, Math.floor(ctx.canvas.width / 25));
    ctx.font = bodyFont(effectSize);
    ctx.fillStyle = COLOR.gold;
    ctx.fillText(effect, textX, cy);
    cy += effectSize + 2 * scale;
  }
  const descSize = Math.min(17 * scale, Math.floor(ctx.canvas.width / 25));
  ctx.font = bodyFont(descSize);
  ctx.fillStyle = COLOR.greenDim;
  const lines = wrapText(ctx, desc, textW);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, textX, cy + i * (descSize + 2 * scale));
  }
  cy += lines.length * (descSize + 2 * scale);
  ctx.restore();

  return Math.max(cy, y + glyphSize) + 16 * scale;
}

function drawNavArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  dir: 'left' | 'right',
  _scale: number,
): void {
  ctx.save();
  ctx.fillStyle = COLOR.greenDeep;
  ctx.beginPath();
  if (dir === 'left') {
    ctx.moveTo(cx - size * 0.4, cy);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.2, cy + size * 0.5);
  } else {
    ctx.moveTo(cx + size * 0.4, cy);
    ctx.lineTo(cx - size * 0.2, cy - size * 0.5);
    ctx.lineTo(cx - size * 0.2, cy + size * 0.5);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const WAVE_SECTIONS: readonly [string, string][] = [
  ['ARENAS', 'Each run is a series of arenas. Clear all 3 waves in an arena to advance.'],
  ['WAVES', 'Each wave has a food quota. Eat enough food to clear it. Quotas grow: 5, 7, 9.'],
  ['DIFFICULTY', 'Hazards appear from wave 2 onward. The snake also speeds up each wave.'],
  ['BOSSES', 'Every 5th arena features a boss with unique attack patterns. Defeat them for bonus Scales.'],
  ['BETWEEN ARENAS', 'After clearing an arena, choose 1 of 3 power-ups to carry forward.'],
];

const POWERUP_SECTIONS: readonly [string, string][] = [
  ['SELECTION', 'After each arena, pick 1 of 3 random power-ups. They stack across arenas within a run.'],
  ['RARITY', 'Three tiers: Common (bone), Rare (cyan), Legendary (gold). Higher rarity = stronger effects.'],
  ['STACKING', 'Picking the same power-up again makes it stronger. Some pairs unlock hidden synergies.'],
  ['SYNERGIES', 'Certain combinations unlock secret bonus effects. Experiment to discover them.'],
  ['REROLL', 'Unlock Reroll in the Collection to get a fresh set of choices when you need one.'],
];

const SCALES_SECTIONS: readonly [string, string][] = [
  ['SCALES', 'Scales are the meta currency earned after each run, based on score, arenas, and food eaten.'],
  ['UNLOCKS', 'Spend Scales in the Collection to unlock permanent upgrades that carry across runs.'],
  ['UPGRADES', 'Starting Length 4, Reroll, Arena Preview, Extra Life, and Endless Mode are all unlockable.'],
  ['SKINS', 'Unlock cosmetic snake skins to customize your look. Pure style, no gameplay change.'],
  ['DAILY CHALLENGE', 'A seeded daily run — same layout for everyone. Compete on the daily leaderboard.'],
];
