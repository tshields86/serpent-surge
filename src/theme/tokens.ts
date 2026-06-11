// Serpent Surge — Design tokens (DESIGN_SPEC.md §2)
// Single source of truth. No hardcoded hex anywhere else.

export const COLOR = {
  // App
  bg: '#070b08',
  surface: '#0c120d',

  // Brand family (the snake, all UI nav, hierarchy by brightness)
  green: '#36f87a',       // PHOSPHOR — brand, snake, primary actions
  greenDim: '#3f9d63',    // secondary text, inactive nav, labels
  greenDeep: '#1f5c39',   // hints, inactive states, grid, eyebrows

  // Reserved meanings — never reused
  gold: '#ffc24b',        // score, Scales currency, LEGENDARY
  cyan: '#49d8ff',        // RARE, neutral / non-deadly items
  bone: '#e9f3ea',        // COMMON, body text
  coral: '#ff5566',       // DANGER ONLY — Game Over, deadly tag

  // Lines / borders
  line: 'rgba(54,248,122,0.16)',
  lineSoft: 'rgba(54,248,122,0.06)',
  gridLine: 'rgba(54,248,122,0.07)',

  // Items (identity colors — applied to live canvas objects, not just legends)
  apple: '#ff4d52',
  appleStem: '#3f9d63',
  goldenApple: '#ffc24b',
  goldenAppleStem: '#7a5a12',
  goldenAppleSparkle: '#ffe08a',
  shrinkPellet: '#49d8ff',
  shrinkPelletInk: '#04212b',
  speedFruit: '#5cff5c',           // lime — deliberately ≠ snake green
  speedFruitInk: '#04210f',
  bombFruit: '#ff8c28',
  bombFruitFuse: '#ffc24b',
  bombFruitSpark: '#ffe08a',

  // Hazards
  wallBlock: '#8a2b2b',
  wallBlockLine: '#5a1818',
  spikeTrap: '#ff4d52',            // red when active/deadly
  spikeTrapBase: '#7a2a2e',
  poisonTrail: '#a64dff',          // purple = poison (deadly) only
  poisonTrailBubble: '#d6a3ff',
  warpHole: '#49d8ff',             // moved from purple → cyan
  magnet: '#ffa033',
  magnetPole: '#e9f3ea',

  // Primary button face (inverse green for legibility on a green fill)
  primaryButtonText: '#04210f',
} as const;

// Snake body taper (head → tail), §2.1
export const SNAKE_TAPER: readonly string[] = [
  '#36f87a', '#34ef76', '#31e070', '#2ed369', '#2bc763',
  '#28ba5c', '#26ad56', '#23a050', '#20934a',
];

// Fonts (loaded in index.html)
export const FONT = {
  display: '"Press Start 2P", "Courier New", monospace',
  body: '"VT323", "Courier New", monospace',
} as const;

// Type scale §2.2 — base mobile sizes; renderer scales for tablet/desktop.
export const TEXT = {
  logo: 30,
  screenTitle: 15,
  sectionLabel: 12,    // gold subtitle ("FOOD TYPES")
  menuItem: 11,
  button: 12,
  closeButton: 10,
  hudValue: 15,
  hudLabel: 8,
  cardName: 9,
  rarityChip: 7,
  hazardTag: 7,
  helper: 10,
  bodyLg: 20,
  body: 18,
  bodySm: 16,
} as const;

export const LETTER_SPACING = {
  title: 2,
  nav: 1.5,
  label: 1,
  tag: 1,
} as const;

// Glow recipes §2.3 — canvas equivalent: ctx.shadowColor + ctx.shadowBlur.
// Use applyGlow() / clearGlow() helpers in src/theme/canvas.ts.
export const GLOW = {
  green:  { color: COLOR.green,  blur: 12 },
  greenS: { color: COLOR.green,  blur: 8  }, // small (icons / glyphs)
  gold:   { color: COLOR.gold,   blur: 14 },
  cyan:   { color: COLOR.cyan,   blur: 14 },
  coral:  { color: COLOR.coral,  blur: 14 },
  bone:   { color: COLOR.bone,   blur: 10 },
  apple:  { color: COLOR.apple,  blur: 8  },
  lime:   { color: COLOR.speedFruit, blur: 8 },
  orange: { color: COLOR.bombFruit, blur: 8 },
  purple: { color: COLOR.poisonTrail, blur: 8 },
  amber:  { color: COLOR.magnet, blur: 8 },
  none:   { color: 'transparent', blur: 0 },
} as const;

// CRT atmosphere §2.4 — exposed for the scanline/vignette draw helpers.
export const CRT = {
  scanlineColor: 'rgba(0,0,0,0.22)',
  scanlineOpacity: 0.55,
  vignetteShadow: 'rgba(0,0,0,0.9)',
  vignetteBlur: 90,
} as const;

export type GlowName = keyof typeof GLOW;
