// Collection screen — docs/DESIGN_SPEC.md §5 (mock: docs/mocks/serpent-surge-screens.html).
//
// Gold Scales balance, full unlock list with state borders
// (OWNED green / affordable gold + cost / locked dim + cost), a Snake Skins
// shelf showing the selected skin, and the shared green CLOSE.

import { safeAreaInsetTop } from '../rendering/Renderer';
import {
  applyScaledGlow,
  bodyFont,
  clearGlow,
  COLOR,
  displayFont,
  drawCloseButton,
  drawScreenTitle,
  fillBackground,
  hitTest,
  TEXT,
  type Bounds,
} from '../theme';
import { getUnlockStatus, ProgressionData, purchaseUnlock } from '../meta/Progression';
import { SKIN_DEFS } from '../data/skins';

export class CollectionScreen {
  private visible = false;
  private closeBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private unlockBounds: { id: string; bounds: Bounds }[] = [];

  show(): void {
    this.visible = true;
  }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: ProgressionData,
    selectedSkin: string = 'default',
  ): void {
    if (!this.visible) return;

    ctx.save();
    fillBackground(ctx, width, height);
    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Title + Scales balance =====
    const titleY = Math.floor(usableHeight * 0.06);
    drawScreenTitle(ctx, 'COLLECTION', width / 2, titleY, scale);

    // ◆ N SCALES (gold, glow)
    const balanceSize = Math.min(13 * scale, Math.floor(width / 28));
    const balanceY = titleY + 28 * scale;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = displayFont(balanceSize);
    applyScaledGlow(ctx, 'gold', scale);
    ctx.fillStyle = COLOR.gold;
    ctx.fillText(`◆ ${data.totalScales} SCALES`, width / 2, balanceY);
    clearGlow(ctx);
    ctx.restore();

    // ===== Unlock list =====
    const padding = Math.max(20, width * 0.06);
    const listWidth = Math.min(360 * scale, width - padding * 2);
    const listX = (width - listWidth) / 2;

    const unlocks = getUnlockStatus(data);
    const rowHeight = Math.max(56, 60 * scale);
    const rowGap = 8 * scale;
    let cursorY = balanceY + 32 * scale;

    this.unlockBounds = [];

    for (const u of unlocks) {
      const y = cursorY;
      const state: UnlockState = u.owned ? 'owned' : u.affordable ? 'buy' : 'lock';
      this.drawUnlockRow(ctx, u.name, u.description, u.cost, state, listX, y, listWidth, rowHeight, scale);
      this.unlockBounds.push({ id: u.id, bounds: { x: listX, y, width: listWidth, height: rowHeight } });
      cursorY += rowHeight + rowGap;
    }

    // ===== Snake Skins shelf =====
    const shelfLabelSize = Math.min(8 * scale, Math.floor(width / 50));
    const shelfLabelY = cursorY + 18 * scale;
    ctx.save();
    ctx.font = displayFont(shelfLabelSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
    ctx.fillText('SNAKE SKINS', listX, shelfLabelY);
    ctx.restore();

    const swatchSize = Math.max(28, 30 * scale);
    const swatchGap = 8 * scale;
    const swatchY = shelfLabelY + 16 * scale;
    const visibleSkins = SKIN_DEFS.slice(0, 6);
    let swatchX = listX;
    for (const skin of visibleSkins) {
      this.drawSkinSwatch(ctx, swatchX, swatchY, swatchSize, skin.bodyColor, skin.id === selectedSkin, scale);
      swatchX += swatchSize + swatchGap;
    }
    // Dashed placeholder for "more to come"
    this.drawSkinPlaceholder(ctx, swatchX, swatchY, swatchSize, scale);

    // ===== Helper text + CLOSE =====
    const helperSize = Math.min(8 * scale, Math.floor(width / 50));
    ctx.save();
    ctx.font = bodyFont(helperSize + 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
    const helperY = usableHeight - Math.max(64, 64 * scale);
    ctx.fillText('TAP AN ITEM TO SPEND SCALES', width / 2, helperY);
    ctx.restore();

    const closeY = usableHeight - Math.max(36, 36 * scale);
    this.closeBounds = drawCloseButton(ctx, width / 2, closeY, scale);

    ctx.restore();
  }

  private drawUnlockRow(
    ctx: CanvasRenderingContext2D,
    name: string,
    description: string,
    cost: number,
    state: UnlockState,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number,
  ): void {
    const border = state === 'owned' ? COLOR.green
                 : state === 'buy'   ? COLOR.gold
                                     : COLOR.line;
    const opacity = state === 'lock' ? 0.72 : 1;
    const radius = 9 * scale;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Card surface
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.fillStyle = '#0a0f0b';
    ctx.fill();

    // State border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = border;
    ctx.stroke();

    // Name (left)
    const nameSize = Math.min(TEXT.cardName * scale, Math.floor(width / 32));
    ctx.font = displayFont(nameSize);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLOR.bone;
    clearGlow(ctx);
    const padX = 14 * scale;
    const padY = 12 * scale;
    ctx.fillText(name.toUpperCase(), x + padX, y + padY);

    // Description below
    const descSize = Math.min(15 * scale, Math.floor(width / 28));
    ctx.font = bodyFont(descSize);
    ctx.fillStyle = COLOR.greenDim;
    ctx.fillText(description, x + padX, y + padY + nameSize + 6 * scale);

    // Right-side state label
    const stateLabel = state === 'owned' ? 'OWNED' : `${cost} ◆`;
    const stateSize = Math.min(8 * scale, Math.floor(width / 38));
    ctx.font = displayFont(stateSize);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state === 'owned' ? COLOR.green
                 : state === 'buy'   ? COLOR.gold
                                     : COLOR.greenDeep;
    ctx.fillText(stateLabel, x + width - padX, y + height / 2);

    ctx.restore();
  }

  private drawSkinSwatch(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number,
    color: string, selected: boolean, scale: number,
  ): void {
    ctx.save();
    const radius = 6 * scale;
    roundedRectPath(ctx, x, y, size, size, radius);
    ctx.fillStyle = color;
    if (selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 * scale;
    }
    ctx.fill();
    if (selected) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = COLOR.bone;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = COLOR.line;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSkinPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number, scale: number,
  ): void {
    ctx.save();
    ctx.strokeStyle = COLOR.greenDeep;
    ctx.lineWidth = 1;
    ctx.setLineDash([3 * scale, 3 * scale]);
    const radius = 6 * scale;
    roundedRectPath(ctx, x, y, size, size, radius);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLOR.greenDeep;
    ctx.font = displayFont(size * 0.4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x + size / 2, y + size / 2);
    ctx.restore();
  }

  /** Returns unlock ID if a purchasable card was tapped, 'back' for close, null otherwise. */
  handleClick(
    x: number, rawY: number,
    _width: number, _height: number,
    data: ProgressionData,
  ): string | null {
    if (!this.visible) return null;
    const y = rawY - safeAreaInsetTop;
    if (hitTest(this.closeBounds, x, y)) return 'back';

    const unlocks = getUnlockStatus(data);
    for (const entry of this.unlockBounds) {
      if (hitTest(entry.bounds, x, y)) {
        const u = unlocks.find(uu => uu.id === entry.id);
        if (u && !u.owned && u.affordable) return entry.id;
        return null;
      }
    }
    return null;
  }

  tryPurchase(data: ProgressionData, unlockId: string): ProgressionData | null {
    return purchaseUnlock(data, unlockId);
  }

  reset(): void {
    // No persistent scroll state needed in the current layout.
  }
}

type UnlockState = 'owned' | 'buy' | 'lock';

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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
