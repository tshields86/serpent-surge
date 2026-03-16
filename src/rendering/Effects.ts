export class Effects {
  private crtCanvas: HTMLCanvasElement | null = null;
  private crtWidth = 0;
  private crtHeight = 0;

  /** Rebuild the CRT overlay when canvas size changes */
  private ensureCRT(width: number, height: number): HTMLCanvasElement {
    if (this.crtCanvas && this.crtWidth === width && this.crtHeight === height) {
      return this.crtCanvas;
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const octx = offscreen.getContext('2d')!;

    // Scanlines: thin dark lines every 3px
    octx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < height; y += 3) {
      octx.fillRect(0, y, width, 1);
    }

    // Vignette: radial gradient darkening at edges
    const gradient = octx.createRadialGradient(
      width / 2, height / 2, height * 0.3,
      width / 2, height / 2, height * 0.8,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    octx.fillStyle = gradient;
    octx.fillRect(0, 0, width, height);

    this.crtCanvas = offscreen;
    this.crtWidth = width;
    this.crtHeight = height;
    return offscreen;
  }

  drawCRT(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const crt = this.ensureCRT(width, height);
    ctx.drawImage(crt, 0, 0);
  }
}
