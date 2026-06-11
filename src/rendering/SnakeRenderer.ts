import { Snake, Direction } from '../game/Snake';
import { COLOR } from '../theme';
import { lerp } from '../utils/math';
import { Layout } from './Renderer';

export interface SkinColors {
  bodyColor: string;
  headColor: string;
  glowColor: string;
}

const DEFAULT_SKIN: SkinColors = {
  bodyColor: COLOR.green,
  headColor: COLOR.green,
  glowColor: COLOR.green,
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
    const segCount = snake.segments.length;

    // Soft glow layer behind everything
    ctx.save();
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = cellSize * 0.4;
    ctx.globalAlpha = isGhosting ? 0.08 : 0.18;

    for (let i = 0; i < segCount; i++) {
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

    // Body + head — drawn tail-first so head sits on top.
    ctx.save();
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = cellSize * 0.25;

    for (let i = segCount - 1; i >= 0; i--) {
      const seg = snake.segments[i];
      const prev = snake.previousSegments[i];
      if (!seg || !prev) continue;

      const px = lerp(prev.x, seg.x, interpolation) * cellSize + layout.playArea.x;
      const py = lerp(prev.y, seg.y, interpolation) * cellSize + layout.playArea.y;
      const isHead = i === 0;

      // Tapered body: lerp head -> body, then darken toward tail.
      const color = isHead
        ? skin.headColor
        : taperBody(skin.bodyColor, i, segCount);

      ctx.globalAlpha = isGhosting ? 0.4 : 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(
        Math.floor(px + padding),
        Math.floor(py + padding),
        cellSize - padding * 2,
        cellSize - padding * 2,
        radius,
      );
      ctx.fill();

      if (isHead) {
        // Eyes sit on the head's surface — drawn without glow so they read crisp.
        ctx.save();
        ctx.shadowBlur = 0;
        drawHeadEyes(ctx, px, py, cellSize, padding, snake.direction);
        ctx.restore();
      }
    }

    ctx.restore();
  }
}

/** Pixel-style eyes — two dark squares on the head's leading edge. */
function drawHeadEyes(
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
  const eyeSize = Math.max(2, Math.round(segSize * 0.18));
  const eyeRadius = Math.max(1, Math.round(eyeSize * 0.3));

  // Leading edge offset: eyes sit ~25% in from the head's leading edge,
  // and ~22% apart from each other on the perpendicular axis.
  const fwd = segSize * 0.22; // distance from center toward facing edge
  const side = segSize * 0.22; // pair spacing

  let e1x = cx, e1y = cy, e2x = cx, e2y = cy;
  switch (direction) {
    case Direction.UP:
      e1x = cx - side; e1y = cy - fwd;
      e2x = cx + side; e2y = cy - fwd;
      break;
    case Direction.DOWN:
      e1x = cx - side; e1y = cy + fwd;
      e2x = cx + side; e2y = cy + fwd;
      break;
    case Direction.LEFT:
      e1x = cx - fwd; e1y = cy - side;
      e2x = cx - fwd; e2y = cy + side;
      break;
    case Direction.RIGHT:
    default:
      e1x = cx + fwd; e1y = cy - side;
      e2x = cx + fwd; e2y = cy + side;
      break;
  }

  ctx.fillStyle = COLOR.primaryButtonText; // very dark green — sits on the head's green field
  paintEye(ctx, e1x, e1y, eyeSize, eyeRadius);
  paintEye(ctx, e2x, e2y, eyeSize, eyeRadius);
}

function paintEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, radius);
  ctx.fill();
}

/**
 * Darken `baseHex` proportionally to (i / total) so the snake fades head→tail.
 * Lerps each channel from 1.0× to ~0.55× across the body.
 */
function taperBody(baseHex: string, index: number, total: number): string {
  const t = Math.min(1, index / Math.max(1, total - 1));
  const factor = 1 - t * 0.45;
  return scaleHex(baseHex, factor);
}

function scaleHex(hex: string, factor: number): string {
  // Accept '#rgb' or '#rrggbb'.
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1]! + hex[1]!, 16);
    g = parseInt(hex[2]! + hex[2]!, 16);
    b = parseInt(hex[3]! + hex[3]!, 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  const scale = Math.max(0, Math.min(1, factor));
  const rr = Math.round(r * scale);
  const gg = Math.round(g * scale);
  const bb = Math.round(b * scale);
  return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}
