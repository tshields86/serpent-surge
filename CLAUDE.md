# CLAUDE.md — Serpent Surge

## Project Overview

Serpent Surge is a roguelike reimagining of Snake built with TypeScript + HTML5 Canvas + Vite. Target platforms: Web (PWA), mobile web, iOS/Android (Capacitor). See `SERPENT_SURGE_SPEC.md` for the full game design document.

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Rendering**: HTML5 Canvas API (no game framework)
- **Build**: Vite
- **Audio**: Tone.js for synthesized retro SFX
- **Persistence**: IndexedDB via idb-keyval
- **PWA**: Workbox service worker
- **Testing**: Vitest for unit tests
- **Visual QA**: Playwright MCP (see below)

---

## Git Practices

### Commit Frequently
- Commit after every meaningful change — do NOT batch large changes into single commits.
- Aim for small, atomic commits: one feature, one fix, one refactor per commit.
- Commit after completing each task or subtask from `TASKS.md`.
- Commit before and after any risky refactor.

### Commit Message Format
```
<type>: <short description>

<optional body with context>
```

**Types**: `feat`, `fix`, `refactor`, `style`, `perf`, `test`, `chore`, `docs`

**Examples**:
```
feat: add snake movement on 20x20 grid
feat: implement swipe controls with input buffering
fix: snake not dying on self-collision at length > 10
refactor: extract particle system into separate module
style: apply CRT scanline overlay to canvas
perf: reduce particle allocations with object pool
test: add collision detection unit tests
chore: configure vite for production build
```

### IMPORTANT: Do not use the `--trailer` flag or add `Co-Authored-By` / `Generated-by` signatures to commits. Keep commits clean with just the message.

### Git Commands
```bash
# Standard commit flow
git add -A
git commit -m "feat: description here"

# NEVER use:
# git commit --trailer "..."
# git commit -m "msg" --trailer "..."
```

---

## Visual QA with Playwright MCP

### Philosophy
This game must LOOK amazing. Do not assume UI/rendering is correct — verify it visually after implementing any visual feature. The game's aesthetic is core to its appeal.

### When to Use Playwright MCP
Use the Playwright MCP browser tools to visually verify the game after implementing:

1. **Any rendering change** — new visual elements, effects, animations
2. **Layout changes** — HUD positioning, screen composition, responsive sizing
3. **Color/style changes** — palette application, glow effects, CRT overlay
4. **New screens** — title screen, death screen, power-up selection
5. **New game entities** — food types, hazards, snake skins
6. **Particle effects** — eat particles, death explosion, power-up sparkle
7. **UI elements** — score display, wave counter, power-up icons
8. **Responsive behavior** — test at mobile and desktop viewport sizes

### Playwright MCP Workflow
```
1. Start the dev server: npm run dev
2. Use Playwright MCP to navigate to the localhost URL
3. Take a screenshot to verify the visual output
4. If something looks wrong, fix it and re-verify
5. Test at multiple viewport sizes:
   - Mobile: 390x844 (iPhone 14)
   - Tablet: 768x1024 (iPad)
   - Desktop: 1920x1080
6. Only commit after visual verification passes
```

