import { Snake, Direction } from '../game/Snake';
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
  private pulseTime = 0;

  update(dt: number): void {
    this.pulseTime += dt;
  }

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

      if (isHead) {
        // Head gets stronger glow + subtle pulse
        const pulse = 1 + Math.sin(this.pulseTime * 5) * 0.06;
        const headSize = (cellSize - padding * 2) * pulse;
        const offset = (cellSize - padding * 2 - headSize) / 2;

        ctx.globalAlpha = 1;
        ctx.shadowBlur = cellSize * 0.6;
        ctx.fillStyle = skin.headColor;
        ctx.beginPath();
        ctx.roundRect(
          Math.floor(px + padding + offset),
          Math.floor(py + padding + offset),
          headSize,
          headSize,
          radius,
        );
        ctx.fill();

        // Draw eyes
        ctx.shadowBlur = 0;
        this.drawEyes(ctx, px, py, cellSize, padding, snake.direction);
      } else {
        ctx.fillStyle = skin.bodyColor;
        // Ghost mode: body segments are translucent
        ctx.globalAlpha = isGhosting ? 0.4 : 1;
        ctx.shadowBlur = cellSize * 0.3;

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
    }

    ctx.restore();
  }

  private drawEyes(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    cellSize: number,
    padding: number,
    direction: Direction,
  ): void {
    const segSize = cellSize - padding * 2;
    const cx = px + padding + segSize / 2;
    const cy = py + padding + segSize / 2;
    const eyeRadius = Math.max(1.5, segSize * 0.1);
    const eyeOffset = segSize * 0.22;
    const pupilOffset = segSize * 0.06;

    // Determine eye positions based on direction
    let e1x: number, e1y: number, e2x: number, e2y: number;
    let pdx = 0, pdy = 0; // pupil direction offset

    switch (direction) {
      case Direction.UP:
        e1x = cx - eyeOffset; e1y = cy - eyeOffset * 0.5;
        e2x = cx + eyeOffset; e2y = cy - eyeOffset * 0.5;
        pdy = -pupilOffset;
        break;
      case Direction.DOWN:
        e1x = cx - eyeOffset; e1y = cy + eyeOffset * 0.5;
        e2x = cx + eyeOffset; e2y = cy + eyeOffset * 0.5;
        pdy = pupilOffset;
        break;
      case Direction.LEFT:
        e1x = cx - eyeOffset * 0.5; e1y = cy - eyeOffset;
        e2x = cx - eyeOffset * 0.5; e2y = cy + eyeOffset;
        pdx = -pupilOffset;
        break;
      case Direction.RIGHT:
      default:
        e1x = cx + eyeOffset * 0.5; e1y = cy - eyeOffset;
        e2x = cx + eyeOffset * 0.5; e2y = cy + eyeOffset;
        pdx = pupilOffset;
        break;
    }

    // Eye whites
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(e1x, e1y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x, e2y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 1;
    const pupilR = eyeRadius * 0.55;
    ctx.beginPath();
    ctx.arc(e1x + pdx, e1y + pdy, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x + pdx, e2y + pdy, pupilR, 0, Math.PI * 2);
    ctx.fill();
  }
}
