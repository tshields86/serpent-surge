// Game Over — docs/DESIGN_SPEC.md §5.
// Coral title (the one place coral is allowed), stats stay legible over a
// darkened gameplay backdrop, TRY AGAIN = primary green button, SHARE +
// LEADERBOARD = secondary.

import { Layout } from '../rendering/Renderer';
import {
  applyScaledGlow,
  bodyFont,
  clearGlow,
  COLOR,
  displayFont,
  drawPrimaryButton,
  drawSecondaryButton,
  hitTest,
  LETTER_SPACING,
  TEXT,
  type Bounds,
} from '../theme';

export class DeathScreen {
  private opacity = 0;
  private fadeSpeed = 2;
  private tryAgainBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private shareBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private leaderboardBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private shareMessage = '';
  private shareMessageTimer = 0;

  update(dt: number): void {
    if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + this.fadeSpeed * dt);
    if (this.shareMessageTimer > 0) this.shareMessageTimer -= dt;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    _layout: Layout,
    score: number,
    length: number,
    foodEaten: number,
  ): void {
    const { width, height } = ctx.canvas;
    const cx = width / 2;
    const scale = pickScale(width);

    // Darken backdrop so stats stay legible — only a faint shape of the arena
    // should bleed through. Otherwise HUD chrome competes with the buttons.
    ctx.save();
    ctx.globalAlpha = this.opacity * 0.97;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = this.opacity;

    // ===== GAME OVER title — coral (the only place coral is allowed) =====
    const titleSize = Math.min(28 * scale, Math.floor(width / 12));
    ctx.font = displayFont(titleSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.coral;
    applyScaledGlow(ctx, 'coral', scale);
    const titleY = height * 0.22;
    drawSpacedText(ctx, 'GAME OVER', cx, titleY, LETTER_SPACING.title * scale);
    clearGlow(ctx);

    // ===== Stats =====
    const labelSize = Math.min(TEXT.hudLabel * scale, Math.floor(width / 40));
    const valueSize = Math.min(20 * scale, Math.floor(width / 18));
    const statBlockY = height * 0.36;
    const blockSpacing = valueSize * 2.6;

    drawStat(ctx, 'SCORE',  score.toLocaleString(), cx,              statBlockY,                 labelSize, valueSize, 'gold',  scale);
    drawStat(ctx, 'LENGTH', `${length}`,            cx - 100 * scale, statBlockY + blockSpacing,   labelSize, valueSize, 'green', scale);
    drawStat(ctx, 'FOOD',   `${foodEaten}`,         cx + 100 * scale, statBlockY + blockSpacing,   labelSize, valueSize, 'green', scale);

    // ===== Buttons =====
    const btnWidth = Math.min(280 * scale, width * 0.7);
    const primaryHeight = 50 * scale;
    const secondaryHeight = 44 * scale;
    const btnX = cx - btnWidth / 2;
    let btnY = height * 0.62;

    this.tryAgainBounds = drawPrimaryButton(
      ctx,
      { x: btnX, y: btnY, width: btnWidth, height: primaryHeight },
      'TRY AGAIN',
      { scale },
    );
    btnY += primaryHeight + 12 * scale;

    this.shareBounds = drawSecondaryButton(
      ctx,
      { x: btnX, y: btnY, width: btnWidth, height: secondaryHeight },
      'SHARE',
      { scale },
    );
    btnY += secondaryHeight + 12 * scale;

    this.leaderboardBounds = drawSecondaryButton(
      ctx,
      { x: btnX, y: btnY, width: btnWidth, height: secondaryHeight },
      'LEADERBOARD',
      { scale },
    );

    // Share feedback toast
    if (this.shareMessageTimer > 0 && this.shareMessage) {
      ctx.font = bodyFont(18 * scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.green;
      clearGlow(ctx);
      ctx.fillText(this.shareMessage, cx, btnY + secondaryHeight + 24 * scale);
    }

    ctx.restore();
  }

  isReady(): boolean {
    return this.opacity >= 0.8;
  }

  reset(): void {
    this.opacity = 0;
    this.shareMessage = '';
    this.shareMessageTimer = 0;
  }

  /** Returns 'try-again' | 'share' | 'leaderboard' | null for a click. */
  handleClick(x: number, y: number): 'try-again' | 'share' | 'leaderboard' | null {
    if (hitTest(this.tryAgainBounds, x, y)) return 'try-again';
    if (hitTest(this.shareBounds, x, y)) return 'share';
    if (hitTest(this.leaderboardBounds, x, y)) return 'leaderboard';
    return null;
  }

  getButtonBounds(canvasWidth: number, canvasHeight: number): Bounds {
    if (this.tryAgainBounds.width > 0) return { ...this.tryAgainBounds };
    // Estimate before first draw — kept for callers that hit-test pre-render.
    const scale = pickScale(canvasWidth);
    const btnWidth = Math.min(280 * scale, canvasWidth * 0.7);
    return {
      x: canvasWidth / 2 - btnWidth / 2,
      y: canvasHeight * 0.62,
      width: btnWidth,
      height: 50 * scale,
    };
  }

  getShareBounds(): Bounds { return { ...this.shareBounds }; }
  getLeaderboardBounds(): Bounds { return { ...this.leaderboardBounds }; }

  async share(canvas: HTMLCanvasElement, score: number): Promise<void> {
    const text = `I scored ${score.toLocaleString()} in Serpent Surge! Can you beat it?`;
    try {
      if (navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
        if (blob) {
          const file = new File([blob], 'serpent-surge.png', { type: 'image/png' });
          const shareData = { text, files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            this.shareMessage = 'SHARED!';
            this.shareMessageTimer = 2;
            return;
          }
        }
        await navigator.share({ text });
        this.shareMessage = 'SHARED!';
        this.shareMessageTimer = 2;
        return;
      }
      await navigator.clipboard.writeText(text);
      this.shareMessage = 'COPIED TO CLIPBOARD!';
      this.shareMessageTimer = 2;
    } catch {
      this.shareMessage = 'COULD NOT SHARE';
      this.shareMessageTimer = 2;
    }
  }
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  cx: number,
  cy: number,
  labelSize: number,
  valueSize: number,
  valueColor: 'gold' | 'green',
  scale: number,
): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = displayFont(labelSize);
  ctx.fillStyle = COLOR.greenDeep;
  clearGlow(ctx);
  ctx.fillText(label, cx, cy);

  ctx.font = displayFont(valueSize);
  if (valueColor === 'gold') {
    ctx.fillStyle = COLOR.gold;
    applyScaledGlow(ctx, 'gold', scale);
  } else {
    ctx.fillStyle = COLOR.green;
    applyScaledGlow(ctx, 'green', scale);
  }
  ctx.fillText(value, cx, cy + labelSize + valueSize * 0.7);
  clearGlow(ctx);

  ctx.restore();
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
