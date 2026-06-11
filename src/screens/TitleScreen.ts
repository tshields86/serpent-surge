// Title screen — DESIGN_SPEC.md §5 (mock: serpent-surge-screens.html).
// Logo upper third · primary CTA pulses (off under Reduced Motion) ·
// menu reordered: Daily → Collection → Leaderboard → hairline → How to Play → Settings.
// Whole menu uses the green family with brightness as hierarchy.

import {
  applyGlow,
  applyScaledGlow,
  clearGlow,
  COLOR,
  displayFont,
  fillBackground,
  LETTER_SPACING,
  TEXT,
  type Bounds,
} from '../theme';

export interface TitleAction {
  action: 'start' | 'settings' | 'daily' | 'collection' | 'leaderboard' | 'howtoplay';
}

interface MenuItem {
  key: keyof Pick<TitleScreenBounds, 'daily' | 'collection' | 'leaderboard' | 'howtoplay' | 'settings'>;
  label: string;
  lead?: boolean;
  pip?: string;
}

interface TitleScreenBounds {
  daily: Bounds;
  collection: Bounds;
  leaderboard: Bounds;
  howtoplay: Bounds;
  settings: Bounds;
}

const EMPTY: Bounds = { x: 0, y: 0, width: 0, height: 0 };

export class TitleScreen {
  private pulseTimer = 0;
  private bounds: TitleScreenBounds = {
    daily: { ...EMPTY },
    collection: { ...EMPTY },
    leaderboard: { ...EMPTY },
    howtoplay: { ...EMPTY },
    settings: { ...EMPTY },
  };

  update(dt: number): void {
    this.pulseTimer += dt;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    highScore: number,
    totalScales?: number,
    dailyBest?: number,
    reducedMotion = false,
  ): void {
    const { width, height } = ctx.canvas;
    const cx = width / 2;
    const scale = pickScale(width);

    fillBackground(ctx, width, height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // ===== Logo =====
    const logoSize = Math.min(TEXT.logo * scale, Math.floor(width / 9));
    ctx.font = displayFont(logoSize);
    applyScaledGlow(ctx, 'green', scale);
    ctx.fillStyle = COLOR.green;
    const logoY = height * 0.2;
    ctx.fillText('SERPENT', cx, logoY);
    ctx.fillText('SURGE', cx, logoY + logoSize * 1.45);
    clearGlow(ctx);

    // ===== TAP TO START =====
    const ctaSize = Math.min(12 * scale, Math.floor(width / 32));
    const ctaY = height * 0.4;
    ctx.font = displayFont(ctaSize);
    const alpha = reducedMotion ? 1 : 0.6 + Math.sin(this.pulseTimer * 2.6) * 0.4;
    ctx.globalAlpha = Math.max(0.35, Math.min(1, alpha));
    applyScaledGlow(ctx, 'green', scale);
    ctx.fillStyle = COLOR.green;
    ctx.textAlign = 'left';
    const ctaLabel = 'TAP TO START';
    const ctaSpacing = LETTER_SPACING.title * scale;
    const ctaTextWidth = measureSpacedText(ctx, ctaLabel, ctaSpacing);
    const arrowSize = ctaSize * 0.7;
    const arrowGap = ctaSize * 0.5;
    const totalCtaWidth = arrowSize + arrowGap + ctaTextWidth;
    const ctaStartX = cx - totalCtaWidth / 2;
    // Triangle play-arrow (filled, points right) sits on the text's vertical middle
    ctx.beginPath();
    ctx.moveTo(ctaStartX + arrowSize, ctaY);
    ctx.lineTo(ctaStartX, ctaY - arrowSize * 0.55);
    ctx.lineTo(ctaStartX, ctaY + arrowSize * 0.55);
    ctx.closePath();
    ctx.fill();
    drawSpacedText(ctx, ctaLabel, ctaStartX + arrowSize + arrowGap, ctaY, ctaSpacing);
    ctx.globalAlpha = 1;
    clearGlow(ctx);
    ctx.textAlign = 'center';

    // ===== High score / scales (small, between CTA and menu) =====
    const statSize = Math.min(9 * scale, Math.floor(width / 40));
    ctx.font = displayFont(statSize);
    let statY = height * 0.5;
    if (highScore > 0) {
      ctx.fillStyle = COLOR.gold;
      ctx.fillText(`HIGH SCORE  ${highScore.toLocaleString()}`, cx, statY);
      statY += statSize * 2.3;
    }
    if (totalScales !== undefined && totalScales > 0) {
      ctx.fillStyle = COLOR.greenDim;
      ctx.fillText(`◆ ${totalScales} SCALES`, cx, statY);
    }

    // ===== Menu =====
    const items: MenuItem[] = [
      { key: 'daily', label: dailyBest !== undefined && dailyBest > 0
          ? `DAILY CHALLENGE  ${dailyBest}` : 'DAILY CHALLENGE', lead: true, pip: 'NEW' },
      { key: 'collection', label: 'COLLECTION' },
      { key: 'leaderboard', label: 'LEADERBOARD' },
      { key: 'howtoplay', label: 'HOW TO PLAY' },
      { key: 'settings', label: 'SETTINGS' },
    ];

    const menuItemSize = Math.min(11 * scale, Math.floor(width / 34));
    const menuItemHeight = Math.max(44, menuItemSize * 3.2);  // touch target
    const dividerHeight = menuItemHeight * 0.4;
    const dividerAfterIndex = 2; // hairline after LEADERBOARD
    const totalMenuHeight = items.length * menuItemHeight + dividerHeight;
    const menuBottom = height * 0.94;
    const menuStartY = menuBottom - totalMenuHeight;

    ctx.font = displayFont(menuItemSize);

    let cursorY = menuStartY;
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const itemCenterY = cursorY + menuItemHeight / 2;
      this.drawMenuItem(ctx, item, cx, itemCenterY, menuItemSize, scale);
      this.bounds[item.key] = {
        x: 0,
        y: cursorY,
        width,
        height: menuItemHeight,
      };
      cursorY += menuItemHeight;

      if (i === dividerAfterIndex) {
        // Hairline divider — short centered line. Slightly brighter than the
        // spec's line-soft so it's visible on the dark bg, still subtle.
        ctx.strokeStyle = COLOR.line;
        ctx.lineWidth = 1;
        const dividerWidth = 140 * scale;
        const dividerY = cursorY + dividerHeight / 2;
        ctx.beginPath();
        ctx.moveTo(cx - dividerWidth / 2, dividerY);
        ctx.lineTo(cx + dividerWidth / 2, dividerY);
        ctx.stroke();
        cursorY += dividerHeight;
      }
    }

    ctx.restore();
  }

