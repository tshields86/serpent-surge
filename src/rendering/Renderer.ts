import { COLORS, GRID_SIZE, HUD_HEIGHT_TOP, HUD_HEIGHT_BOTTOM, LAYOUT_PADDING } from '../utils/constants';
import { COLOR as THEME } from '../theme';

/** Safe area inset (pixels) for screens to offset their content below notch/Dynamic Island */
export let safeAreaInsetTop = 0;

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
  safeAreaTop = 0;
  safeAreaBottom = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.measureSafeArea();
    this.layout = this.calculateLayout();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Measure safe area insets for notch/Dynamic Island devices */
  private measureSafeArea(): void {
    // First try CSS env() (works in Safari PWA mode)
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;' +
      'padding:env(safe-area-inset-top,0px) 0px env(safe-area-inset-bottom,0px) 0px;' +
      'visibility:hidden;pointer-events:none;z-index:-1;';
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    this.safeAreaTop = parseFloat(cs.paddingTop) || 0;
    this.safeAreaBottom = parseFloat(cs.paddingBottom) || 0;
    document.body.removeChild(probe);

    // Fallback for Capacitor iOS where env() returns 0:
    // Detect iPhone with notch/Dynamic Island by screen dimensions
    if (this.safeAreaTop === 0 && /iPhone/.test(navigator.userAgent)) {
      const h = screen.height;
      const w = screen.width;
      const longer = Math.max(h, w);
      const shorter = Math.min(h, w);

      if (longer >= 852 && shorter >= 393) {
        // Dynamic Island: iPhone 14 Pro, 15, 16 series (852+pt tall)
        this.safeAreaTop = 59;
        this.safeAreaBottom = 34;
      } else if (longer >= 812) {
        // Notch: iPhone X, XS, 11, 12, 13, 14 (812-844pt tall)
        this.safeAreaTop = 47;
        this.safeAreaBottom = 34;
      }
      // Older iPhones without notch: safe area = 0 (status bar handled by OS)
    }

    // Update the module-level export so screens can import it
    safeAreaInsetTop = this.safeAreaTop;
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.measureSafeArea();
    this.layout = this.calculateLayout();
  }

  private calculateLayout(): Layout {
    const windowWidth = this.canvas.width || window.innerWidth;
    const windowHeight = this.canvas.height || window.innerHeight;
    const safeTop = this.safeAreaTop;
    const safeBottom = this.safeAreaBottom;

    // Scale HUD heights for larger screens (tablets/desktops)
    const scaleFactor = Math.max(1, Math.min(1.5, windowHeight / 700));
    const hudTop = Math.floor(HUD_HEIGHT_TOP * scaleFactor);
    const hudBottom = Math.floor(HUD_HEIGHT_BOTTOM * scaleFactor);
    const padding = Math.floor(LAYOUT_PADDING * scaleFactor);

    const availableHeight = windowHeight - hudTop - hudBottom - padding * 2 - safeTop - safeBottom;
    const availableWidth = windowWidth - padding * 2;

    const playSize = Math.min(availableWidth, availableHeight);
    const cellSize = Math.floor(playSize / GRID_SIZE);
    const actualPlaySize = cellSize * GRID_SIZE;

    const playX = Math.floor((windowWidth - actualPlaySize) / 2);
    const playY = safeTop + hudTop + Math.floor((availableHeight - actualPlaySize) / 2) + padding;

    return {
      playArea: { x: playX, y: playY, size: actualPlaySize },
      cellSize,
      hudTop: { x: 0, y: safeTop, width: windowWidth, height: hudTop },
      hudBottom: { x: 0, y: playY + actualPlaySize, width: windowWidth, height: hudBottom },
    };
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(): void {
    const { playArea, cellSize } = this.layout;
    const ctx = this.ctx;

    // Spec §2.1: grid is a faint phosphor wash, not a dark gray.
    ctx.strokeStyle = THEME.gridLine;
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
