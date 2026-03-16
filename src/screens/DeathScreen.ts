import { COLORS } from '../utils/constants';
import { Layout } from '../rendering/Renderer';

const FONT_FAMILY = '"Press Start 2P", monospace';

export class DeathScreen {
  private opacity = 0;
  private fadeSpeed = 2; // per second

  update(dt: number): void {
    if (this.opacity < 1) {
      this.opacity = Math.min(1, this.opacity + this.fadeSpeed * dt);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    _layout: Layout,
    score: number,
    length: number,
    foodEaten: number,
  ): void {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;

    // Darken overlay
    ctx.save();
    ctx.globalAlpha = this.opacity * 0.7;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = this.opacity;

    // "GAME OVER" title
    const titleSize = Math.min(28, Math.floor(width / 16));
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.apple;
    ctx.fillText('GAME OVER', centerX, height * 0.3);

    // Stats
    const statSize = Math.min(12, Math.floor(width / 35));
    ctx.font = `${statSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiText;

    const statY = height * 0.42;
    const lineHeight = statSize * 2.5;

    ctx.fillStyle = COLORS.score;
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, centerX, statY);

    ctx.fillStyle = COLORS.uiText;
    ctx.fillText(`LENGTH: ${length}`, centerX, statY + lineHeight);
    ctx.fillText(`FOOD: ${foodEaten}`, centerX, statY + lineHeight * 2);

    // "TRY AGAIN" button
    const btnY = height * 0.65;
    const btnWidth = Math.min(240, width * 0.6);
    const btnHeight = 50;
    const btnX = centerX - btnWidth / 2;

    // Button background
    ctx.fillStyle = COLORS.snakeBody;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Button text
    const btnFontSize = Math.min(14, Math.floor(width / 30));
    ctx.font = `${btnFontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.background;
    ctx.fillText('TRY AGAIN', centerX, btnY + btnHeight / 2);

    ctx.restore();
  }

  isReady(): boolean {
    return this.opacity >= 0.8;
  }

  reset(): void {
    this.opacity = 0;
  }

  getButtonBounds(canvasWidth: number, canvasHeight: number): {
    x: number; y: number; width: number; height: number;
  } {
    const centerX = canvasWidth / 2;
    const btnY = canvasHeight * 0.65;
    const btnWidth = Math.min(240, canvasWidth * 0.6);
    const btnHeight = 50;
    return {
      x: centerX - btnWidth / 2,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
    };
  }
}
