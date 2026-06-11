// Power-up selection — docs/DESIGN_SPEC.md §5 (mock: docs/mocks/serpent-surge-design-system.html cards).
//
// Rarity-bordered cards (bone / cyan / gold) with matching glow, pixel
// glyphs in place of the legacy emoji icons. The UNCOMMON tier folds
// into RARE on display per spec ("drops the stray UNCOMMON label").

import { PowerUpDefinition, PowerUpRarity } from '../data/powerups';
import { PowerUpInstance } from '../game/PowerUp';
import {
  applyScaledGlow,
  bodyFont,
  clearGlow,
  COLOR,
  displayFont,
  drawCard,
  drawHeldChip,
  drawRarityChip,
  drawScreenTitle,
  TEXT,
  type Bounds,
  type Rarity,
} from '../theme';
import { drawPowerUpGlyph } from '../rendering/PowerUpGlyphs';

export class PowerUpScreen {
  private offerings: PowerUpDefinition[] = [];
  private cardLayouts: Bounds[] = [];
  private selectedIndex = -1;
  private selectTimer = 0;
  private fadeIn = 0;
  private rerollBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private rerollAvailable = false;

  setOfferings(offerings: PowerUpDefinition[], rerollAvailable = false): void {
    this.offerings = offerings;
    this.selectedIndex = -1;
    this.selectTimer = 0;
    this.fadeIn = 0;
    this.rerollAvailable = rerollAvailable;
  }

  update(dt: number): void {
    if (this.fadeIn < 1) this.fadeIn = Math.min(1, this.fadeIn + dt * 3);
    if (this.selectedIndex >= 0) this.selectTimer += dt;
  }

  isSelectionComplete(): boolean {
    return this.selectedIndex >= 0 && this.selectTimer >= 0.5;
  }

  getSelectedPowerUp(): PowerUpDefinition | null {
    return this.selectedIndex >= 0 ? this.offerings[this.selectedIndex] ?? null : null;
  }

