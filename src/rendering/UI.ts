// Gameplay HUD (docs/DESIGN_SPEC.md §5 Gameplay/HUD; mock: docs/mocks/serpent-surge-gameplay.html).
// Top: SCORE (gold) · ARENA (green) · pause (green outline).
// Wave line: `WAVE n OF N · FOOD x / y` + segmented fill bar.
// Bottom: LENGTH · HELD pixel chips with stack counts (no emoji).

import { Layout } from './Renderer';
import { PowerUpInstance } from '../game/PowerUp';
import {
  applyGlow,
  bodyFont,
  clearGlow,
  COLOR,
  displayFont,
  drawHeldChip,
} from '../theme';
import { drawPowerUpGlyph } from './PowerUpGlyphs';

export interface HUDData {
  score: number;
  snakeLength: number;
  waveProgress: string;          // legacy field, unused since we now build the line ourselves
  arenaNumber: number;
  currentWave: number;
  wavesPerArena: number;
  waveFoodEaten: number;
  waveFoodQuota: number;
  heldPowerUps: readonly PowerUpInstance[];
  ghostTimer?: number;
  timeDilationTimer?: number;
  reducedMotion?: boolean;
}

export class UI {
  private scoreDisplay = 0;
  private scorePulseTimer = 0;
  private floatingTexts: { text: string; x: number; y: number; life: number; maxLife: number }[] = [];

  update(dt: number, targetScore: number): void {
    if (this.scoreDisplay < targetScore) {
      this.scoreDisplay = Math.min(
        targetScore,
        this.scoreDisplay + Math.ceil((targetScore - this.scoreDisplay) * 0.2),
      );
    }
    if (this.scorePulseTimer > 0) {
      this.scorePulseTimer = Math.max(0, this.scorePulseTimer - dt);
    }
    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.y -= 40 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
  }

  triggerScorePulse(): void {
    this.scorePulseTimer = 0.15;
  }

  addFloatingText(text: string, x: number, y: number, duration = 1.0): void {
    this.floatingTexts.push({ text, x, y, life: duration, maxLife: duration });
  }

  drawHUD(ctx: CanvasRenderingContext2D, layout: Layout, data: HUDData): void {
    this.drawTopHUD(ctx, layout, data);
    this.drawBottomHUD(ctx, layout, data);
    this.drawFloatingTexts(ctx);
  }