  /** One menu item — arrow + label + optional NEW pip — aligned around the center. */
  private drawMenuItem(
    ctx: CanvasRenderingContext2D,
    item: MenuItem,
    cx: number,
    cy: number,
    size: number,
    scale: number,
  ): void {
    const labelColor = item.lead ? COLOR.green : COLOR.greenDim;
    const arrowColor = COLOR.greenDeep;
    const spacing = LETTER_SPACING.nav * scale;
    const arrowSize = size * 0.55;
    const arrowGap = size * 0.65;
    const pipGap = size * 0.7;

    ctx.save();
    ctx.font = displayFont(size);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const labelW = measureSpacedText(ctx, item.label, spacing);
    let pipBoxW = 0;
    let pipPadX = 0;
    let pipFont = 0;
    let pipTextW = 0;
    if (item.pip) {
      pipFont = size * 0.65;
      pipPadX = size * 0.3;
      ctx.font = displayFont(pipFont);
      pipTextW = measureSpacedText(ctx, item.pip, spacing);
      pipBoxW = pipTextW + pipPadX * 2;
      ctx.font = displayFont(size);
    }

    const totalW = arrowSize + arrowGap + labelW + (item.pip ? pipGap + pipBoxW : 0);
    let x = cx - totalW / 2;

    // Triangle arrow (filled) — sits on the label's vertical middle.
    ctx.fillStyle = arrowColor;
    clearGlow(ctx);
    ctx.beginPath();
    ctx.moveTo(x + arrowSize, cy);
    ctx.lineTo(x, cy - arrowSize * 0.55);
    ctx.lineTo(x, cy + arrowSize * 0.55);
    ctx.closePath();
    ctx.fill();
    x += arrowSize + arrowGap;

    // Label
    ctx.fillStyle = labelColor;
    if (item.lead) applyScaledGlow(ctx, 'greenS', scale);
    drawSpacedText(ctx, item.label, x, cy, spacing);
    clearGlow(ctx);
    x += labelW + (item.pip ? pipGap : 0);

    // NEW pip
    if (item.pip) {
      const padY = size * 0.22;
      const bh = pipFont + padY * 2;
      const by = cy - bh / 2;
      ctx.strokeStyle = COLOR.gold;
      ctx.lineWidth = 1;
      roundedRectPath(ctx, x, by, pipBoxW, bh, 3 * scale);
      ctx.stroke();
      ctx.font = displayFont(pipFont);
      ctx.fillStyle = COLOR.gold;
      drawSpacedText(ctx, item.pip, x + pipPadX, cy, spacing);
    }

    ctx.restore();
  }

  handleClick(x: number, y: number): TitleAction | null {
    if (hit(x, y, this.bounds.daily)) return { action: 'daily' };
    if (hit(x, y, this.bounds.collection)) return { action: 'collection' };
    if (hit(x, y, this.bounds.leaderboard)) return { action: 'leaderboard' };
    if (hit(x, y, this.bounds.howtoplay)) return { action: 'howtoplay' };
    if (hit(x, y, this.bounds.settings)) return { action: 'settings' };
    // Anywhere else starts the game.
    return { action: 'start' };
  }
}

// ---------------------------------------------------------------------------

function hit(x: number, y: number, b: Bounds): boolean {
  return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.5;
  if (width >= 1024) return 1.3;
  if (width >= 720) return 1.15;
  return 1;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
): void {
  const chars = [...text];
  let cursor = x;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i]!, cursor, y);
    cursor += ctx.measureText(chars[i]!).width + letterSpacing;
  }
}

function measureSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  const chars = [...text];
  return chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0)
    + letterSpacing * Math.max(0, chars.length - 1);
}

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

// Suppress unused-import warning when applyGlow ends up unused in future tweaks.
void applyGlow;
