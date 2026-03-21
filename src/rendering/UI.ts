import { COLORS } from '../utils/constants';
import { Layout } from './Renderer';
import { PowerUpInstance, getPowerUpDef } from '../game/PowerUp';

const FONT_FAMILY = '"Press Start 2P", monospace';

export interface HUDData {
  score: number;
  snakeLength: number;
  waveProgress: string;
  arenaNumber: number;
  currentWave: number;
  wavesPerArena: number;
  waveFoodEaten: number;
  waveFoodQuota: number;
  heldPowerUps: readonly PowerUpInstance[];
  ghostTimer?: number;
  timeDilationTimer?: number;
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

    // Update floating texts
    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.y -= 40 * dt; // float upward
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
    const padding = 16;
    const scaleFactor = Math.max(1, Math.min(1.5, hudTop.height / 105));
    const labelSize = Math.min(Math.floor(12 * scaleFactor), Math.floor(hudTop.width / 35));
    const valueSize = Math.min(Math.floor(20 * scaleFactor), Math.floor(hudTop.width / 22));

    ctx.save();
    ctx.textBaseline = 'top';

    const topY = hudTop.y + Math.floor(padding * 0.8);

    // === SCORE (left side) ===
    ctx.save();
    ctx.textAlign = 'left';

    // "SCORE" label in green
    ctx.font = `${labelSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText('SCORE', padding, topY);

    // Score value in yellow, with pulse
    ctx.font = `${valueSize}px ${FONT_FAMILY}`;
    const scoreNumY = topY + labelSize + 4;
    if (this.scorePulseTimer > 0) {
      const scorePulseScale = 1 + this.scorePulseTimer * 2;
      const scoreText = this.scoreDisplay.toLocaleString();
      const metrics = ctx.measureText(scoreText);
      const textCenterX = padding + metrics.width / 2;
      const textCenterY = scoreNumY + valueSize / 2;
      ctx.translate(textCenterX, textCenterY);
      ctx.scale(scorePulseScale, scorePulseScale);
      ctx.translate(-textCenterX, -textCenterY);
    }
    ctx.fillStyle = COLORS.score;
    ctx.fillText(this.scoreDisplay.toLocaleString(), padding, scoreNumY);
    ctx.restore();

    // === ARENA + WAVE (center) ===
    ctx.save();
    ctx.textAlign = 'center';
    const centerX = hudTop.width / 2;

    // "ARENA" label in green
    ctx.font = `${labelSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText('ARENA', centerX, topY);

    // Arena number in yellow
    ctx.font = `${valueSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.score;
    ctx.fillText(`${data.arenaNumber}`, centerX, topY + labelSize + 4);

    // Wave text in green
    const waveY = topY + labelSize + 4 + valueSize + 10;
    const waveSize = Math.min(Math.floor(10 * scaleFactor), Math.floor(hudTop.width / 40));
    ctx.font = `${waveSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText(data.waveProgress, centerX, waveY);

    // Progress bar below wave text
    const barY = waveY + waveSize + 5;
    const barWidth = Math.min(220 * scaleFactor, hudTop.width * 0.45);
    const barHeight = Math.floor(8 * scaleFactor);
    const barX = centerX - barWidth / 2;

    // Calculate overall arena progress:
    // total food across all waves up to current, plus current wave food eaten
    const totalWaves = data.wavesPerArena;
    const completedWaves = data.currentWave - 1;
    // Approximate: each wave's quota contributes equally to the bar
    const progress = data.waveFoodQuota > 0
      ? (completedWaves + data.waveFoodEaten / data.waveFoodQuota) / totalWaves
      : 0;

    // Green border
    ctx.strokeStyle = COLORS.uiAccent;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Yellow fill
    const fillWidth = Math.floor(barWidth * Math.min(1, progress));
    if (fillWidth > 0) {
      ctx.fillStyle = COLORS.score;
      ctx.fillRect(barX + 1, barY + 1, fillWidth - 2, barHeight - 2);
    }

    ctx.restore();
    ctx.restore();
  }

  private drawBottomHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    data: HUDData,
  ): void {
    const { hudBottom } = layout;
    const padding = 16;
    const scaleFactor = Math.max(1, Math.min(1.5, hudBottom.height / 50));
    const fontSize = Math.min(Math.floor(11 * scaleFactor), Math.floor(hudBottom.width / 40));

    ctx.save();
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiText;

    const centerY = hudBottom.y + hudBottom.height / 2;

    ctx.textAlign = 'left';
    ctx.fillText(`LENGTH ${data.snakeLength}`, padding, centerY);

    // Power-up icons (right side)
    if (data.heldPowerUps.length > 0) {
      const iconSize = Math.min(20, Math.floor(hudBottom.height * 0.6));
      const iconGap = 4;
      let iconX = hudBottom.width - padding;

      ctx.textAlign = 'center';

      for (let i = data.heldPowerUps.length - 1; i >= 0; i--) {
        const pu = data.heldPowerUps[i]!;
        const def = getPowerUpDef(pu.id);

        iconX -= iconSize;

        // Icon background
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#333333';
        ctx.fillRect(iconX, centerY - iconSize / 2, iconSize, iconSize);
        ctx.restore();

        // Emoji icon
        ctx.font = `${Math.floor(iconSize * 0.7)}px serif`;
        ctx.fillText(def.icon, iconX + iconSize / 2, centerY);

        // Stack count
        if (pu.stackCount > 1) {
          ctx.font = `${Math.floor(iconSize * 0.35)}px ${FONT_FAMILY}`;
          ctx.fillStyle = COLORS.score;
          ctx.fillText(`${pu.stackCount}`, iconX + iconSize - 2, centerY + iconSize / 2 - 2);
          ctx.fillStyle = COLORS.uiText;
        }

        iconX -= iconGap;
      }
    }

    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    const fontSize = 12;
    ctx.save();
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.fillStyle = COLORS.score;
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
