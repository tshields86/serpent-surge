import { COLORS } from '../utils/constants';

export interface GameSettings {
  musicVolume: number;  // 0-100
  sfxVolume: number;    // 0-100
  crtEnabled: boolean;
  muted: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  crtEnabled: true,
  muted: false,
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
];

export class SettingsScreen {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private visible = false;

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

    // Close instruction
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = `${Math.min(9, Math.floor(width / 45))}px "Press Start 2P", monospace`;
    ctx.fillText('TAP TO TOGGLE • ESC TO CLOSE', width / 2, height - 30);

    ctx.restore();
  }

  /** Handle click — returns true if settings changed */
  handleClick(x: number, y: number, width: number): boolean {
    if (!this.visible) return false;

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
        return true;
      }
    }
    return false;
  }
}
