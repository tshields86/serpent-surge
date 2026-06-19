// Settings screen — docs/DESIGN_SPEC.md §5 (mock: docs/mocks/serpent-surge-screens.html).
//
// Fixes the transparency bug — the backdrop is now fully opaque so the title
// menu never bleeds through. Uses the shared title, toggle, slider, CLOSE
// components from src/theme, so every Settings row matches its
// counterpart on every other modal.

import { safeAreaInsetTop } from '../rendering/Renderer';
import {
  applyScaledGlow,
  clearGlow,
  COLOR,
  displayFont,
  drawCloseButton,
  drawSlider,
  drawToggle,
  drawScreenTitle,
  fillBackground,
  hitTest,
  LETTER_SPACING,
  TEXT,
  type Bounds,
} from '../theme';

export interface GameSettings {
  musicVolume: number;  // 0-100
  sfxVolume: number;    // 0-100
  crtEnabled: boolean;
  muted: boolean;
  reducedMotion: boolean;
  playerName: string;
  leaderboardConsent: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 70,
  sfxVolume: 80,
  crtEnabled: true,
  muted: false,
  reducedMotion: false,
  playerName: 'AAA',
  leaderboardConsent: false,
};

const NAME_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('');
const MAX_NAME_LENGTH = 10;

type ToggleKey = 'crtEnabled' | 'muted' | 'reducedMotion' | 'leaderboardConsent';
type SliderKey = 'musicVolume' | 'sfxVolume';

interface SliderRow { kind: 'slider'; label: string; key: SliderKey; }
interface ToggleRow { kind: 'toggle'; label: string; key: ToggleKey; }
type Row = SliderRow | ToggleRow;

const ROWS: Row[] = [
  { kind: 'slider', label: 'MUSIC',           key: 'musicVolume' },
  { kind: 'slider', label: 'SFX',             key: 'sfxVolume' },
  { kind: 'toggle', label: 'CRT EFFECT',      key: 'crtEnabled' },
  { kind: 'toggle', label: 'MUTED',           key: 'muted' },
  { kind: 'toggle', label: 'REDUCED MOTION',  key: 'reducedMotion' },
  { kind: 'toggle', label: 'LEADERBOARD',     key: 'leaderboardConsent' },
];

const PRIVACY_URL = 'https://serpentsurge.vercel.app/privacy';

