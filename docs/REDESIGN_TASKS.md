# Serpent Surge — Redesign Tasks

Ordered to minimize churn: shared foundation first, then propagate per screen.
Follow `../CLAUDE.md` workflow throughout — **atomic commits, commit frequently, no `--trailer` / no Co-Authored-By**.
**After every task that changes UI, verify with Playwright MCP at 390×844, 768×1024, and 1920×1080** and compare against the matching mock.

Reference: `DESIGN_SPEC.md` (rules) + the four `mocks/serpent-surge-*.html` mocks (visual source of truth).

---

## Phase A — Foundation (no churn, do first)

- [ ] Read `DESIGN_SPEC.md` end to end. Open all four mocks with Playwright and screenshot them for reference.
- [ ] Add `Press Start 2P` + `VT323` fonts (Google Fonts now; note self-hosting for the Capacitor phase).
- [ ] Create a single theme/token module (CSS vars or TS theme): all colors from §2.1, type scale §2.2, glow recipes §2.3, CRT scanline + vignette §2.4. One source of truth — no hardcoded colors elsewhere.
- [ ] Build shared UI components from §3: screen title, subtitle, CLOSE, primary/secondary button, toggle, slider, card, rarity chip, hazard tag, carousel dots, held chip.
- [ ] **Checkpoint:** render a component sandbox page; Playwright-verify at all three viewports; commit. **Pause here for a visual gut-check before propagating.**

## Phase B — Gameplay (canvas)

- [ ] Implement the new item + hazard glyphs in the canvas draw routines (geometry from `items.html` / `gameplay.html`). Food = rounded, hazards = hard/spiky/hazy.
- [ ] Apply the §4 color changes to the live objects: **Warp Hole purple→cyan**, Speed Fruit lime (≠ snake), keep Apple red (shape-disambiguated). Confirm legend ↔ canvas match.
- [ ] Snake: eyed directional head + body taper greens. Glow on snake + items via `shadowBlur`; no glow on grid.
- [ ] Top HUD: SCORE (gold) / ARENA (green) / pause (green outline); wave line `WAVE n OF 3 · FOOD x / y` + segmented fill bar.
- [ ] Bottom HUD: LENGTH + HELD pixel chips with stack counts (remove emoji).
- [ ] Arena in CRT bezel/vignette.
- [ ] **Checkpoint:** Playwright-verify gameplay at all three viewports vs `gameplay.html`; commit.

## Phase C — Title & menu

- [ ] Reorder menu (Daily → Collection → Leaderboard → hairline → How to Play → Settings); NEW pip on Daily; even rhythm; primary CTA with pulse (off under Reduced Motion).
- [ ] **Checkpoint:** Playwright-verify vs `screens.html`; commit.

## Phase D — Modals (apply shared chrome + per-screen upgrades; one commit each)

- [ ] **Settings** — opaque backdrop (**fix transparency bug**), toggles/sliders/name-stepper, green CLOSE. Verify; commit.
- [ ] **Collection** — gold Scales balance, full unlock list with state borders, Skins shelf, green CLOSE. Verify; commit.
- [ ] **Leaderboard** — top-3 gold ranks, highlighted player row, ALL TIME/DAILY tab states. Verify; commit.
- [ ] **How to Play** — glyphs on Food/Hazards pages + DEADLY/NEUTRAL tags; green CLOSE + shared chrome on text pages. Verify; commit.
- [ ] **Power-up selection** — rarity-bordered cards + pixel glyphs; COMMON/RARE/LEGENDARY (drop UNCOMMON). Verify; commit.
- [ ] **Game Over** — legible stats over darkened background, primary/secondary buttons, coral title. Verify; commit.

## Phase E — Polish & sweep

- [ ] Reduced Motion disables all non-essential animation; Colorblind grayscale check on every food/hazard.
- [ ] Consistency sweep: confirm coral appears **only** on danger, one title/CLOSE/toggle/slider everywhere.
- [ ] Regenerate the existing mock-screenshot harness and diff each screen against its design mock.
- [ ] **Final checkpoint:** all screens Playwright-verified at all three viewports; commit.
