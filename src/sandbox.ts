// Component sandbox — renders every shared component from src/theme/components.ts
// at all three viewport sizes so we can Playwright-verify the foundation
// before propagating it to the live screens.

import {
  COLOR,
  TEXT,
  applyGlow,
  applyScaledGlow,
  bodyFont,
  clearGlow,
  displayFont,
  drawCarouselDots,
  drawCard,
  drawCloseButton,
  drawHazardTag,
  drawHeldChip,
  drawPrimaryButton,
  drawRarityChip,
  drawScanlines,
  drawScreenSubtitle,
  drawScreenTitle,
  drawSecondaryButton,
  drawSlider,
  drawToggle,
  drawVignette,
  fillBackground,
  type Bounds,
} from './theme';

const canvas = document.getElementById('sandbox-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// ---------------------------------------------------------------------------
// Section drawing helpers (sandbox-only chrome around each component)
// ---------------------------------------------------------------------------

interface Section {
  title: string;
  // measure → height in CSS px at the given content width
  measure: (width: number, scale: number) => number;
  // render at top-left (x, y) inside a column of contentWidth, returns drawn height
  render: (x: number, y: number, width: number, scale: number) => void;
}

function drawEyebrow(x: number, y: number, label: string, scale: number): void {
  ctx.save();
  ctx.font = displayFont(9 * scale);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = COLOR.green;
  clearGlow(ctx);
  ctx.fillText(`// ${label}`, x, y);
  ctx.restore();
}

function drawPanel(
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
): void {
  ctx.save();
  ctx.fillStyle = COLOR.surface;
  roundedRectPath(ctx, x, y, width, height, 10 * scale);
  ctx.fill();
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Word-wrap text into multiple lines centered at (cx, y). */
function wrapText(
  c: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  // Build the line list up front, then draw — the old in-loop draw-and-shift
  // pattern dropped a word at very narrow widths when the overflow test fired
  // on the last iteration.
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) { current = word; continue; }
    const candidate = `${current} ${word}`;
    if (c.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  for (let i = 0; i < lines.length; i++) {
    c.fillText(lines[i]!, cx, y + i * lineHeight);
  }
}

function roundedRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + w - radius, y);
  c.quadraticCurveTo(x + w, y, x + w, y + radius);
  c.lineTo(x + w, y + h - radius);
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  c.lineTo(x + radius, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
}

// ---------------------------------------------------------------------------
// Glyph painters (for the held-chip and rarity cards in the sandbox)
// ---------------------------------------------------------------------------

function drawWallWrapGlyph(c: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  // Two opposing arrows — "exit one side, enter the other"
  c.save();
  c.strokeStyle = COLOR.bone;
  c.lineWidth = Math.max(1.5, size * 0.08);
  c.lineCap = 'round';
  const r = size * 0.42;
  c.beginPath();
  c.moveTo(cx - r, cy);
  c.lineTo(cx + r * 0.3, cy);
  c.moveTo(cx + r * 0.3, cy);
  c.lineTo(cx + r * 0.1, cy - r * 0.4);
  c.moveTo(cx + r * 0.3, cy);
  c.lineTo(cx + r * 0.1, cy + r * 0.4);
  c.stroke();
  c.beginPath();
  c.moveTo(cx + r, cy + size * 0.18);
  c.lineTo(cx - r * 0.3, cy + size * 0.18);
  c.moveTo(cx - r * 0.3, cy + size * 0.18);
  c.lineTo(cx - r * 0.1, cy + size * 0.18 - r * 0.4);
  c.moveTo(cx - r * 0.3, cy + size * 0.18);
  c.lineTo(cx - r * 0.1, cy + size * 0.18 + r * 0.4);
  c.stroke();
  c.restore();
}

function drawSpeedBoltGlyph(c: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  c.save();
  c.fillStyle = COLOR.gold;
  const s = size * 0.5;
  c.beginPath();
  c.moveTo(cx - s * 0.3, cy - s);
  c.lineTo(cx + s * 0.2, cy - s * 0.1);
  c.lineTo(cx, cy - s * 0.1);
  c.lineTo(cx + s * 0.3, cy + s);
  c.lineTo(cx - s * 0.2, cy + s * 0.1);
  c.lineTo(cx, cy + s * 0.1);
  c.closePath();
  c.fill();
  c.restore();
}

function drawWarpRingsGlyph(c: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  c.save();
  c.strokeStyle = COLOR.cyan;
  c.lineWidth = Math.max(1.5, size * 0.08);
  c.globalAlpha = 0.55;
  c.beginPath();
  c.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 0.85;
  c.beginPath();
  c.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
  c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = COLOR.cyan;
  c.beginPath();
  c.arc(cx, cy, size * 0.14, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawGhostGlyph(c: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  c.save();
  c.fillStyle = COLOR.green;
  const w = size * 0.7;
  const h = size * 0.8;
  c.beginPath();
  c.moveTo(cx - w / 2, cy + h / 2);
  c.lineTo(cx - w / 2, cy - h / 4);
  c.quadraticCurveTo(cx - w / 2, cy - h / 2, cx, cy - h / 2);
  c.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 4);
  c.lineTo(cx + w / 2, cy + h / 2);
  c.lineTo(cx + w / 4, cy + h / 3);
  c.lineTo(cx, cy + h / 2);
  c.lineTo(cx - w / 4, cy + h / 3);
  c.closePath();
  c.fill();
  c.fillStyle = COLOR.primaryButtonText;
  c.fillRect(cx - w * 0.2, cy - h * 0.1, w * 0.12, w * 0.12);
  c.fillRect(cx + w * 0.08, cy - h * 0.1, w * 0.12, w * 0.12);
  c.restore();
}

function drawAppleGlyph(c: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  c.save();
  applyGlow(c, 'apple');
  c.fillStyle = COLOR.apple;
  c.beginPath();
  c.arc(cx, cy + size * 0.05, size * 0.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = COLOR.appleStem;
  c.fillRect(cx - size * 0.05, cy - size * 0.4, size * 0.1, size * 0.18);
  c.restore();
}

// ---------------------------------------------------------------------------
// Sections — each one demonstrates a component or a related family
// ---------------------------------------------------------------------------

function makeSection(
  title: string,
  fixedHeight: number,
  render: (x: number, y: number, w: number, scale: number) => void,
): Section {
  return {
    title,
    measure: (_w, s) => fixedHeight * s,
    render,
  };
}

const sections: Section[] = [
  makeSection('PALETTE', 240, (x, y, w, scale) => {
    drawPanel(x, y, w, 240 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'PALETTE — ONE MEANING EACH', scale);
    const swatches: [string, string, string][] = [
      ['PHOSPHOR', COLOR.green, 'Brand / snake'],
      ['GOLD', COLOR.gold, 'Score / Scales'],
      ['CYAN', COLOR.cyan, 'Rare / neutral'],
      ['BONE', COLOR.bone, 'Common / body'],
      ['CORAL', COLOR.coral, 'Danger ONLY'],
      ['DEEP GRN', COLOR.greenDeep, 'Hints / grid'],
    ];
    const cols = w > 480 * scale ? 6 : 3;
    const gap = 10 * scale;
    const swW = (w - 36 * scale - gap * (cols - 1)) / cols;
    const swH = 70 * scale;
    swatches.forEach((entry, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = x + 18 * scale + col * (swW + gap);
      const sy = y + 50 * scale + row * (swH + 28 * scale);
      ctx.fillStyle = entry[1];
      ctx.fillRect(sx, sy, swW, 36 * scale);
      ctx.font = displayFont(8 * scale);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = COLOR.bone;
      clearGlow(ctx);
      ctx.fillText(entry[0], sx, sy + 42 * scale);
      ctx.font = bodyFont(14 * scale);
      ctx.fillStyle = COLOR.greenDim;
      ctx.fillText(entry[2], sx, sy + 56 * scale);
    });
  }),

  makeSection('TYPE', 260, (x, y, w, scale) => {
    drawPanel(x, y, w, 260 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'TYPE — TWO FACES', scale);

    ctx.save();
    ctx.font = displayFont(11 * scale);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLOR.greenDeep;
    ctx.fillText('DISPLAY · Press Start 2P', x + 18 * scale, y + 46 * scale);
    ctx.font = displayFont(22 * scale);
    ctx.fillStyle = COLOR.green;
    applyScaledGlow(ctx, 'green', scale);
    ctx.fillText('SERPENT', x + 18 * scale, y + 66 * scale);
    ctx.fillText('SURGE', x + 18 * scale, y + 66 * scale + 30 * scale);

    clearGlow(ctx);
    const bx = x + 18 * scale;
    const by = y + 150 * scale;
    ctx.font = displayFont(11 * scale);
    ctx.fillStyle = COLOR.greenDeep;
    ctx.fillText('BODY · VT323', bx, by);
    ctx.font = bodyFont(20 * scale);
    ctx.fillStyle = COLOR.bone;
    ctx.fillText('Eat food to grow and clear waves.', bx, by + 26 * scale);
    ctx.fillStyle = COLOR.greenDim;
    ctx.fillText('Avoid walls, hazards, and your own tail.', bx, by + 52 * scale);
    ctx.restore();
  }),

  makeSection('TITLE TREATMENT', 110, (x, y, w, scale) => {
    drawPanel(x, y, w, 110 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'SHARED CHROME — TITLE + SUBTITLE', scale);
    drawScreenTitle(ctx, 'HOW TO PLAY', x + w / 2, y + 56 * scale, scale);
    drawScreenSubtitle(ctx, 'FOOD TYPES', x + w / 2, y + 86 * scale, scale);
  }),

  makeSection('CLOSE BUTTON', 90, (x, y, w, scale) => {
    drawPanel(x, y, w, 90 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'CLOSE — GREEN-DIM, NEVER CORAL', scale);
    drawCloseButton(ctx, x + w / 2, y + 60 * scale, scale);
  }),

  makeSection('BUTTONS', 220, (x, y, w, scale) => {
    drawPanel(x, y, w, 220 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'BUTTONS — PRIMARY · SECONDARY', scale);
    const btnW = Math.min(260 * scale, w - 60 * scale);
    const cx = x + (w - btnW) / 2;
    const btnH = 44 * scale;
    drawPrimaryButton(
      ctx,
      { x: cx, y: y + 48 * scale, width: btnW, height: btnH },
      'TRY AGAIN',
      { scale },
    );
    drawSecondaryButton(
      ctx,
      { x: cx, y: y + 48 * scale + btnH + 14 * scale, width: btnW, height: btnH },
      'SHARE',
      { scale },
    );
    drawSecondaryButton(
      ctx,
      { x: cx, y: y + 48 * scale + (btnH + 14 * scale) * 2, width: btnW, height: btnH },
      'LEADERBOARD',
      { scale },
    );
  }),

  makeSection('TOGGLE + SLIDER', 200, (x, y, w, scale) => {
    drawPanel(x, y, w, 200 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'TOGGLE · SLIDER · NAME LETTERS', scale);

    // Toggle row(s)
    const rowY = y + 56 * scale;
    ctx.save();
    ctx.font = displayFont(TEXT.cardName * scale);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLOR.bone;
    clearGlow(ctx);
    ctx.fillText('CRT EFFECT', x + 18 * scale, rowY);
    drawToggle(ctx, x + w - 46 * scale - 18 * scale, rowY - 11 * scale, true, scale);

    ctx.fillText('REDUCED MOTION', x + 18 * scale, rowY + 38 * scale);
    drawToggle(ctx, x + w - 46 * scale - 18 * scale, rowY + 38 * scale - 11 * scale, false, scale);

    // Slider row
    ctx.fillText('MUSIC', x + 18 * scale, rowY + 76 * scale);
    drawSlider(ctx, x + w - 130 * scale - 18 * scale, rowY + 76 * scale, 130 * scale, 70, scale);

    // Name letter stepper
    ctx.fillText('NAME', x + 18 * scale, rowY + 114 * scale);
    const letters = ['A', 'C', 'E'];
    let lx = x + w - 100 * scale;
    ctx.font = displayFont(12 * scale);
    ctx.fillStyle = COLOR.gold;
    applyScaledGlow(ctx, 'gold', scale);
    for (const l of letters) {
      ctx.fillText(l, lx, rowY + 114 * scale);
      lx += 14 * scale;
    }
    clearGlow(ctx);
    ctx.fillStyle = COLOR.green;
    ctx.fillText('+', lx + 6 * scale, rowY + 114 * scale);
    ctx.fillStyle = COLOR.coral;
    ctx.fillText('-', lx + 22 * scale, rowY + 114 * scale);
    ctx.restore();
  }),

  makeSection('RARITY CARDS', 280, (x, y, w, scale) => {
    drawPanel(x, y, w, 280 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'POWER-UP CARDS — BORDER = RARITY', scale);
    const rarities: { r: 'common' | 'rare' | 'legendary'; name: string; desc: string; glyph: (c: CanvasRenderingContext2D, cx: number, cy: number, sz: number) => void }[] = [
      { r: 'common', name: 'WALL WRAP', desc: 'Exit one side, enter the opposite.', glyph: drawWallWrapGlyph },
      { r: 'rare', name: 'TIME DILATION', desc: 'Slow time on a near-miss.', glyph: drawWarpRingsGlyph },
      { r: 'legendary', name: 'OUROBOROS', desc: 'Eating your tail heals you.', glyph: drawSpeedBoltGlyph },
    ];
    // Cards must fit inside the panel — size them to the column, not a fixed width.
    const sideInset = 18 * scale;
    const gap = 12 * scale;
    const available = w - sideInset * 2 - gap * 2;
    const cardW = Math.max(90 * scale, available / 3);
    const cardH = 200 * scale;
    let cx = x + sideInset;
    const cy = y + 60 * scale;

    rarities.forEach(({ r, name, desc, glyph }) => {
      drawCard(ctx, { x: cx, y: cy, width: cardW, height: cardH }, r, scale);
      // glyph
      glyph(ctx, cx + cardW / 2, cy + 42 * scale, 40 * scale);
      // name
      ctx.save();
      ctx.font = displayFont(TEXT.cardName * scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR.bone;
      clearGlow(ctx);
      wrapText(ctx, name, cx + cardW / 2, cy + 90 * scale, cardW - 14 * scale, 14 * scale);
      ctx.restore();
      // rarity chip
      drawRarityChip(ctx, cx + cardW / 2, cy + 124 * scale, r, scale);
      // desc
      ctx.save();
      ctx.font = bodyFont(15 * scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = COLOR.greenDim;
      wrapText(ctx, desc, cx + cardW / 2, cy + 140 * scale, cardW - 14 * scale, 18 * scale);
      ctx.restore();
      cx += cardW + gap;
    });
  }),

  makeSection('TAGS + DOTS', 130, (x, y, w, scale) => {
    drawPanel(x, y, w, 130 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'HAZARD TAGS · CAROUSEL DOTS', scale);
    drawHazardTag(ctx, x + 24 * scale, y + 54 * scale, 'deadly', scale);
    drawHazardTag(ctx, x + 100 * scale, y + 54 * scale, 'neutral', scale);
    drawCarouselDots(ctx, x + w / 2, y + 100 * scale, 7, 2, scale);
  }),

  makeSection('HELD CHIPS', 120, (x, y, w, scale) => {
    drawPanel(x, y, w, 120 * scale, scale);
    drawEyebrow(x + 18 * scale, y + 16 * scale, 'HELD POWER-UPS — PIXEL CHIPS', scale);
    let cx = x + 18 * scale;
    const cy = y + 48 * scale;
    cx += 8 * scale;
    drawHeldChip(ctx, cx, cy, drawGhostGlyph, null, scale);
    cx += 38 * scale;
    drawHeldChip(ctx, cx, cy, drawSpeedBoltGlyph, 2, scale);
    cx += 38 * scale;
    drawHeldChip(ctx, cx, cy, drawWarpRingsGlyph, null, scale);
    cx += 38 * scale;
    drawHeldChip(ctx, cx, cy, drawAppleGlyph, 3, scale);
  }),
];

// ---------------------------------------------------------------------------
// Layout — 1/2/3 columns depending on viewport width
// ---------------------------------------------------------------------------

function pickColumns(width: number): number {
  if (width >= 1280) return 3;
  if (width >= 720) return 2;
  return 1;
}

function pickScale(width: number): number {
  if (width >= 1600) return 1.4;
  if (width >= 1024) return 1.2;
  if (width >= 720) return 1.1;
  return 1;
}

function layout(): { width: number; height: number; scale: number; columnX: number[]; columnY: number[]; columnWidth: number } {
  const width = window.innerWidth;
  const cols = pickColumns(width);
  const scale = pickScale(width);
  const sideMargin = 24 * scale;
  const colGap = 24 * scale;
  const usable = width - sideMargin * 2;
  const columnWidth = (usable - colGap * (cols - 1)) / cols;
  const columnX: number[] = [];
  for (let i = 0; i < cols; i++) columnX.push(sideMargin + i * (columnWidth + colGap));

  // Document header
  const headerHeight = 110 * scale;
  const columnY = Array(cols).fill(headerHeight + 32 * scale);

  // Distribute sections to shortest column
  for (const s of sections) {
    const h = s.measure(columnWidth, scale) + 18 * scale; // 18 = bottom gap
    let shortest = 0;
    for (let i = 1; i < cols; i++) if (columnY[i] < columnY[shortest]) shortest = i;
    s.measure = ((origH: number) => () => origH)(h - 18 * scale); // pin for second render pass
    columnY[shortest] += h;
  }
  const height = Math.max(...columnY) + sideMargin;
  return { width, height, scale, columnX, columnY: Array(cols).fill(headerHeight + 32 * scale), columnWidth };
}

function render(): void {
  const { width, height, scale, columnX, columnY, columnWidth } = layout();

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  fillBackground(ctx, width, height);

  // Document header
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = displayFont(20 * scale);
  ctx.fillStyle = COLOR.green;
  applyScaledGlow(ctx, 'green', scale);
  ctx.fillText('SERPENT SURGE', width / 2, 50 * scale);
  clearGlow(ctx);
  ctx.font = bodyFont(20 * scale);
  ctx.fillStyle = COLOR.greenDim;
  ctx.fillText('COMPONENT SANDBOX  //  V1', width / 2, 86 * scale);
  ctx.restore();

  // Sections
  const ys = [...columnY];
  for (const s of sections) {
    let shortest = 0;
    for (let i = 1; i < ys.length; i++) if (ys[i]! < ys[shortest]!) shortest = i;
    const x = columnX[shortest]!;
    const y = ys[shortest]!;
    s.render(x, y, columnWidth, scale);
    const h = s.measure(columnWidth, scale);
    ys[shortest] = y + h + 18 * scale;
  }

  // CRT overlay last so it sits over everything (mocks have ~0.55 opacity)
  drawScanlines(ctx, width, height);
  drawVignette(ctx, width, height);
}

// helpful: log when fonts are ready so the screenshot harness can wait
document.fonts.ready.then(() => render());

window.addEventListener('resize', () => render());
render();

// Export Bounds so the module type-check sticks
export type { Bounds };
