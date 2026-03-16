import { COLORS } from '../utils/constants';
import { Layout } from './Renderer';

const FONT_FAMILY = '"Press Start 2P", monospace';

export class UI {
  private scoreDisplay = 0;
  private scorePulseTimer = 0;

  update(dt: number, targetScore: number): void {
    // Animate score counting up
    if (this.scoreDisplay < targetScore) {
      this.scoreDisplay = Math.min(
        targetScore,
        this.scoreDisplay + Math.ceil((targetScore - this.scoreDisplay) * 0.2),
      );
    }

    // Pulse timer decay
    if (this.scorePulseTimer > 0) {
      this.scorePulseTimer = Math.max(0, this.scorePulseTimer - dt);
    }
  }

  triggerScorePulse(): void {
    this.scorePulseTimer = 0.15;
  }

  drawHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    score: number,
    snakeLength: number,
  ): void {
    this.drawTopHUD(ctx, layout, score);
    this.drawBottomHUD(ctx, layout, snakeLength);
  }

  private drawTopHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    _score: number,
  ): void {
    const { hudTop } = layout;
    const padding = 16;
    const fontSize = Math.min(14, Math.floor(hudTop.width / 30));

    ctx.save();
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';

    // Score (left side)
    const scorePulseScale = 1 + this.scorePulseTimer * 2;
    const centerY = hudTop.y + hudTop.height / 2;

    ctx.save();
    if (this.scorePulseTimer > 0) {
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

    ctx.restore();
  }

  private drawBottomHUD(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    snakeLength: number,
  ): void {
    const { hudBottom } = layout;
    const padding = 16;
    const fontSize = Math.min(11, Math.floor(hudBottom.width / 40));

    ctx.save();
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiText;

    const centerY = hudBottom.y + hudBottom.height / 2;

    // Length (left side)
    ctx.textAlign = 'left';
    ctx.fillText(`LENGTH ${snakeLength}`, padding, centerY);

    ctx.restore();
  }

  reset(): void {
    this.scoreDisplay = 0;
    this.scorePulseTimer = 0;
  }
}