### What to Check Visually
- Canvas fills the expected area and is centered
- Grid is visible but subtle (faint dark gray lines on #0a0a0a)
- Snake segments are bright green (#00ff41) with glow effect
- Snake head is distinguishable from body (#39ff14, brighter)
- Food items are correct colors and visually distinct from each other
- Hazards are clearly dangerous-looking (red/orange family)
- CRT scanline effect is present but not distracting
- HUD text is readable, properly positioned, pixel font renders correctly
- Particle effects fire on the right triggers and look satisfying
- Screen transitions are smooth with no flicker
- No visual glitches, z-order issues, or rendering artifacts
- Glow/bloom effects don't bleed or overflow outside intended bounds
- Vignette is subtle and doesn't obscure gameplay near edges

### Visual Regression Strategy
After each visual feature:
1. Screenshot with Playwright MCP
2. Compare what you see to the spec's color palette and layout descriptions
3. Fix discrepancies before moving to the next task
4. This prevents visual debt from accumulating across phases

---

## Code Style & Architecture

### File Organization
Follow the project structure defined in `TECHNICAL_SPEC.md`. Key rules:
- One class/module per file
- Game logic in `src/game/`
- Rendering in `src/rendering/`
- Screens in `src/screens/`
- Data definitions in `src/data/`
- Utilities in `src/utils/`

### TypeScript Conventions
- Strict mode enabled (`"strict": true` in tsconfig)
- Use `interface` for object shapes, `type` for unions/intersections
- Use `enum` for fixed sets (Direction, GameState, PowerUpRarity)
- No `any` — use `unknown` and type narrow when needed
- Prefer `const` over `let`, never use `var`
- Use `readonly` arrays/properties where mutation isn't needed

### Canvas Rendering Rules
- Clear and redraw every frame — no persistent canvas state
- Use `requestAnimationFrame` for the render loop
- Separate game logic tick rate from render frame rate (fixed timestep)
- Use interpolation (lerp) for smooth movement between ticks
- Always `ctx.save()` / `ctx.restore()` when applying transforms or composite operations
- Cache static elements on offscreen canvases (CRT overlay, grid lines)
- Use `Math.floor()` for pixel coordinates to avoid sub-pixel blur

### Performance Guidelines
- Object pool for particles — do not allocate/GC every frame
- Cache computed values (cell size, grid pixel offsets) on resize events, not per frame
- Minimize canvas state changes — batch draw calls by style
- Keep the main game loop allocation-free in steady state
- Profile on a throttled CPU before calling Phase 1 done
- Target: 60fps on a 2020 mid-range phone, <500KB bundle

### Game State Management
- Single `GameState` object is the source of truth for the running game
- State machine pattern for screen flow (TITLE → PLAYING → DEATH, etc.)
- Never mutate game state during the render pass — only during update ticks
- Power-up effects apply through a composable effect system, not scattered conditionals
- All randomness flows through the RNG utility (seeded for Daily Challenge, Math.random for normal)

---

## Testing Strategy

### Unit Tests (Vitest)
Write tests for:
- Collision detection (self, wall, hazard)
- Snake movement, direction change, and growth
- Power-up effect application, stacking, and synergy triggers
- Seeded RNG determinism (same seed = same sequence)
- Wave/arena progression logic
- Score and Scales calculation
- Input buffering behavior

### Visual Tests (Playwright MCP)
- Every new screen or visual element gets a screenshot verification
- Check responsive layout at 3 viewport sizes (mobile, tablet, desktop)
- Verify color palette accuracy against spec hex values
- Confirm CRT, glow, and particle effects render correctly

### Manual Playtesting
After each phase:
- Play 5+ complete runs
- Check feel: Are controls responsive? Is difficulty fair? Is the "one more run" urge there?
- Play on an actual mobile phone browser — not just a resized desktop window

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `SERPENT_SURGE_SPEC.md` | Full game design doc — source of truth for gameplay, visuals, audio |
| `TASKS.md` | Ordered task list with checkboxes — work through sequentially |
| `TECHNICAL_SPEC.md` | Architecture, data structures, algorithms, interfaces |
| `CLAUDE.md` | This file — development workflow and rules |

---

## Common Pitfalls to Avoid

1. **Don't over-engineer early** — Phase 1 is a playable Snake. Don't build the power-up system until Phase 2.
2. **Don't skip visual verification** — Use Playwright MCP. A game that "works" but looks broken is worthless.
3. **Don't forget input buffering** — Without it, fast swipes feel terrible on mobile. Queue one input ahead of the current tick.
4. **Don't mix game logic and rendering** — Update pass writes state, render pass reads state. Never cross the streams.
5. **Don't use DOM for in-game UI** — Everything during gameplay renders on canvas. DOM only for pre-game menus or settings overlays.
6. **Don't forget mobile viewport meta tag** — `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">` and `touch-action: none` CSS.
7. **Don't commit broken builds** — Run `npm run build` before committing. If TypeScript doesn't compile, fix first.
8. **Don't use `--trailer` on git commits** — Keep commits clean, no Co-Authored-By or Generated-by lines.

---

## Development Workflow (Repeat for Each Task)

```
1. Read the next unchecked task from TASKS.md
2. Implement the feature
3. Run `npm run dev` and verify with Playwright MCP (screenshot + check)
4. Run tests if applicable: `npm test`
5. Run `npm run build` to confirm it compiles
6. Git add + commit with a descriptive message (no --trailer)
7. Check off the task in TASKS.md and commit that too
8. Move to next task
```
