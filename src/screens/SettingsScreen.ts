import { COLORS } from '../utils/constants';

export interface GameSettings {
  musicVolume: number;  // 0-100
  sfxVolume: number;    // 0-100
  crtEnabled: boolean;
  muted: boolean;
  colorblindMode: boolean;
  reducedMotion: boolean;
  playerName: string;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  crtEnabled: true,
  muted: false,
  colorblindMode: false,
  reducedMotion: false,
  playerName: 'AAA',
};

const FONT_FAMILY = '"Press Start 2P", monospace';

const NAME_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('');
const MAX_NAME_LENGTH = 10;

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
  private nameCharBounds: { x: number; y: number; width: number; height: number }[] = [];
  private nameAddBounds = { x: 0, y: 0, width: 0, height: 0 };
  private nameDelBounds = { x: 0, y: 0, width: 0, height: 0 };

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
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiAccent;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 10;
    ctx.fillText('SETTINGS', width / 2, 50);
    ctx.shadowBlur = 0;

    // Player name row
    const rowHeight = 50;
    const startY = 100;
    const labelSize = Math.min(10, Math.floor(width / 40));
    const rowWidth = Math.min(320, width - 40);
    const rowX = (width - rowWidth) / 2;

    this.drawNameRow(ctx, rowX, startY, rowWidth, rowHeight, labelSize);

    // Setting rows (offset by 1 for name row)
    const settingsStartY = startY + rowHeight;

    for (let i = 0; i < ROWS.length; i++) {
      const row = ROWS[i]!;
      const y = settingsStartY + i * rowHeight;

      // Label
      ctx.font = `${labelSize}px ${FONT_FAMILY}`;
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
    const closeBtnY = settingsStartY + ROWS.length * rowHeight + 30;
    const closeSize = Math.min(12, Math.floor(width / 35));
    ctx.font = `${closeSize}px ${FONT_FAMILY}`;
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
    ctx.font = `${Math.min(9, Math.floor(width / 45))}px ${FONT_FAMILY}`;
    ctx.fillText('TAP TO TOGGLE • ESC TO CLOSE', width / 2, height - 30);

    ctx.restore();
  }

  private drawNameRow(
    ctx: CanvasRenderingContext2D,
    rowX: number,
    y: number,
    rowWidth: number,
    rowHeight: number,
    labelSize: number,
  ): void {
    // Label
    ctx.font = `${labelSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.uiText;
    ctx.fillText('Name', rowX, y + rowHeight / 2);

    // Character display — each letter is tappable to cycle
    const name = this.settings.playerName;
    const charSize = Math.min(12, Math.floor(labelSize * 1.2));
    ctx.font = `${charSize}px ${FONT_FAMILY}`;
    const charW = charSize * 1.8;
    const totalCharsWidth = name.length * charW;
    const controlsWidth = charW * 2.4; // space for +/- buttons
    const nameStartX = rowX + rowWidth - totalCharsWidth - controlsWidth;
    const charY = y + rowHeight / 2;

    this.nameCharBounds = [];
    for (let i = 0; i < name.length; i++) {
      const cx = nameStartX + i * charW;
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.score;
      ctx.fillText(name[i]!, cx + charW / 2, charY);

      // Up/down arrows
      const arrowSize = Math.max(6, charSize * 0.5);
      ctx.font = `${arrowSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#666';
      ctx.fillText('\u25B2', cx + charW / 2, charY - charSize * 0.9);
      ctx.fillText('\u25BC', cx + charW / 2, charY + charSize * 0.9);
      ctx.font = `${charSize}px ${FONT_FAMILY}`;

      this.nameCharBounds.push({
        x: cx,
        y: y,
        width: charW,
        height: rowHeight,
      });
    }

    // Add (+) and delete (-) buttons
    const btnX = nameStartX + name.length * charW + 4;
    ctx.textAlign = 'center';

    if (name.length < MAX_NAME_LENGTH) {
      ctx.fillStyle = COLORS.uiAccent;
      ctx.fillText('+', btnX + charW * 0.4, charY);
      this.nameAddBounds = { x: btnX, y, width: charW, height: rowHeight };
    } else {
      this.nameAddBounds = { x: 0, y: 0, width: 0, height: 0 };
    }

    if (name.length > 1) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText('-', btnX + charW * 1.4, charY);
      this.nameDelBounds = { x: btnX + charW, y, width: charW, height: rowHeight };
    } else {
      this.nameDelBounds = { x: 0, y: 0, width: 0, height: 0 };
    }
  }

  /** Handle click — returns 'changed' if settings changed, 'close' if close clicked, false otherwise */
  handleClick(x: number, y: number, width: number): 'changed' | 'close' | false {
    if (!this.visible) return false;

    // Check close button
    const cb = this.closeBounds;
    if (x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height) {
      return 'close';
    }

    // Check name character cycling
    const name = this.settings.playerName;
    for (let i = 0; i < this.nameCharBounds.length; i++) {
      const b = this.nameCharBounds[i]!;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        const ch = name[i]!;
        const idx = NAME_CHARS.indexOf(ch.toUpperCase());
        // Top half = next char, bottom half = prev char
        const midY = b.y + b.height / 2;
        const nextIdx = y < midY
          ? (idx + 1) % NAME_CHARS.length
          : (idx - 1 + NAME_CHARS.length) % NAME_CHARS.length;
        this.settings.playerName =
          name.substring(0, i) + NAME_CHARS[nextIdx]! + name.substring(i + 1);
        return 'changed';
      }
    }

    // Check add button
    const ab = this.nameAddBounds;
    if (ab.width > 0 && x >= ab.x && x <= ab.x + ab.width && y >= ab.y && y <= ab.y + ab.height) {
      this.settings.playerName += 'A';
      return 'changed';
    }

    // Check delete button
    const db = this.nameDelBounds;
    if (db.width > 0 && x >= db.x && x <= db.x + db.width && y >= db.y && y <= db.y + db.height) {
      this.settings.playerName = this.settings.playerName.slice(0, -1);
      return 'changed';
    }

    // Settings rows (offset by 1 for name row)
    const rowHeight = 50;
    const startY = 100 + rowHeight; // after name row
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
