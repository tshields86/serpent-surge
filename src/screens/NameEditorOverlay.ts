// Enlarged name editor — a shared overlay opened from Settings and the leaderboard
// consent prompt. The inline per-letter cycler on those screens used tiny,
// invisible tap-top/tap-bottom targets that were genuinely hard to hit; this
// blows the cycler up to full screen with explicit ▲/▼ buttons per letter.
//
// It sits on TOP of an already-opaque screen (Settings or Consent), so a
// translucent gradient backdrop is safe here — there's no title menu to bleed
// through. The overlay owns a working copy of the name and commits it back to
// the caller on DONE.

import { safeAreaInsetTop } from '../rendering/Renderer';
import {
  applyScaledGlow,
  bodyFont,
  clearGlow,
  COLOR,
  displayFont,
  drawPrimaryButton,
  drawScreenTitle,
  drawSecondaryButton,
  hitTest,
  type Bounds,
} from '../theme';

export const NAME_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('');
export const MAX_NAME_LENGTH = 10;
const MIN_NAME_LENGTH = 1;

const EMPTY: Bounds = { x: 0, y: 0, width: 0, height: 0 };

export type NameEditorResult = 'changed' | 'done' | false;

export class NameEditorOverlay {
  private visible = false;
  private name = 'AAA';
  private upBounds: Bounds[] = [];
  private downBounds: Bounds[] = [];
  private addBounds: Bounds = EMPTY;
  private delBounds: Bounds = EMPTY;
  private doneBounds: Bounds = EMPTY;

