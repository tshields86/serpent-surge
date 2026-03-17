/** Detect system preference for reduced motion */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Colorblind-safe color remapping.
 *  Replaces red/green distinctions with blue/yellow patterns. */
export const COLORBLIND_COLORS = {
  // Snake: keep green but add high-contrast pattern
  snakeBody: '#00aaff',  // Blue instead of green
  snakeHead: '#44ccff',
  snakeGlow: '#00aaff',

  // Food: use shapes + patterns instead of just color
  apple: '#ffaa00',       // Orange-yellow instead of red
  goldenApple: '#ffdd44',
  shrinkPellet: '#8866ff', // Purple instead of blue
  speedFruit: '#44ccff',   // Bright blue
  bombFruit: '#ff6600',    // Stays orange

  // Hazards: high contrast
  hazard: '#ff4488',      // Pink instead of red
} as const;

/** Get color based on colorblind mode */
export function getAccessibleColor(
  normalColor: string,
  colorblindColor: string,
  colorblindMode: boolean,
): string {
  return colorblindMode ? colorblindColor : normalColor;
}

export interface AccessibilitySettings {
  colorblindMode: boolean;
  reducedMotion: boolean;
}

/** Apply accessibility settings to game rendering */
export function shouldShowParticles(settings: AccessibilitySettings): boolean {
  return !settings.reducedMotion;
}

export function shouldShowScreenShake(settings: AccessibilitySettings): boolean {
  return !settings.reducedMotion;
}

export function shouldShowCRT(settings: AccessibilitySettings): boolean {
  return !settings.reducedMotion;
}
