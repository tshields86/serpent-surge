import { COLORS, GRID_SIZE, HUD_HEIGHT_TOP, HUD_HEIGHT_BOTTOM, LAYOUT_PADDING } from '../utils/constants';

export interface Layout {
  playArea: { x: number; y: number; size: number };
  cellSize: number;
  hudTop: { x: number; y: number; width: number; height: number };
  hudBottom: { x: number; y: number; width: number; height: number };
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  layout: Layout;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.layout = this.calculateLayout();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.layout = this.calculateLayout();
  }

  private calculateLayout(): Layout {
    const windowWidth = this.canvas.width || window.innerWidth;
    const windowHeight = this.canvas.height || window.innerHeight;

    const availableHeight = windowHeight - HUD_HEIGHT_TOP - HUD_HEIGHT_BOTTOM - LAYOUT_PADDING * 2;
    const availableWidth = windowWidth - LAYOUT_PADDING * 2;

    const playSize = Math.min(availableWidth, availableHeight);
    const cellSize = Math.floor(playSize / GRID_SIZE);
    const actualPlaySize = cellSize * GRID_SIZE;

    const playX = Math.floor((windowWidth - actualPlaySize) / 2);
    const playY = HUD_HEIGHT_TOP + Math.floor((availableHeight - actualPlaySize) / 2) + LAYOUT_PADDING;

    return {
      playArea: { x: playX, y: playY, size: actualPlaySize },
      cellSize,
      hudTop: { x: 0, y: 0, width: windowWidth, height: HUD_HEIGHT_TOP },
      hudBottom: { x: 0, y: playY + actualPlaySize, width: windowWidth, height: HUD_HEIGHT_BOTTOM },
    };
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(): void {
    const { playArea, cellSize } = this.layout;
    const ctx = this.ctx;

    ctx.strokeStyle = COLORS.gridLines;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= GRID_SIZE; i++) {
      const x = Math.floor(playArea.x + i * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, playArea.y);
      ctx.lineTo(x, playArea.y + playArea.size);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= GRID_SIZE; i++) {
      const y = Math.floor(playArea.y + i * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(playArea.x, y);
      ctx.lineTo(playArea.x + playArea.size, y);
      ctx.stroke();
    }
  }

  /** Convert grid coordinates to pixel coordinates (top-left of cell) */
  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.layout.playArea.x + gridX * this.layout.cellSize,
      y: this.layout.playArea.y + gridY * this.layout.cellSize,
    };
  }
}
