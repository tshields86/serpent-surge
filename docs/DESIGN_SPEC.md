# Serpent Surge — Design Spec (v1)

> Visual + UX redesign spec for the App Store polish pass.
> **This doc is the rules. The HTML mocks are the visual source of truth.** When in doubt, match the mocks.
> **Goal: keep the retro CRT charm. This is discipline and polish, not a new aesthetic.**

---

## 0. How to use this with the mocks

Open these in a browser (Claude Code: render them with Playwright and screenshot for reference) before and while implementing. They define the target look:

| Mock file | Shows |
|---|---|
| `mocks/serpent-surge-design-system.html` | Palette, type, title-menu logic, buttons, CLOSE, rarity cards, HUD bits |
| `mocks/serpent-surge-items.html` | All food + hazard glyphs, recommended menu order, DEADLY/NEUTRAL tags |
| `mocks/serpent-surge-gameplay.html` | Top + bottom HUD, CRT-framed arena, eyed snake, items on grid, held chips |
| `mocks/serpent-surge-screens.html` | Title, Collection, Settings full screens |

Exact glyph geometry (SVG paths) lives inside `mocks/serpent-surge-items.html` and `mocks/serpent-surge-gameplay.html` — use them as the reference when writing the canvas draw routines.

---

## 1. Principles

1. **Every color means exactly one thing.** Color is a language, not decoration. Don't reuse a color for an unrelated purpose.
2. **For items: shape says what it does, color says identity, danger gets its own visual language.** A player should be able to read "eat" vs "avoid" from silhouette alone (this is also what makes Colorblind mode work).
3. **Glow is the signature.** Use it consistently (titles, the snake, items). Don't add other decorative effects competing with it.
4. **Restraint everywhere else.** Even spacing, one title treatment, one CLOSE, one toggle, one slider — reused on every screen.
5. **Accessibility is first-class.** Reduced Motion disables animation; Colorblind relies on shape redundancy; respect minimum legible sizes.

---

## 2. Tokens

### 2.1 Color

| Token | Hex | Role — used for **only** this |
|---|---|---|
| `bg` | `#070b08` | App background (phosphor-black) |
| `surface` | `#0c120d` | Panels / cards |
| `green` (PHOSPHOR) | `#36f87a` | Brand, UI, navigation, **the snake** |
| `green-dim` | `#3f9d63` | Secondary text, inactive nav, labels |
| `green-deep` | `#1f5c39` | Hints, inactive states, grid lines, eyebrows |
| `gold` | `#ffc24b` | Score, **Scales** currency, **Legendary** rarity |
| `cyan` | `#49d8ff` | **Rare** rarity, neutral/non-deadly items |
| `bone` (white) | `#e9f3ea` | **Common** rarity, body text |
| `coral` | `#ff5566` | **DANGER ONLY** — Game Over, deadly hazards, DEADLY tag |

**Item / hazard colors** (these are identity colors — must be applied to the in-game rendered objects, see §4):