  show(name: string): void {
    const clean = (name ?? '').toUpperCase().split('').filter((c) => NAME_CHARS.includes(c));
    this.name = clean.length ? clean.slice(0, MAX_NAME_LENGTH).join('') : 'A';
    this.visible = true;
  }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }
  getName(): string { return this.name; }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.visible) return;

    ctx.save();

    // Translucent gradient backdrop — lets the underlying (opaque) screen show
    // faintly so the overlay reads as a focused modal, not a new screen.
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(4,7,5,0.84)');
    grad.addColorStop(0.5, 'rgba(7,11,8,0.93)');
    grad.addColorStop(1, 'rgba(4,7,5,0.84)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Title + hint =====
    const titleY = Math.floor(usableHeight * 0.14);
    drawScreenTitle(ctx, 'EDIT NAME', width / 2, titleY, scale);

    const hintSize = Math.min(18 * scale, Math.floor(width / 24));
    ctx.save();
    ctx.font = bodyFont(hintSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.greenDim;
    clearGlow(ctx);
    ctx.fillText('Tap the arrows to change each letter', width / 2, titleY + 30 * scale);
    ctx.restore();

    // ===== Letter columns =====
    const count = this.name.length;
    const gap = 10 * scale;
    const margin = 24 * scale;
    const maxColW = 56 * scale;
    const colW = Math.min(maxColW, (width - margin * 2 - gap * (count - 1)) / count);
    const totalW = colW * count + gap * (count - 1);
    const startX = (width - totalW) / 2;

    const arrowH = Math.min(64 * scale, colW * 1.15);
    const glyphGap = 12 * scale;
    const glyphZone = Math.max(44 * scale, colW * 0.9);
    const blockH = arrowH * 2 + glyphGap * 2 + glyphZone;
    const blockTop = usableHeight * 0.44 - blockH / 2;
    const glyphCenterY = blockTop + arrowH + glyphGap + glyphZone / 2;
    const glyphSize = Math.min(glyphZone * 0.7, colW * 0.62);

    this.upBounds = [];
    this.downBounds = [];
    for (let i = 0; i < count; i++) {
      const colX = startX + i * (colW + gap);
      const centerX = colX + colW / 2;

      const up: Bounds = { x: colX, y: blockTop, width: colW, height: arrowH };
      const down: Bounds = { x: colX, y: blockTop + blockH - arrowH, width: colW, height: arrowH };
      this.upBounds.push(up);
      this.downBounds.push(down);

      drawArrowButton(ctx, up, 'up', scale);
      drawArrowButton(ctx, down, 'down', scale);

      // Glyph
      ctx.save();
      ctx.font = displayFont(glyphSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.gold;
      applyScaledGlow(ctx, 'gold', scale);
      ctx.fillText(this.name[i]!, centerX, glyphCenterY);
      ctx.restore();
    }

    // ===== Add / remove letter controls =====
    const ctrlW = Math.min(150 * scale, (width - margin * 2 - 16 * scale) / 2);
    const ctrlH = Math.max(46, 46 * scale);
    const ctrlGap = 16 * scale;
    const ctrlTotal = ctrlW * 2 + ctrlGap;
    const ctrlX = (width - ctrlTotal) / 2;
    const ctrlY = blockTop + blockH + 28 * scale;

    const canDel = count > MIN_NAME_LENGTH;
    const canAdd = count < MAX_NAME_LENGTH;
    const delRect: Bounds = { x: ctrlX, y: ctrlY, width: ctrlW, height: ctrlH };
    const addRect: Bounds = { x: ctrlX + ctrlW + ctrlGap, y: ctrlY, width: ctrlW, height: ctrlH };
    drawSecondaryButton(ctx, delRect, '– LETTER', { scale, disabled: !canDel });
    drawSecondaryButton(ctx, addRect, '+ LETTER', { scale, disabled: !canAdd });
    this.delBounds = canDel ? delRect : EMPTY;
    this.addBounds = canAdd ? addRect : EMPTY;

    // ===== DONE =====
    const btnW = Math.min(300 * scale, width - 48);
    const btnH = Math.max(48, 52 * scale);
    const doneY = usableHeight - btnH - 26 * scale;
    this.doneBounds = drawPrimaryButton(
      ctx,
      { x: (width - btnW) / 2, y: doneY, width: btnW, height: btnH },
      'DONE',
      { scale },
    );

    ctx.restore();
  }

  /** Returns 'changed' on an edit, 'done' to commit + close, false on a miss. */
  handleClick(x: number, rawY: number, _width: number): NameEditorResult {
    if (!this.visible) return false;
    const y = rawY - safeAreaInsetTop;

    if (hitTest(this.doneBounds, x, y)) return 'done';

    if (this.addBounds.width > 0 && hitTest(this.addBounds, x, y)) {
      if (this.name.length < MAX_NAME_LENGTH) this.name += 'A';
      return 'changed';
    }
    if (this.delBounds.width > 0 && hitTest(this.delBounds, x, y)) {
      if (this.name.length > MIN_NAME_LENGTH) this.name = this.name.slice(0, -1);
      return 'changed';
    }

    for (let i = 0; i < this.name.length; i++) {
      if (this.upBounds[i] && hitTest(this.upBounds[i]!, x, y)) {
        this.cycle(i, +1);
        return 'changed';
      }
      if (this.downBounds[i] && hitTest(this.downBounds[i]!, x, y)) {
        this.cycle(i, -1);
        return 'changed';
      }
    }
    return false;
  }

  private cycle(i: number, dir: number): void {
    const ch = this.name[i]!;
    const idx = NAME_CHARS.indexOf(ch.toUpperCase());
    const next = (idx + dir + NAME_CHARS.length) % NAME_CHARS.length;
    this.name = this.name.substring(0, i) + NAME_CHARS[next]! + this.name.substring(i + 1);
  }
}

/** Bordered rounded button with a green triangle pointing up or down. */
function drawArrowButton(
  ctx: CanvasRenderingContext2D,
  rect: Bounds,
  dir: 'up' | 'down',
  scale: number,
): void {
  const radius = 8 * scale;
  ctx.save();
  clearGlow(ctx);
  roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.fillStyle = 'rgba(54,248,122,0.08)';
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const a = Math.min(rect.width, rect.height) * 0.28;
  applyScaledGlow(ctx, 'greenS', scale);
  ctx.fillStyle = COLOR.green;
  ctx.beginPath();
  if (dir === 'up') {
    ctx.moveTo(cx, cy - a);
    ctx.lineTo(cx + a, cy + a * 0.7);
    ctx.lineTo(cx - a, cy + a * 0.7);
  } else {
    ctx.moveTo(cx, cy + a);
    ctx.lineTo(cx + a, cy - a * 0.7);
    ctx.lineTo(cx - a, cy - a * 0.7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
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

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}
