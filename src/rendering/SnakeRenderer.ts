import { Snake } from '../game/Snake';
import { COLORS } from '../utils/constants';

import { lerp } from '../utils/math';
import { Layout } from './Renderer';

export interface SkinColors {
  bodyColor: string;
  headColor: string;
  glowColor: string;
}

const DEFAULT_SKIN: SkinColors = {
  bodyColor: COLORS.snakeBody,
  headColor: COLORS.snakeHead,
  glowColor: COLORS.snakeGlow,
};

export class SnakeRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    snake: Snake,
    layout: Layout,
    interpolation: number,
    isGhosting = false,
    skin: SkinColors = DEFAULT_SKIN,
  ): void {
    const { cellSize } = layout;
    const padding = Math.max(1, Math.floor(cellSize * 0.08));
    const radius = Math.max(2, Math.floor(cellSize * 0.2));

    // Draw glow layer first
    ctx.save();
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = cellSize * 0.4;
    ctx.globalAlpha = 0.2;

    for (let i = 0; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      const prev = snake.previousSegments[i];
      if (!seg || !prev) continue;

      const px = lerp(prev.x, seg.x, interpolation) * cellSize + layout.playArea.x;
      const py = lerp(prev.y, seg.y, interpolation) * cellSize + layout.playArea.y;

      ctx.fillStyle = skin.glowColor;
      ctx.beginPath();
      ctx.roundRect(
        Math.floor(px + padding),
        Math.floor(py + padding),
        cellSize - padding * 2,
        cellSize - padding * 2,
        radius,
      );
      ctx.fill();
    }

    ctx.restore();

    // Draw solid segments
    ctx.save();
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = cellSize * 0.3;

    for (let i = snake.segments.length - 1; i >= 0; i--) {
      const seg = snake.segments[i];
      const prev = snake.previousSegments[i];
      if (!seg || !prev) continue;

      const px = lerp(prev.x, seg.x, interpolation) * cellSize + layout.playArea.x;
      const py = lerp(prev.y, seg.y, interpolation) * cellSize + layout.playArea.y;

      const isHead = i === 0;
      ctx.fillStyle = isHead ? skin.headColor : skin.bodyColor;
      // Ghost mode: body segments are translucent
      if (isGhosting && !isHead) {
        ctx.globalAlpha = 0.4;
      } else {
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.roundRect(
        Math.floor(px + padding),
        Math.floor(py + padding),
        cellSize - padding * 2,
        cellSize - padding * 2,
        radius,
      );
      ctx.fill();
    }

    ctx.restore();
  }
}
