// CRT atmosphere — spec §2.4. The offscreen canvas is pre-baked once per
// resize so the per-frame cost is a single drawImage.

export class Effects {
  private crtCanvas: HTMLCanvasElement | null = null;
  private crtWidth = 0;
  private crtHeight = 0;
  private crtEnabled = true;

  // Screen shake state
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private shakeEnabled = true;
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

    // Scanlines: 4px row — 1px dark line at y+2, the rest transparent.
    // 0.40 keeps the CRT texture visible without punching holes through small
    // dim-green labels and VT323 body copy.
    octx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    for (let y = 2; y < height; y += 4) {
      octx.fillRect(0, y, width, 1);
    }

    // Bezel vignette — a soft inset shadow ring around the screen edge.
    // Emulates the `inset 0 0 90px rgba(0,0,0,.9)` shadow on the mock's phone frame.
    const gradient = octx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.4,
      width / 2, height / 2, Math.max(width, height) * 0.72,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.55)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    octx.fillStyle = gradient;
    octx.fillRect(0, 0, width, height);

    this.crtCanvas = offscreen;
    this.crtWidth = width;
    this.crtHeight = height;
    return offscreen;
  }

  drawCRT(ctx: CanvasRenderingContext2D): void {
    if (!this.crtEnabled) return;
    const { width, height } = ctx.canvas;
    const crt = this.ensureCRT(width, height);
    ctx.drawImage(crt, 0, 0);
  }

  setCrtEnabled(enabled: boolean): void {
    this.crtEnabled = enabled;
  }

  /** Trigger screen shake — silently no-ops when shake is disabled (Reduced Motion). */
  triggerShake(duration: number, intensity: number): void {
    if (!this.shakeEnabled) return;
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  /** Disable shake — used by the Reduced Motion accessibility setting. */
  setShakeEnabled(enabled: boolean): void {
    this.shakeEnabled = enabled;
    if (!enabled) {
      this.shakeTimer = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
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
