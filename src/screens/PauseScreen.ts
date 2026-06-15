// Pause screen — opaque modal matching the rest of the redesign chrome.
// Three actions: tap empty space (or ◀ RESUME) to resume, SETTINGS opens
// the settings overlay, QUIT RUN abandons to the title screen.

import { safeAreaInsetTop } from '../rendering/Renderer';
import {
  COLOR,
  drawCloseButton,
  drawScreenTitle,
  drawSecondaryButton,
  fillBackground,
  hitTest,
  TEXT,
  clearGlow,
  displayFont,
  type Bounds,
} from '../theme';

export type PauseAction = 'resume' | 'settings' | 'quit';

export class PauseScreen {
  private visible = false;
  private settingsBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private quitBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };

  show(): void { this.visible = true; }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.visible) return;

    ctx.save();
    fillBackground(ctx, width, height);
    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Title =====
    const titleY = Math.floor(usableHeight * 0.18);
    drawScreenTitle(ctx, 'PAUSED', width / 2, titleY, scale);

    // ===== Hint =====
    const hintSize = Math.min(TEXT.cardName * scale, Math.floor(width / 38));
    ctx.save();
    ctx.font = displayFont(hintSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
    ctx.fillText('TAP TO RESUME', width / 2, titleY + 36 * scale);
    ctx.restore();

    // ===== Stacked secondary buttons =====
    // Anchored to the title block so the composition stays cohesive at any
    // viewport height. Centered around mid-screen as a soft minimum.
    const btnWidth = Math.min(280 * scale, width - 80);
    const btnHeight = Math.max(48, 52 * scale);
    const btnGap = 16 * scale;
    const btnX = (width - btnWidth) / 2;
    const titleAnchored = titleY + 88 * scale;
    const screenCentered = Math.floor(usableHeight * 0.42) - btnHeight;
    let cursorY = Math.max(titleAnchored, screenCentered);

    this.settingsBounds = { x: btnX, y: cursorY, width: btnWidth, height: btnHeight };
    drawSecondaryButton(ctx, this.settingsBounds, 'SETTINGS', { scale });
    cursorY += btnHeight + btnGap;

    this.quitBounds = { x: btnX, y: cursorY, width: btnWidth, height: btnHeight };
    drawSecondaryButton(ctx, this.quitBounds, 'QUIT RUN', { scale });

    // ===== Resume affordance (bottom) =====
    // Tap anywhere outside SETTINGS/QUIT counts as a resume, so we don't need
    // to remember the affordance's own bounds.
    const resumeY = usableHeight - Math.max(36, 36 * scale);
    drawCloseButton(ctx, width / 2, resumeY, scale, 'RESUME');

    ctx.restore();
  }

  /** Returns the action chosen, or 'resume' for a tap on empty space. */
  handleClick(x: number, rawY: number): PauseAction {
    if (!this.visible) return 'resume';
    const y = rawY - safeAreaInsetTop;
    if (hitTest(this.settingsBounds, x, y)) return 'settings';
    if (hitTest(this.quitBounds, x, y)) return 'quit';
    // Resume button OR any empty space — preserves the prior tap-anywhere gesture.
    return 'resume';
  }
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}
