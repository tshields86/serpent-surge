import { COLORS } from '../utils/constants';

export interface GameSettings {
  musicVolume: number;  // 0-100
  sfxVolume: number;    // 0-100
  crtEnabled: boolean;
  muted: boolean;
  colorblindMode: boolean;
  reducedMotion: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  crtEnabled: true,
  muted: false,
  colorblindMode: false,
  reducedMotion: false,
};

interface SettingsRow {
  label: string;
  key: keyof GameSettings;
  type: 'toggle' | 'slider';
}

const ROWS: SettingsRow[] = [
  { label: 'Music Volume', key: 'musicVolume', type: 'slider' },
  { label: 'SFX Volume', key: 'sfxVolume', type: 'slider' },
  { label: 'CRT Effect', key: 'crtEnabled', type: 'toggle' },
  { label: 'Muted', key: 'muted', type: 'toggle' },
  { label: 'Colorblind', key: 'colorblindMode', type: 'toggle' },
  { label: 'Reduced Motion', key: 'reducedMotion', type: 'toggle' },
];

export class SettingsScreen {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private visible = false;
  private closeBounds = { x: 0, y: 0, width: 0, height: 0 };

  show(settings: GameSettings): void {
    this.settings = { ...settings };
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.visible) return;

    ctx.save();
    // Backdrop
    ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
    ctx.fillRect(0, 0, width, height);

    // Title
    const titleSize = Math.min(18, Math.floor(width / 24));
    ctx.font = `${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiAccent;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 10;
    ctx.fillText('SETTINGS', width / 2, 50);
    ctx.shadowBlur = 0;

    // Rows
    const rowHeight = 50;
    const startY = 100;
    const labelSize = Math.min(10, Math.floor(width / 40));
    const rowWidth = Math.min(320, width - 40);
    const rowX = (width - rowWidth) / 2;

    for (let i = 0; i < ROWS.length; i++) {
      const row = ROWS[i]!;
      const y = startY + i * rowHeight;

      // Label
      ctx.font = `${labelSize}px "Press Start 2P", monospace`;
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.uiText;
      ctx.fillText(row.label, rowX, y + rowHeight / 2);

      // Value
      ctx.textAlign = 'right';
      if (row.type === 'toggle') {
        const val = this.settings[row.key] as boolean;
        ctx.fillStyle = val ? COLORS.uiAccent : '#666';
        ctx.fillText(val ? 'ON' : 'OFF', rowX + rowWidth, y + rowHeight / 2);
      } else {
        const val = this.settings[row.key] as number;
        // Slider bar
        const barX = rowX + rowWidth - 120;
        const barY = y + rowHeight / 2 - 3;
        const barW = 100;
        const barH = 6;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = COLORS.uiAccent;
        ctx.fillRect(barX, barY, barW * (val / 100), barH);
        // Value text
        ctx.fillStyle = COLORS.uiText;
        ctx.fillText(`${val}`, rowX + rowWidth, y + rowHeight / 2);
      }
    }

    // Close button
    const closeBtnY = startY + ROWS.length * rowHeight + 30;
    const closeSize = Math.min(12, Math.floor(width / 35));
    ctx.font = `${closeSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.fillText('CLOSE', width / 2, closeBtnY);
    const closeMetrics = ctx.measureText('CLOSE');
    this.closeBounds = {
      x: width / 2 - closeMetrics.width / 2 - 10,
      y: closeBtnY - closeSize,
      width: closeMetrics.width + 20,
      height: closeSize * 2,
    };

    // Hint
    ctx.fillStyle = '#666';
    ctx.font = `${Math.min(9, Math.floor(width / 45))}px "Press Start 2P", monospace`;
    ctx.fillText('TAP TO TOGGLE • ESC TO CLOSE', width / 2, height - 30);

    ctx.restore();
  }

  /** Handle click — returns 'changed' if settings changed, 'close' if close clicked, false otherwise */
  handleClick(x: number, y: number, width: number): 'changed' | 'close' | false {
    if (!this.visible) return false;

    // Check close button
    const cb = this.closeBounds;
    if (x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height) {
      return 'close';
    }

    const rowHeight = 50;
    const startY = 100;
    const rowWidth = Math.min(320, width - 40);
    const rowX = (width - rowWidth) / 2;

    for (let i = 0; i < ROWS.length; i++) {
      const row = ROWS[i]!;
      const ry = startY + i * rowHeight;

      if (x >= rowX && x <= rowX + rowWidth && y >= ry && y <= ry + rowHeight) {
        if (row.type === 'toggle') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.settings as any)[row.key] = !(this.settings[row.key] as boolean);
        } else {
          // Slider: map x to 0-100
          const barX = rowX + rowWidth - 120;
          const barW = 100;
          const pct = Math.max(0, Math.min(100, Math.round(((x - barX) / barW) * 100)));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.settings as any)[row.key] = pct;
        }
        return 'changed';
      }
    }
    return false;
  }
}