  private drawTopHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    data: HUDData,
  ): void {
    const { hudTop } = layout;
    const padding = Math.max(14, hudTop.width * 0.045);
    const scaleFactor = Math.max(1, Math.min(1.5, hudTop.height / 105));
    const labelSize = Math.min(Math.floor(9 * scaleFactor), Math.floor(hudTop.width / 40));
    const valueSize = Math.min(Math.floor(18 * scaleFactor), Math.floor(hudTop.width / 22));

    ctx.save();
    ctx.textBaseline = 'top';

    const topY = hudTop.y + Math.floor(hudTop.height * 0.12);
    const centerX = hudTop.x + hudTop.width / 2;

    // ===== SCORE (left) =====
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = displayFont(labelSize);
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
    ctx.fillText('SCORE', hudTop.x + padding, topY);

    ctx.font = displayFont(valueSize);
    const scoreNumY = topY + labelSize + 6 * scaleFactor;
    const scoreText = this.scoreDisplay.toLocaleString();

    if (this.scorePulseTimer > 0 && !data.reducedMotion) {
      const pulse = 1 + this.scorePulseTimer * 2;
      const metrics = ctx.measureText(scoreText);
      const tx = hudTop.x + padding + metrics.width / 2;
      const ty = scoreNumY + valueSize / 2;
      ctx.translate(tx, ty);
      ctx.scale(pulse, pulse);
      ctx.translate(-tx, -ty);
    }
    applyGlow(ctx, 'gold');
    ctx.fillStyle = COLOR.gold;
    ctx.fillText(scoreText, hudTop.x + padding, scoreNumY);
    clearGlow(ctx);
    ctx.restore();

    // ===== ARENA (center) =====
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = displayFont(labelSize);
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
    ctx.fillText('ARENA', centerX, topY);

    ctx.font = displayFont(valueSize);
    applyGlow(ctx, 'green');
    ctx.fillStyle = COLOR.green;
    ctx.fillText(`${data.arenaNumber}`, centerX, scoreNumY);
    clearGlow(ctx);
    ctx.restore();

    // ===== Wave line + segmented bar (below the stat row) =====
    const waveLabelSize = Math.min(Math.floor(11 * scaleFactor), Math.floor(hudTop.width / 32));
    const waveY = scoreNumY + valueSize + Math.floor(14 * scaleFactor);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = bodyFont(waveLabelSize);
    ctx.fillStyle = COLOR.greenDim;
    clearGlow(ctx);
    const waveLine = `WAVE ${data.currentWave} OF ${data.wavesPerArena}  ·  FOOD ${data.waveFoodEaten} / ${data.waveFoodQuota}`;
    ctx.fillText(waveLine, centerX, waveY);
    ctx.restore();

    // Segmented bar — one cell per food in the current wave's quota.
    const segCount = Math.max(1, data.waveFoodQuota);
    const segGap = Math.max(2, Math.floor(3 * scaleFactor));
    const barWidth = Math.min(hudTop.width - padding * 2, 360 * scaleFactor);
    const segWidth = (barWidth - segGap * (segCount - 1)) / segCount;
    const segHeight = Math.max(6, Math.floor(8 * scaleFactor));
    const barX = centerX - barWidth / 2;
    const barY = waveY + waveLabelSize + Math.floor(8 * scaleFactor);

    drawSegmentedBar(ctx, barX, barY, segCount, data.waveFoodEaten, segWidth, segHeight, segGap);

    ctx.restore();
  }

  private drawBottomHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    data: HUDData,
  ): void {
    const { hudBottom } = layout;
    const padding = Math.max(14, hudBottom.width * 0.045);
    const scaleFactor = Math.max(1, Math.min(1.5, hudBottom.height / 50));
    const labelSize = Math.min(Math.floor(9 * scaleFactor), Math.floor(hudBottom.width / 40));
    const valueSize = Math.min(Math.floor(13 * scaleFactor), Math.floor(hudBottom.width / 28));

    ctx.save();
    ctx.textBaseline = 'top';

    // ===== LENGTH (left) =====
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = displayFont(labelSize);
    ctx.fillStyle = COLOR.greenDeep;
    clearGlow(ctx);
    const labelY = hudBottom.y + Math.floor(hudBottom.height * 0.1);
    ctx.fillText('LENGTH', hudBottom.x + padding, labelY);

    ctx.font = displayFont(valueSize);
    ctx.fillStyle = COLOR.bone;
    ctx.fillText(`${data.snakeLength}`, hudBottom.x + padding, labelY + labelSize + 5 * scaleFactor);
    ctx.restore();

    // ===== HELD chips (right) =====
    const chips = data.heldPowerUps;
    if (chips.length > 0) {
      const chipScale = scaleFactor;
      const chipSize = 30 * chipScale;
      const chipGap = 8 * chipScale;
      const totalWidth = chips.length * chipSize + (chips.length - 1) * chipGap;

      // "HELD" mini-label sits to the left of the chips
      const heldLabelSize = Math.min(7 * scaleFactor, labelSize);
      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = displayFont(heldLabelSize);
      ctx.fillStyle = COLOR.greenDeep;
      clearGlow(ctx);

      const chipsY = hudBottom.y + hudBottom.height / 2 - chipSize / 2;
      const chipsRight = hudBottom.x + hudBottom.width - padding;
      const chipsLeft = chipsRight - totalWidth;
      const heldLabelGap = 12 * chipScale;

      ctx.fillText('HELD', chipsLeft - heldLabelGap, chipsY + chipSize / 2);
      ctx.restore();

      // Chips themselves
      let x = chipsLeft;
      for (const pu of chips) {
        const glyph = drawPowerUpGlyph(pu.id);
        drawHeldChip(ctx, x, chipsY, glyph, pu.stackCount > 1 ? pu.stackCount : null, chipScale);
        x += chipSize + chipGap;
      }
    }

    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = displayFont(12);

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.fillStyle = COLOR.gold;
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  reset(): void {
    this.scoreDisplay = 0;
    this.scorePulseTimer = 0;
    this.floatingTexts = [];
  }
}

function drawSegmentedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  filledCount: number,
  segWidth: number,
  segHeight: number,
  segGap: number,
): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const sx = x + i * (segWidth + segGap);
    const isLit = i < filledCount;
    if (isLit) {
      ctx.shadowColor = COLOR.green;
      ctx.shadowBlur = 8;
      ctx.fillStyle = COLOR.green;
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = COLOR.greenDeep;
    }
    const radius = Math.min(2, segHeight / 3);
    ctx.beginPath();
    ctx.roundRect(sx, y, segWidth, segHeight, radius);
    ctx.fill();
  }
  ctx.restore();
}