export class SettingsScreen {
  private settings: GameSettings = { ...DEFAULT_SETTINGS };
  private visible = false;
  private closeBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private rowBounds: Bounds[] = [];
  private nameRowBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private nameCharBounds: Bounds[] = [];
  private nameAddBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private nameDelBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private privacyBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };

  show(settings: GameSettings): void {
    this.settings = { ...settings };
    this.visible = true;
  }
  hide(): void { this.visible = false; }
  isVisible(): boolean { return this.visible; }
  getSettings(): GameSettings { return { ...this.settings }; }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.visible) return;

    ctx.save();

    // Opaque backdrop — fixes the transparency bug from the prior pass.
    fillBackground(ctx, width, height);

    // Offset content below the safe-area inset.
    ctx.translate(0, safeAreaInsetTop);
    const usableHeight = height - safeAreaInsetTop;
    const scale = pickScale(width);

    // ===== Title =====
    const titleY = Math.floor(usableHeight * 0.075);
    drawScreenTitle(ctx, 'SETTINGS', width / 2, titleY, scale);

    // ===== Rows =====
    const padding = Math.max(24, width * 0.07);
    const rowWidth = Math.min(360 * scale, width - padding * 2);
    const rowX = (width - rowWidth) / 2;
    const rowHeight = Math.max(48, 50 * scale);
    const labelSize = Math.min(TEXT.cardName * scale, Math.floor(width / 36));

    let cursorY = titleY + 36 * scale;

    // Name row
    this.drawNameRow(ctx, rowX, cursorY, rowWidth, rowHeight, labelSize, scale);
    this.nameRowBounds = { x: rowX, y: cursorY, width: rowWidth, height: rowHeight };
    cursorY += rowHeight;

    // Setting rows
    this.rowBounds = [];
    for (let i = 0; i < ROWS.length; i++) {
      const row = ROWS[i]!;
      const y = cursorY + i * rowHeight;
      this.drawRow(ctx, row, rowX, y, rowWidth, rowHeight, labelSize, scale);
      this.rowBounds.push({ x: rowX, y, width: rowWidth, height: rowHeight });

      // Faint divider beneath every row except the last.
      if (i < ROWS.length - 1) {
        ctx.strokeStyle = COLOR.lineSoft;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rowX, y + rowHeight - 0.5);
        ctx.lineTo(rowX + rowWidth, y + rowHeight - 0.5);
        ctx.stroke();
      }
    }

    // ===== Privacy policy link =====
    const closeY = usableHeight - Math.max(36, 36 * scale);
    const linkY = closeY - Math.max(34, 34 * scale);
    const linkSize = Math.min(16 * scale, Math.floor(width / 26));
    ctx.save();
    ctx.font = displayFont(linkSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.greenDim;
    clearGlow(ctx);
    const linkText = 'PRIVACY POLICY';
    ctx.fillText(linkText, width / 2, linkY);
    const linkW = ctx.measureText(linkText).width;
    ctx.restore();
    this.privacyBounds = { x: width / 2 - linkW / 2 - 12, y: linkY - linkSize, width: linkW + 24, height: linkSize * 2 };

    // ===== CLOSE =====
    this.closeBounds = drawCloseButton(ctx, width / 2, closeY, scale);

    ctx.restore();
  }

  // ---- internal draw helpers ----

  private drawRow(
    ctx: CanvasRenderingContext2D,
    row: Row,
    rowX: number,
    y: number,
    rowWidth: number,
    rowHeight: number,
    labelSize: number,
    scale: number,
  ): void {
    const midY = y + rowHeight / 2;

    // Label
    ctx.save();
    ctx.font = displayFont(labelSize);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.bone;
    clearGlow(ctx);
    ctx.fillText(row.label, rowX, midY);
    ctx.restore();

    // Control on the right
    if (row.kind === 'toggle') {
      const on = this.settings[row.key];
      const toggleW = 46 * scale;
      const toggleH = 22 * scale;
      drawToggle(ctx, rowX + rowWidth - toggleW, midY - toggleH / 2, on, scale);
    } else {
      const sliderWidth = 130 * scale;
      drawSlider(ctx, rowX + rowWidth - sliderWidth, midY, sliderWidth, this.settings[row.key], scale);
    }
  }

  private drawNameRow(
    ctx: CanvasRenderingContext2D,
    rowX: number,
    y: number,
    rowWidth: number,
    rowHeight: number,
    labelSize: number,
    scale: number,
  ): void {
    const midY = y + rowHeight / 2;

    // Label
    ctx.save();
    ctx.font = displayFont(labelSize);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.bone;
    clearGlow(ctx);
    ctx.fillText('NAME', rowX, midY);
    ctx.restore();

    // Letters in gold + (+/-) controls on the right.
    const name = this.settings.playerName;
    const letterSize = Math.min(12 * scale, Math.floor(rowWidth / 22));
    const letterAdvance = letterSize * 1.4;
    const controlSize = Math.min(11 * scale, Math.floor(rowWidth / 24));
    const controlAdvance = controlSize * 1.5;

    const lettersWidth = name.length * letterAdvance;
    const controlsWidth = controlAdvance * 2;
    const lettersStartX = rowX + rowWidth - controlsWidth - lettersWidth + letterAdvance / 2;

    ctx.save();
    ctx.font = displayFont(letterSize);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    applyScaledGlow(ctx, 'gold', scale);
    ctx.fillStyle = COLOR.gold;
    this.nameCharBounds = [];
    for (let i = 0; i < name.length; i++) {
      const cx = lettersStartX + i * letterAdvance;
      ctx.fillText(name[i]!, cx, midY);
      this.nameCharBounds.push({
        x: cx - letterAdvance / 2,
        y,
        width: letterAdvance,
        height: rowHeight,
      });
    }
    clearGlow(ctx);

    // + / - controls (drawn as path triangles so they line up vertically with letters)
    const addX = lettersStartX + name.length * letterAdvance - letterAdvance / 2 + controlAdvance * 0.4;
    const subX = addX + controlAdvance;
    const ctrlSize = controlSize * 0.6;

    ctx.font = displayFont(controlSize);
    ctx.textAlign = 'center';
    if (name.length < MAX_NAME_LENGTH) {
      ctx.fillStyle = COLOR.green;
      ctx.fillText('+', addX, midY);
      this.nameAddBounds = { x: addX - controlAdvance / 2, y, width: controlAdvance, height: rowHeight };
    } else {
      this.nameAddBounds = { x: 0, y: 0, width: 0, height: 0 };
    }
    if (name.length > 1) {
      // Minus rendered as a horizontal bar (avoids the hyphen ambiguity).
      ctx.fillStyle = COLOR.coral;
      const barW = ctrlSize * 1.4;
      const barH = Math.max(2, ctrlSize * 0.22);
      ctx.fillRect(subX - barW / 2, midY - barH / 2, barW, barH);
      this.nameDelBounds = { x: subX - controlAdvance / 2, y, width: controlAdvance, height: rowHeight };
    } else {
      this.nameDelBounds = { x: 0, y: 0, width: 0, height: 0 };
    }
    ctx.restore();

    // Letter-stepper hint — tiny ▲/▼ marks above and below each letter would
    // clutter the row at smaller sizes. Tap-top / tap-bottom semantics still apply
    // for incrementing / decrementing each letter.
    void LETTER_SPACING; // retain import for theme consistency
  }

  /** Returns 'changed' if settings updated, 'close' if close tapped, 'privacy' to open the policy, false otherwise. */
  handleClick(x: number, rawY: number, _width: number): 'changed' | 'close' | 'privacy' | false {
    if (!this.visible) return false;
    const y = rawY - safeAreaInsetTop;

    if (hitTest(this.closeBounds, x, y)) return 'close';
    if (hitTest(this.privacyBounds, x, y)) {
      window.open(PRIVACY_URL, '_blank');
      return 'privacy';
    }

    // Name cycle by tapping a letter (top half = next, bottom half = prev)
    if (hitTest(this.nameRowBounds, x, y)) {
      const name = this.settings.playerName;
      for (let i = 0; i < this.nameCharBounds.length; i++) {
        const b = this.nameCharBounds[i]!;
        if (hitTest(b, x, y)) {
          const ch = name[i]!;
          const idx = NAME_CHARS.indexOf(ch.toUpperCase());
          const midY = b.y + b.height / 2;
          const nextIdx = y < midY
            ? (idx + 1) % NAME_CHARS.length
            : (idx - 1 + NAME_CHARS.length) % NAME_CHARS.length;
          this.settings.playerName =
            name.substring(0, i) + NAME_CHARS[nextIdx]! + name.substring(i + 1);
          return 'changed';
        }
      }
      if (this.nameAddBounds.width > 0 && hitTest(this.nameAddBounds, x, y)) {
        this.settings.playerName += 'A';
        return 'changed';
      }
      if (this.nameDelBounds.width > 0 && hitTest(this.nameDelBounds, x, y)) {
        this.settings.playerName = this.settings.playerName.slice(0, -1);
        return 'changed';
      }
    }

    // Setting rows
    for (let i = 0; i < ROWS.length; i++) {
      const row = ROWS[i]!;
      const b = this.rowBounds[i]!;
      if (!hitTest(b, x, y)) continue;
      if (row.kind === 'toggle') {
        this.settings[row.key] = !this.settings[row.key];
      } else {
        // Slider: anywhere from the slider's left edge to its right edge maps 0..100.
        const sliderWidth = b.width * 0.36;
        const sliderRight = b.x + b.width;
        const sliderLeft = sliderRight - sliderWidth;
        const pct = Math.max(0, Math.min(100,
          Math.round(((x - sliderLeft) / sliderWidth) * 100)));
        this.settings[row.key] = pct;
      }
      return 'changed';
    }

    return false;
  }
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}
