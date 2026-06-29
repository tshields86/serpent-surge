// Leaderboard consent modal — Apple Guideline 5.1.2.
//
// Shown once, the first time a run ends, before any score is uploaded. The
// player must explicitly opt in before their display name + run stats leave the
// device. Mirrors SettingsScreen's modal structure (opaque backdrop, safe-area
// offset, shared theme components) so it matches every other overlay.

import { safeAreaInsetTop } from '../rendering/Renderer';
import {
  applyScaledGlow,
  bodyFont,
  clearGlow,
  COLOR,
  drawPrimaryButton,
  drawScreenTitle,
  drawSecondaryButton,
  fillBackground,
  hitTest,
  type Bounds,
} from '../theme';

export type ConsentResult = 'allow' | 'deny' | 'privacy' | 'editName' | false;

const BODY = [
  'Your display name and run stats',
  '(score, arenas cleared, food eaten)',
  'are uploaded to our online leaderboard.',
  '',
  'No email or real name is collected.',
];

export class ConsentScreen {
  private visible = false;
  private allowBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private denyBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private privacyBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private nameBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };

  show(): void { this.visible = true; }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, playerName: string): void {
    if (!this.visible) return;

    ctx.save();
    fillBackground(ctx, width, height);
    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Title =====
    const titleY = Math.floor(usableHeight * 0.16);
    drawScreenTitle(ctx, 'GLOBAL LEADERBOARD', width / 2, titleY, scale);

    // ===== Lead question (gold, the prominent line) =====
    const leadSize = Math.min(28 * scale, Math.floor(width / 15));
    ctx.save();
    ctx.font = bodyFont(leadSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.gold;
    applyScaledGlow(ctx, 'gold', scale);
    const leadY = titleY + 52 * scale;
    ctx.fillText('Submit your scores to the', width / 2, leadY);
    ctx.fillText('global leaderboard?', width / 2, leadY + leadSize * 1.15);
    ctx.restore();

    // ===== Body (bone, multi-line) =====
    const bodySize = Math.min(20 * scale, Math.floor(width / 22));
    const lineHeight = bodySize * 1.25;
    let bodyY = leadY + leadSize * 1.15 + lineHeight * 1.8;
    ctx.save();
    ctx.font = bodyFont(bodySize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.bone;
    clearGlow(ctx);
    for (const line of BODY) {
      if (line) ctx.fillText(line, width / 2, bodyY);
      bodyY += lineHeight;
    }
    ctx.restore();

    // ===== "You'll appear as" callout (tappable → opens the name editor) =====
    const captionSize = Math.min(18 * scale, Math.floor(width / 24));
    const nameSize = Math.min(24 * scale, Math.floor(width / 13));
    const captionY = bodyY + lineHeight * 1.1;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = bodyFont(captionSize);
    ctx.fillStyle = COLOR.greenDim;
    clearGlow(ctx);
    ctx.fillText("You'll appear as", width / 2, captionY);

    const nameY = captionY + nameSize * 0.95;
    ctx.font = bodyFont(nameSize);
    ctx.fillStyle = COLOR.gold;
    applyScaledGlow(ctx, 'gold', scale);
    const editHint = '  ✎';
    const nameText = (playerName || 'AAA').toUpperCase();
    const nameW = ctx.measureText(nameText).width;
    ctx.font = bodyFont(captionSize);
    const hintW = ctx.measureText(editHint).width;
    const totalW = nameW + hintW;
    // Draw name (gold) then the edit glyph (green) right after it.
    ctx.textAlign = 'left';
    ctx.font = bodyFont(nameSize);
    ctx.fillStyle = COLOR.gold;
    ctx.fillText(nameText, width / 2 - totalW / 2, nameY);
    ctx.font = bodyFont(captionSize);
    ctx.fillStyle = COLOR.green;
    clearGlow(ctx);
    ctx.fillText(editHint, width / 2 - totalW / 2 + nameW, nameY);
    ctx.restore();
    this.nameBounds = {
      x: width / 2 - totalW / 2 - 16,
      y: captionY - captionSize,
      width: totalW + 32,
      height: (nameY - captionY) + nameSize,
    };

    // ===== Privacy policy link (green, tappable) =====
    const linkSize = Math.min(18 * scale, Math.floor(width / 24));
    const linkY = nameY + nameSize * 0.9 + lineHeight * 0.4;
    ctx.save();
    ctx.font = bodyFont(linkSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.green;
    clearGlow(ctx);
    const linkText = 'View Privacy Policy';
    ctx.fillText(linkText, width / 2, linkY);
    const linkW = ctx.measureText(linkText).width;
    // Underline so it reads as a link.
    ctx.strokeStyle = COLOR.green;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - linkW / 2, linkY + linkSize * 0.7);
    ctx.lineTo(width / 2 + linkW / 2, linkY + linkSize * 0.7);
    ctx.stroke();
    ctx.restore();
    this.privacyBounds = {
      x: width / 2 - linkW / 2 - 12,
      y: linkY - linkSize,
      width: linkW + 24,
      height: linkSize * 2,
    };

    // ===== Buttons =====
    const btnWidth = Math.min(300 * scale, width - 48);
    const btnHeight = Math.max(48, 52 * scale);
    const btnX = (width - btnWidth) / 2;
    const allowY = usableHeight - btnHeight * 2 - 28 * scale;
    const denyY = allowY + btnHeight + 14 * scale;

    this.allowBounds = drawPrimaryButton(
      ctx,
      { x: btnX, y: allowY, width: btnWidth, height: btnHeight },
      'ALLOW',
      { scale },
    );
    this.denyBounds = drawSecondaryButton(
      ctx,
      { x: btnX, y: denyY, width: btnWidth, height: btnHeight },
      'NOT NOW',
      { scale },
    );

    ctx.restore();
  }

  /** Returns the chosen action, or false if the tap missed every target. */
  handleClick(x: number, rawY: number, _width: number): ConsentResult {
    if (!this.visible) return false;
    const y = rawY - safeAreaInsetTop;
    if (hitTest(this.allowBounds, x, y)) return 'allow';
    if (hitTest(this.denyBounds, x, y)) return 'deny';
    if (hitTest(this.privacyBounds, x, y)) return 'privacy';
    if (hitTest(this.nameBounds, x, y)) return 'editName';
    return false;
  }
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}
