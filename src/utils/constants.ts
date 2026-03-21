// === GRID ===
export const GRID_SIZE = 20;

// === TIMING ===
export const BASE_TICK_RATE = 8; // moves per second
export const RENDER_FPS = 60;
export const MAX_DELTA = 200; // ms, cap to prevent spiral of death

// === COLORS ===
export const COLORS = {
  background: '#0a0a0a',
  gridLines: '#1a1a1a',

  snakeBody: '#00ff41',
  snakeHead: '#39ff14',
  snakeGlow: '#00ff41',

  apple: '#ff073a',
  goldenApple: '#ffd700',
  goldenApplePulse: '#ffaa00',
  shrinkPellet: '#00bfff',
  speedFruit: '#39ff14',
  bombFruit: '#ff6600',

  hazard: '#ff0040',

  uiAccent: '#00ff41',
  uiText: '#e0e0e0',
  score: '#ffd700',
} as const;

// === LAYOUT ===
export const HUD_HEIGHT_TOP = 105;
export const HUD_HEIGHT_BOTTOM = 50;
export const LAYOUT_PADDING = 16;