| Item | Hex | Notes |
|---|---|---|
| Apple | `#ff4d52` | Iconic red kept; disambiguated from hazards by shape |
| Golden Apple | `#ffc24b` | + sparkle + halo |
| Shrink Pellet | `#49d8ff` | cyan = non-deadly |
| Speed Fruit | `#5cff5c` | lime — **deliberately ≠ snake green** so it never blends |
| Bomb Fruit | `#ff8c28` | orange |
| Wall Block | `#8a2b2b` (brick lines `#5a1818`) | dark maroon, hard square |
| Spike Trap | `#ff4d52` (base `#7a2a2e`) | red when active/deadly |
| Poison Trail | `#a64dff` (bubbles `#d6a3ff`) | purple now means **poison/deadly only** |
| Warp Hole | `#49d8ff` | **moved off purple → cyan** (it's harmless) |
| Magnet | `#ffa033` (poles `#e9f3ea`) | amber, neutral hazard |

Snake body taper (head→tail): `#36f87a → #34ef76 → #31e070 → #2ed369 → #2bc763 → #28ba5c → #26ad56 → #23a050 → #20934a`.
Grid lines: `rgba(54,248,122,0.07)`.

### 2.2 Typography

- **Display — `Press Start 2P`** — titles, logo, menu items, buttons, HUD numbers, card names, labels. ALL CAPS. Used in short bursts only.
- **Body — `VT323`** — descriptions, helper text, body copy. Runs small, so size up.

Load both (Google Fonts). **For the Capacitor native build, self-host the font files** so they work offline.

Relative type scale (let the existing responsive sizing math in `TECHNICAL_SPEC.md` scale these per device):

| Use | Face | ~mobile px |
|---|---|---|
| Logo | Press Start 2P | 30 (line-height 1.5) |
| Screen title | Press Start 2P | 15 (letter-spacing 2px) |
| Subtitle / section name (gold) | Press Start 2P | 11–12 |
| Menu item / button / HUD number | Press Start 2P | 11–15 |
| Card name / settings label | Press Start 2P | 9 |
| Rarity / hazard tag | Press Start 2P | 6–8 |
| Body / description | VT323 | 17–20 |

### 2.3 Glow (CSS reference; canvas equivalent below)

```
green text : text-shadow: 0 0 4px #36f87a, 0 0 12px rgba(54,248,122,.6), 0 0 24px rgba(54,248,122,.35);
gold text  : text-shadow: 0 0 4px #ffc24b, 0 0 14px rgba(255,194,75,.5);
cyan text  : text-shadow: 0 0 4px #49d8ff, 0 0 14px rgba(73,216,255,.5);
glyph/icon : filter: drop-shadow(0 0 5–8px <color @ .7–.9 alpha>);
```

On **canvas**, reproduce glow with `ctx.shadowColor = <color>` + `ctx.shadowBlur = 8–14` (reset to 0 after). The snake and items should glow; the grid should not.

### 2.4 CRT atmosphere

- **Scanlines:** full-screen overlay, `repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,.2) 3px, transparent 4px)`, `mix-blend-mode: multiply`, opacity ~`.55`. Gated by the **CRT Effect** setting.
- **Vignette / bezel:** `box-shadow: inset 0 0 90px rgba(0,0,0,.9)` on the screen frame — this is what makes the empty bands around the arena read as intentional.

---

## 3. Shared components (identical on every screen)

- **Screen title** — Press Start 2P, `green` + green glow, centered, fixed top margin. Same on all modals.
- **Screen subtitle** — Press Start 2P, `gold`, used for How-To-Play page names ("FOOD TYPES").
- **CLOSE** — `◄ CLOSE`, Press Start 2P ~10px, **`green-dim`, bottom-center.** **Never coral** (closing isn't destructive).
- **Primary button** — filled `green`, dark text `#04210f`, green glow. (e.g. Tap to Start, Try Again.)
- **Secondary button** — transparent, `bone` text, `line` border.
- **Toggle** — pill 46×22; ON = green fill + glowing green knob (right); OFF = dim knob (left).
- **Slider** — track + green fill + value in green (Press Start 2P).
- **Card** — `surface` bg, 2px border whose color = state/rarity (see below), radius ~10px.
- **Rarity chips** — `COMMON` (bone), `RARE` (cyan), `LEGENDARY` (gold). **Retire the word "UNCOMMON"** (current Power-up screen uses it; spec is COMMON/RARE/LEGENDARY everywhere).
- **Hazard tags** — `DEADLY` (coral outline) / `NEUTRAL` (cyan outline).
- **Carousel dots** — green-deep, active dot solid green + glow.
- **Held power-up chip** — 30×30 bordered tile + pixel glyph + optional gold stack-count badge.

---

## 4. Items, hazards & snake — **must reach game code, not just legends**

These are the changes most likely to be missed. The How-To-Play legend and the live canvas objects **must match**, or the legend will lie about what's on screen.

- **Redraw every food + hazard** as the new glyphs (geometry in the mocks). Food = soft/rounded; hazards = hard/spiky/hazy.
- **Warp Hole: purple → cyan.** Frees purple to mean "poison, deadly" only.
- **Resolve the red collision:** Apple stays red, but hazards must be distinguishable by **shape** (brick block, spikes, bubbling blob, horseshoe) so red no longer means both "food" and "death."
- **Speed Fruit = lime `#5cff5c`,** not snake-green, plus forward chevrons + motion streaks.
- **Snake head gets eyes** oriented to travel direction (instant legibility), and the **body dims toward the tail** (taper greens above).
- **Bomb / Golden** get their distinguishing marks (lit fuse / sparkle + halo).

---

## 5. Per-screen specs

**Title** — *mock: screens.html*
- Reorder menu: **Daily Challenge → Collection → Leaderboard → ─ hairline ─ → How to Play → Settings.**
- Gold `NEW` pip on Daily Challenge. Even vertical spacing. Logo upper third; "Tap to Start" primary CTA with its own breathing room (subtle pulse, disabled under Reduced Motion); menu anchored lower.

**Gameplay / HUD** — *mock: gameplay.html*
- Top: SCORE (gold) left · ARENA (green) center · pause (green outline) right.
- Wave line in plain words: `WAVE 2 OF 3 · FOOD 4 / 9` + a segmented bar that fills as food is eaten.
- Arena in the CRT bezel/vignette. (Whether to enlarge the arena on tall phones = tune live with Playwright; not fixed here.)
- Bottom: LENGTH left · HELD power-up chips right (pixel glyphs + stack counts, **no emoji**).

**Power-up selection** — *mock: design-system.html (cards)*
- Card border = rarity (bone/cyan/gold) + matching glow. Replace emoji with pixel glyphs. Use COMMON/RARE/LEGENDARY (no UNCOMMON).

**Game Over** — *current screenshot for reference*
- Title coral. Stats (Score/Length/Food) must stay legible — darken/blur the gameplay behind so it doesn't muddy the numbers. TRY AGAIN = primary green; SHARE / LEADERBOARD = secondary.

**Leaderboard** — *mock: design-system.html*
- Emphasize top 3 (rank number in gold). Highlight the player's own row (green left-border + tint). Clear ALL TIME (active) vs DAILY (inactive) tab states.

**Collection** — *mock: screens.html*
- Scales balance as a gold header (`◆ 350 SCALES`).
- Full unlock list with state borders: **OWNED** (green) / affordable (gold + cost) / locked (dim + cost). Unlocks per game design: Starting Length 4, Reroll, Arena Preview, Extra Life, Endless Mode. **Costs in the mock are placeholders — set real values.**
- Snake Skins shelf (cosmetic). Green CLOSE.

**Settings** — *mock: screens.html*
- **Fix the transparency bug: opaque backdrop.** The title menu must NOT bleed through.
- One toggle component + one slider component reused for every row (Music, SFX = sliders; CRT/Muted/Colorblind/Reduced Motion = toggles; Name = letter stepper). Green CLOSE.

**How to Play** — *mocks: items.html (Food/Hazards), current screenshots (text pages)*
- Food & Hazards pages: swap the colored dots for the new glyphs; add DEADLY/NEUTRAL tags on hazards.
- Text pages (Controls, Power-ups, Waves & Arenas, Scales & Unlocks): content is fine — just apply shared chrome (title treatment, **green CLOSE not red**, consistent spacing).

---

## 6. Accessibility

- **Reduced Motion:** disable the Tap-to-Start pulse, golden-apple pulse, and any non-essential animation.
- **Colorblind:** rely on the glyph shapes (already distinct); verify each food/hazard is recognizable in grayscale.
- Respect minimum legible sizes from the type scale; maintain contrast against `bg`.

---

## 7. Out of scope / decisions for later

- Final unlock costs and exact arena dimensions (tune live with Playwright).
- Audio is unaffected by this pass.
- Native packaging (Capacitor) is a later phase — but **self-host fonts** when you get there.

---

## 8. Definition of done

Every screen uses the shared title, CLOSE, buttons, toggles, sliders, cards, and rarity/tag components from §3; the in-game items match §4 and the How-To-Play legend; coral appears only on danger; and each screen has been Playwright-verified at 390×844, 768×1024, and 1920×1080.