  /** Returns selected card index, -2 for reroll, or -1 for miss. */
  handleClick(x: number, y: number): number {
    if (this.selectedIndex >= 0) return -1;
    if (this.rerollAvailable) {
      const rb = this.rerollBounds;
      if (x >= rb.x && x <= rb.x + rb.width && y >= rb.y && y <= rb.y + rb.height) return -2;
    }
    for (let i = 0; i < this.cardLayouts.length; i++) {
      const c = this.cardLayouts[i]!;
      if (x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height) {
        this.selectedIndex = i;
        this.selectTimer = 0;
        return i;
      }
    }
    return -1;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    heldPowerUps: readonly PowerUpInstance[],
  ): void {
    // Darkened backdrop over gameplay — keeps the snake visible as a hint of
    // context but kills enough contrast that the cards stay legible.
    ctx.save();
    ctx.globalAlpha = 0.97 * this.fadeIn;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    if (this.offerings.length === 0) return;

    const scale = pickScale(canvasWidth);
    ctx.save();
    ctx.globalAlpha = this.fadeIn;

    // ===== Title =====
    drawScreenTitle(ctx, 'CHOOSE POWER-UP', canvasWidth / 2, canvasHeight * 0.12, scale);

    // ===== Cards =====
    const cardCount = this.offerings.length;
    const padding = Math.max(20, canvasWidth * 0.05);
    const gap = 16 * scale;
    const maxCardWidth = 200 * scale;
    const availWidth = canvasWidth - padding * 2;
    const cardWidth = Math.min(maxCardWidth, (availWidth - gap * (cardCount - 1)) / cardCount);
    const cardHeight = cardWidth * 1.4;
    const totalWidth = cardCount * cardWidth + (cardCount - 1) * gap;
    const startX = (canvasWidth - totalWidth) / 2;
    const cardY = canvasHeight * 0.22;

    this.cardLayouts = [];

    for (let i = 0; i < cardCount; i++) {
      const def = this.offerings[i]!;
      const x = startX + i * (cardWidth + gap);
      const rect: Bounds = { x, y: cardY, width: cardWidth, height: cardHeight };
      this.cardLayouts.push(rect);

      const isSelected = this.selectedIndex === i;
      ctx.save();
      if (isSelected) {
        // Zoom + fade out the selected card.
        const cx = x + cardWidth / 2;
        const cy = cardY + cardHeight / 2;
        const zoom = 1 + this.selectTimer * 0.3;
        ctx.translate(cx, cy);
        ctx.scale(zoom, zoom);
        ctx.translate(-cx, -cy);
        ctx.globalAlpha = Math.max(0, 1 - this.selectTimer * 1.5);
      }

      const rarity = displayRarity(def.rarity);
      drawCard(ctx, rect, rarity, scale);

      // Glyph
      const glyphSize = cardWidth * 0.42;
      const glyphCy = cardY + cardHeight * 0.24;
      drawPowerUpGlyph(def.id)(ctx, x + cardWidth / 2, glyphCy, glyphSize);

      // Name
      const nameSize = Math.min(TEXT.cardName * scale, cardWidth / 13);
      ctx.font = displayFont(nameSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.bone;
      clearGlow(ctx);
      const nameY = cardY + cardHeight * 0.5;
      wrapTextLines(ctx, def.name.toUpperCase(), x + cardWidth / 2, nameY, cardWidth - 16 * scale, nameSize + 4 * scale);

      // Rarity chip
      drawRarityChip(ctx, x + cardWidth / 2, cardY + cardHeight * 0.65, rarity, scale);

      // Description
      const descSize = Math.min(17 * scale, cardWidth / 9.5);
      ctx.font = bodyFont(descSize);
      ctx.fillStyle = COLOR.greenDim;
      wrapTextLines(ctx, def.description, x + cardWidth / 2, cardY + cardHeight * 0.74, cardWidth - 16 * scale, descSize + 2 * scale);

      ctx.restore();
    }

    // ===== Reroll =====
    if (this.rerollAvailable && this.selectedIndex < 0) {
      const rerollSize = Math.min(10 * scale, canvasWidth / 38);
      ctx.font = displayFont(rerollSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.gold;
      applyScaledGlow(ctx, 'gold', scale);
      const rerollY = canvasHeight * 0.82;
      const label = '↻ REROLL';
      ctx.fillText(label, canvasWidth / 2, rerollY);
      clearGlow(ctx);
      const w = ctx.measureText(label).width;
      const tapPad = Math.max(20, rerollSize);
      this.rerollBounds = {
        x: canvasWidth / 2 - w / 2 - tapPad,
        y: rerollY - rerollSize - tapPad / 2,
        width: w + tapPad * 2,
        height: rerollSize + tapPad,
      };
    } else {
      this.rerollBounds = { x: 0, y: 0, width: 0, height: 0 };
    }

    // ===== Held chips =====
    if (heldPowerUps.length > 0) {
      const heldLabelSize = Math.min(7 * scale, canvasWidth / 55);
      const heldLabelY = canvasHeight * 0.9;
      ctx.font = displayFont(heldLabelSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.greenDeep;
      clearGlow(ctx);
      ctx.fillText('HELD', canvasWidth / 2, heldLabelY);

      const chipSize = 30 * scale;
      const chipGap = 8 * scale;
      const totalChipWidth = heldPowerUps.length * chipSize + (heldPowerUps.length - 1) * chipGap;
      let cx = (canvasWidth - totalChipWidth) / 2;
      const chipY = heldLabelY + 14 * scale;
      for (const pu of heldPowerUps) {
        drawHeldChip(ctx, cx, chipY, drawPowerUpGlyph(pu.id), pu.stackCount > 1 ? pu.stackCount : null, scale);
        cx += chipSize + chipGap;
      }
    }

    ctx.restore();
  }

  reset(): void {
    this.offerings = [];
    this.cardLayouts = [];
    this.selectedIndex = -1;
    this.selectTimer = 0;
    this.fadeIn = 0;
  }
}

// UNCOMMON internal tier displays as RARE per spec.
function displayRarity(rarity: PowerUpRarity): Rarity {
  switch (rarity) {
    case PowerUpRarity.COMMON:    return 'common';
    case PowerUpRarity.LEGENDARY: return 'legendary';
    case PowerUpRarity.UNCOMMON:
    case PowerUpRarity.RARE:
    default:                       return 'rare';
  }
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, cy);
      line = w;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, cy);
}
