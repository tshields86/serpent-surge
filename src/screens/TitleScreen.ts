import { COLORS } from '../utils/constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

export class TitleScreen {
  private pulseTimer = 0;

  update(dt: number): void {
    this.pulseTimer += dt;
  }

  draw(ctx: CanvasRenderingContext2D, highScore: number): void {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title: "SERPENT" on one line, "SURGE" on next
    const titleSize = Math.min(36, Math.floor(width / 12));
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;

    // Glow effect for title
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.snakeBody;

    const titleY = height * 0.3;
    ctx.fillText('SERPENT', centerX, titleY);
    ctx.fillText('SURGE', centerX, titleY + titleSize * 1.6);

    ctx.shadowBlur = 0;

    // Pulsing "TAP TO START" / "PRESS ENTER"
    const promptSize = Math.min(12, Math.floor(width / 35));
    ctx.font = `${promptSize}px ${FONT_FAMILY}`;
    const pulseAlpha = 0.4 + Math.sin(this.pulseTimer * 3) * 0.4 + 0.2;
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText('TAP TO START', centerX, height * 0.58);
    ctx.globalAlpha = 1;

    // High score
    if (highScore > 0) {
      const hsSize = Math.min(10, Math.floor(width / 40));
      ctx.font = `${hsSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.score;
      ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, centerX, height * 0.7);
    }

    ctx.restore();
  }
}
