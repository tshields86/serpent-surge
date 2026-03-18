import { COLORS } from '../utils/constants';
import { Layout } from './Renderer';
import { PowerUpInstance, getPowerUpDef } from '../game/PowerUp';

const FONT_FAMILY = '"Press Start 2P", monospace';

export interface HUDData {
  score: number;
  snakeLength: number;
  waveProgress: string;
  arenaNumber: number;
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
    const fontSize = Math.min(14, Math.floor(hudTop.width / 30));

    ctx.save();
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';

    const centerY = hudTop.y + hudTop.height / 2;

    // Score (left side) with pulse
    ctx.save();
    if (this.scorePulseTimer > 0) {
      const scorePulseScale = 1 + this.scorePulseTimer * 2;
      const scoreText = `SCORE ${this.scoreDisplay.toLocaleString()}`;
      const metrics = ctx.measureText(scoreText);
      const textCenterX = padding + metrics.width / 2;
      ctx.translate(textCenterX, centerY);
      ctx.scale(scorePulseScale, scorePulseScale);
      ctx.translate(-textCenterX, -centerY);
    }
    ctx.fillStyle = COLORS.score;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${this.scoreDisplay.toLocaleString()}`, padding, centerY);
    ctx.restore();

    // Arena + Wave info (centered)
    const smallSize = Math.min(10, Math.floor(hudTop.width / 45));
    ctx.font = `${smallSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    const centerX = hudTop.width / 2;
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText(`ARENA ${data.arenaNumber}`, centerX, centerY - smallSize);
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText(data.waveProgress, centerX, centerY + smallSize);

    ctx.restore();
  }

  private drawBottomHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    data: HUDData,
  ): void {
    const { hudBottom } = layout;
    const padding = 16;
    const fontSize = Math.min(11, Math.floor(hudBottom.width / 40));

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
