// Leaderboard — docs/DESIGN_SPEC.md §5 (mock: docs/mocks/serpent-surge-design-system.html).
//
// Top 3 ranks emphasized in gold, the player's own row gets a green left-border
// and tint, and ALL TIME / DAILY tabs are styled per spec (active = cyan, inactive
// = green-deep). Shared title + CLOSE chrome.

import { LeaderboardEntry } from '../meta/Leaderboard';
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
  LETTER_SPACING,
  TEXT,
  type Bounds,
} from '../theme';

type Tab = 'all-time' | 'daily';

export class LeaderboardScreen {
  private visible = false;
  private activeTab: Tab = 'all-time';
  private allTimeEntries: LeaderboardEntry[] = [];
  private dailyEntries: LeaderboardEntry[] = [];
  private loading = false;
  private closeBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private allTimeTabBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private dailyTabBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };

  show(): void { this.visible = true; }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }
  setLoading(loading: boolean): void { this.loading = loading; }
  setEntries(allTime: LeaderboardEntry[], daily: LeaderboardEntry[]): void {
    this.allTimeEntries = allTime;
    this.dailyEntries = daily;
    this.loading = false;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerName: string = '',
  ): void {
    if (!this.visible) return;

    ctx.save();
    fillBackground(ctx, width, height);
    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Title =====
    const titleY = Math.floor(usableHeight * 0.06);
    drawScreenTitle(ctx, 'LEADERBOARD', width / 2, titleY, scale);

    // ===== Tabs =====
    const tabSize = Math.min(11 * scale, Math.floor(width / 32));
    const tabY = titleY + 30 * scale;
    const cx = width / 2;
    this.allTimeTabBounds = drawTab(ctx, 'ALL TIME', cx - 60 * scale, tabY, tabSize, scale, this.activeTab === 'all-time', 'right');
    this.dailyTabBounds = drawTab(ctx, 'DAILY',     cx + 60 * scale, tabY, tabSize, scale, this.activeTab === 'daily',    'left');

    // ===== Entries =====
    const padding = Math.max(20, width * 0.06);
    const listWidth = Math.min(360 * scale, width - padding * 2);
    const listX = (width - listWidth) / 2;

    const entries = this.activeTab === 'all-time' ? this.allTimeEntries : this.dailyEntries;
    const rowHeight = Math.max(28, 32 * scale);
    const listY = tabY + 28 * scale;

    if (this.loading) {
      ctx.save();
      ctx.font = bodyFont(20 * scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.greenDim;
      ctx.fillText('LOADING...', width / 2, usableHeight / 2);
      ctx.restore();
    } else if (entries.length === 0) {
      ctx.save();
      ctx.font = bodyFont(20 * scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.greenDeep;
      ctx.fillText('NO SCORES YET', width / 2, usableHeight / 2);
      ctx.restore();
    } else {
      const playerNameUpper = playerName.toUpperCase();
      const maxRows = Math.min(entries.length, Math.floor((usableHeight - listY - 80) / rowHeight));
      for (let i = 0; i < maxRows; i++) {
        const entry = entries[i]!;
        const isPlayer = playerNameUpper !== '' && entry.player_name.toUpperCase() === playerNameUpper;
        drawRow(ctx, i + 1, entry.player_name, entry.score, isPlayer, listX, listY + i * rowHeight, listWidth, rowHeight, scale);
      }
    }

    // ===== CLOSE =====
    const closeY = usableHeight - Math.max(36, 36 * scale);
    this.closeBounds = drawCloseButton(ctx, width / 2, closeY, scale);

    ctx.restore();
  }

  handleClick(x: number, rawY: number, _width: number): 'close' | null {
    if (!this.visible) return null;
    const y = rawY - safeAreaInsetTop;
    if (hitTest(this.closeBounds, x, y)) return 'close';
    if (hitTest(this.allTimeTabBounds, x, y)) {
      this.activeTab = 'all-time';
      return null;
    }
    if (hitTest(this.dailyTabBounds, x, y)) {
      this.activeTab = 'daily';
      return null;
    }
    return null;
  }
}

function drawTab(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  size: number,
  scale: number,
  active: boolean,
  align: 'left' | 'right',
): Bounds {
  ctx.save();
  ctx.font = displayFont(size);
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  if (active) {
    ctx.fillStyle = COLOR.cyan;
    applyScaledGlow(ctx, 'cyan', scale);
  } else {
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
  }
  // Manual letter spacing to match the tag look in the mock.
  drawSpacedText(ctx, label, x, y, LETTER_SPACING.label * scale);
  const width = measureSpacedText(ctx, label, LETTER_SPACING.label * scale);
  ctx.restore();
  const tapPad = Math.max(16, size);
  return {
    x: align === 'right' ? x - width - tapPad : x - tapPad,
    y: y - size - tapPad / 2,
    width: width + tapPad * 2,
    height: size + tapPad,
  };
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  rank: number,
  name: string,
  score: number,
  isPlayer: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
): void {
  ctx.save();

  // Player highlight — green tint + left border
  if (isPlayer) {
    ctx.fillStyle = 'rgba(54,248,122,0.08)';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = COLOR.green;
    ctx.fillRect(x, y, 2, height);
  }

  // Faint bottom divider
  ctx.strokeStyle = COLOR.lineSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + height - 0.5);
  ctx.lineTo(x + width, y + height - 0.5);
  ctx.stroke();

  const padX = 14 * scale;
  const midY = y + height / 2;

  // Rank — top 3 get gold, others green-deep
  const rankSize = Math.min(13 * scale, Math.floor(width / 22));
  ctx.font = displayFont(rankSize);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  if (rank <= 3) {
    ctx.fillStyle = COLOR.gold;
    applyScaledGlow(ctx, 'gold', scale);
  } else {
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
  }
  ctx.fillText(`${rank}`, x + padX, midY);

  // Name
  clearGlow(ctx);
  const nameSize = Math.min(TEXT.cardName * scale, Math.floor(width / 30));
  ctx.font = displayFont(nameSize);
  ctx.fillStyle = isPlayer ? COLOR.green : COLOR.bone;
  ctx.fillText(name.toUpperCase(), x + padX + 40 * scale, midY);

  // Score (right, gold)
  ctx.textAlign = 'right';
  ctx.fillStyle = COLOR.gold;
  ctx.fillText(score.toLocaleString(), x + width - padX, midY);

  ctx.restore();
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  letterSpacing: number,
): void {
  if (letterSpacing <= 0.01) {
    ctx.fillText(text, cx, y);
    return;
  }
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
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
}

function measureSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  if (letterSpacing <= 0.01) return ctx.measureText(text).width;
  const chars = [...text];
  return chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0)
    + letterSpacing * Math.max(0, chars.length - 1);
}
