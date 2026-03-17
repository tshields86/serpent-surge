export class Effects {
  private crtCanvas: HTMLCanvasElement | null = null;
  private crtWidth = 0;
  private crtHeight = 0;

  // Screen shake state
  private shakeTimer = 0;
  private shakeIntensity = 0;
  shakeOffsetX = 0;
  shakeOffsetY = 0;

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

  /** Trigger screen shake */
  triggerShake(duration: number, intensity: number): void {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  /** Update shake each frame */
  updateShake(dtSec: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dtSec);
      const decay = this.shakeTimer / 0.3; // normalized remaining
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * decay;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * decay;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  /** Apply shake transform to canvas — call before rendering gameplay */
  applyShake(ctx: CanvasRenderingContext2D): void {
    if (this.shakeOffsetX !== 0 || this.shakeOffsetY !== 0) {
      ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
    }
  }
}
