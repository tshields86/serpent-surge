# Redesign Follow-ups

Polish items deferred during the App Store redesign — revisit before final QA.

## Gameplay / canvas

- [ ] **Scavenger held chip reads as alarmingly red.** `paintApple` in
  `src/rendering/PowerUpGlyphs.ts` uses the full-saturation `COLOR.apple`
  (#ff4d52). In a 30×30 HUD chip it stands out against the cool green/cyan/gold
  glyphs and pulls toward "danger". Options: desaturate to ~0.75× scale, switch
  Scavenger's chip glyph to gold (it's a value/score bonus), or replace with a
  basket icon.

- [ ] **Golden Apple halo is a thin ring, not a soft glow.** Replace the stroked
  arc in `drawGoldenApple` with a radial gradient halo so the pulse reads as
  "aura" rather than "outline".

- [ ] **Snake taper is subtle at smaller cell sizes.** The per-channel scale
  works at 1920 but is barely visible at 390. Either steepen the factor curve
  (currently `1 - t*0.45`, target maybe `1 - t*0.55`) or precompute the spec's
  SNAKE_TAPER stops directly when the default skin is in use.

- [ ] **Screenshot scene `?screenshot=gameplay` covers only Apple / Golden /
  Wall / Spike.** Add a `?screenshot=gameplay-all` (or extend gameplay) that
  places one of every food + hazard so the new glyph rendering can be
  Playwright-verified in one shot. Currently Speed Fruit, Bomb Fruit, Shrink
  Pellet, Poison Trail, Warp Hole, Magnet are coded but not visually verified.

## Foundation / sandbox

- [ ] **Sandbox card desc wrap drops a word** at very narrow column widths
  (e.g. 390 with 3 cards in one column). Cosmetic — only affects the sandbox,
  not the real screens.

## Infrastructure

- [ ] **Self-host Press Start 2P + VT323 for the Capacitor build.** The dev/web
  builds use Google Fonts; the iOS / Android Capacitor builds need offline
  font files. Flagged in `index.html` with a TODO comment.
