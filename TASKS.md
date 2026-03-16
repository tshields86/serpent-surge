# TASKS.md — Serpent Surge

> Work through tasks sequentially. Check off each task after completing AND visually verifying it.
> Commit after every checked task. See CLAUDE.md for commit and Playwright MCP rules.

---

## Phase 0 — Project Setup

- [x] Initialize Vite + TypeScript project (`npm create vite@latest serpent-surge -- --template vanilla-ts`)
- [x] Configure `tsconfig.json` with strict mode, ES2020 target, DOM lib
- [x] Set up folder structure: `src/game/`, `src/rendering/`, `src/screens/`, `src/audio/`, `src/meta/`, `src/data/`, `src/utils/`
- [x] Create `src/utils/constants.ts` with color palette, grid size (20), timing defaults
- [x] Create `index.html` with viewport meta tag, `touch-action: none` CSS, full-screen canvas setup
- [x] Verify: page loads with black (#0a0a0a) background, canvas centered — **Playwright MCP screenshot**
- [x] Install dev dependencies: `vitest`
- [x] Create initial `.gitignore` (node_modules, dist, .DS_Store)
- [x] `git init` + initial commit

---

## Phase 1 — Core Snake (MVP)

### 1.1 — Grid & Canvas
- [ ] Create `src/rendering/Renderer.ts` — main renderer class that owns the canvas context
- [ ] Implement responsive canvas sizing: square play area, centered horizontally, fills height minus HUD space
- [ ] Create `src/game/Grid.ts` — 20x20 grid model, cell-to-pixel coordinate mapping
- [ ] Render faint grid lines (#1a1a1a) on the canvas
- [ ] Handle window resize: recalculate cell size, re-center canvas
- [ ] **Playwright MCP**: Screenshot at 390x844 (mobile) and 1920x1080 (desktop) — grid visible, square, centered

### 1.2 — Snake Movement
- [ ] Create `src/game/Snake.ts` — segments array, direction, nextDirection
- [ ] Implement tick-based movement: head moves in direction, body segments follow
- [ ] Create `src/rendering/SnakeRenderer.ts` — green (#00ff41) rounded rects, brighter head (#39ff14)
- [ ] Add glow effect (shadowBlur, 20% opacity #00ff41)
- [ ] Implement smooth lerp interpolation between ticks
- [ ] **Playwright MCP**: Screenshot — snake visible, green, glowing, smooth

### 1.3 — Input System
- [ ] Create `src/game/Input.ts` — unified input handler
- [ ] Keyboard controls (Arrow keys + WASD)
- [ ] Touch swipe detection (touchstart/touchend delta → direction)
- [ ] Input buffering: queue one direction change ahead of current tick
- [ ] Block 180-degree reversal
- [ ] Test: rapid direction changes feel responsive, no missed inputs

### 1.4 — Game Loop
- [ ] Create `src/game/Game.ts` — main game class with state machine
- [ ] Fixed timestep: 8 ticks/sec game logic, 60fps render with interpolation
- [ ] Game states enum: `TITLE`, `PLAYING`, `WAVE_TRANSITION`, `POWER_UP_SELECT`, `PAUSED`, `DEATH`
- [ ] Wire up: `main.ts` → Game instance → loop starts
- [ ] Verify: snake speed is consistent regardless of frame rate

### 1.5 — Collision Detection
- [ ] Create `src/game/Collision.ts` — collision helpers
- [ ] Wall collision: head hits boundary → death
- [ ] Self-collision: head overlaps body segment → death
- [ ] Unit tests for edge cases (boundary, U-turn at short length, exact corner)

### 1.6 — Food System (Basic)
- [ ] Create `src/game/Food.ts` — food spawning and management
- [ ] Spawn one apple at random empty cell
- [ ] Snake head reaches food → eat: grow +1, new food spawns, +10 score
- [ ] Render apple as red (#ff073a) circle/cluster
- [ ] Eat particle burst: colored particles expand outward, fade over ~300ms
- [ ] **Playwright MCP**: Screenshot with snake + food — food clearly red, distinct from snake

### 1.7 — Score & HUD
- [ ] Create `src/rendering/UI.ts` — HUD rendering on canvas
- [ ] Load pixel font (Press Start 2P, bundled woff2 or Google Fonts)
- [ ] Top HUD: score (left), arena/wave info (right)
- [ ] Bottom HUD: length, power-up icon slots (empty for now)
- [ ] Score counter animates briefly on change (scale pulse)
- [ ] **Playwright MCP**: Screenshot — HUD readable, positioned correctly, no overlap with play area

### 1.8 — Death & Restart
- [ ] Death animation: segments scatter outward + screen flash (white, 200ms fade)
- [ ] Create `src/screens/DeathScreen.ts` — overlay with final score, length, food eaten
- [ ] "Try Again" button resets state, starts new run
- [ ] **Playwright MCP**: Screenshot death screen — text readable, button clear

### 1.9 — Title Screen
- [ ] Create `src/screens/TitleScreen.ts`
- [ ] "SERPENT SURGE" in pixel font, green with glow
- [ ] Pulsing "TAP TO START" / "PRESS ENTER"
- [ ] Show high score below title
- [ ] Any input → transition to PLAYING
- [ ] **Playwright MCP**: Screenshot — polished, retro, inviting

### 1.10 — CRT Visual Effects
- [ ] Create `src/rendering/Effects.ts` — post-processing
- [ ] CRT scanlines: horizontal lines, 50% opacity, 2px spacing, cached on offscreen canvas
- [ ] Vignette: radial gradient darkening at edges
- [ ] Screen flash effect (death, wave clear)
- [ ] **Playwright MCP**: Screenshot — scanlines visible but not distracting, vignette subtle

### 1.11 — Basic Audio
- [ ] Install Tone.js: `npm install tone`
- [ ] Create `src/audio/AudioManager.ts`
- [ ] Synth SFX: eat (rising blip), death (descending buzz + static)
- [ ] Audio context init on first user interaction
- [ ] Mute toggle persisted to storage

### 1.12 — PWA Setup
- [ ] `public/manifest.json`: name, icons, theme #0a0a0a, display: standalone
- [ ] Basic service worker for offline caching
- [ ] PWA icons (16, 32, 192, 512px)
- [ ] Verify: installable on mobile, launches full-screen

### 1.13 — Phase 1 Polish & Playtest
- [ ] Play 10 full games — note feel issues
- [ ] Tune: tick rate, swipe sensitivity, death feel
- [ ] Mobile performance check (throttled CPU in devtools)
- [ ] `npm run build` — bundle < 200KB
- [ ] **Playwright MCP**: Full screenshot suite at mobile + desktop
- [ ] Git tag: `v0.1.0-mvp`

---

## Phase 2 — Roguelike Core

### 2.1 — Wave System
- [ ] Create `src/game/Arena.ts` — arena/wave progression
- [ ] Wave food quotas: W1=5, W2=8, W3=10
- [ ] HUD shows wave progress ("WAVE 2/3 — 4/8")
- [ ] Wave clear: 500ms pause, score tally floats up
- [ ] **Playwright MCP**: Screenshot wave HUD

### 2.2 — Arena Progression
- [ ] 3 waves = 1 arena. Arena clear resets grid, snake to length 3 at center
- [ ] Difficulty scaling: +2 food quota, +0.5 tick/sec per arena
- [ ] Power-ups retained across arenas
- [ ] Arena counter in HUD

### 2.3 — Hazard System
- [ ] Create `src/game/Hazard.ts` + `src/data/hazards.ts`
- [ ] **Wall Block**: static 1x1, spawns Wave 2+
- [ ] **Spike Trap**: toggles on/off every 4 ticks, red when active / dim when off
- [ ] **Poison Trail**: kills on contact, fades after 8 ticks
- [ ] Hazards spawn at wave start, count increases with arena
- [ ] Collision detection: snake vs hazards
- [ ] Unit tests for hazard behaviors
- [ ] **Playwright MCP**: Screenshot each hazard type — visually distinct, clearly dangerous

### 2.4 — Extended Food Types
- [ ] **Golden Apple**: 15% replace chance, +50 pts, pulsing gold (#ffd700 ↔ #ffaa00)
- [ ] **Shrink Pellet**: 10% after wave 3, -2 length (min 3), +25 pts, blue (#00bfff), smaller
- [ ] Distinct eat particles per food type
- [ ] **Playwright MCP**: Screenshot all food types on grid

### 2.5 — Power-Up Selection Screen
- [ ] Create `src/screens/PowerUpScreen.ts`
- [ ] Create `src/game/PowerUp.ts` + `src/data/powerups.ts`
- [ ] 3 cards: icon, name, rarity border, 1-line description
- [ ] Rarity borders: Common=white, Uncommon=blue, Rare=purple, Legendary=gold
- [ ] Tap to select: card zooms + sparkle, then resume gameplay
- [ ] Current held power-ups shown at bottom
- [ ] **Playwright MCP**: Screenshot — polished cards, readable, rarity clear

### 2.6 — Implement Core Power-Ups (10)
Implement one at a time, test each:
- [ ] **Ghost Mode** (Common): phase through tail 3s after eating — body turns translucent
- [ ] **Wall Wrap** (Common): exit one side → enter opposite — warp effect at edges
- [ ] **Venom Trail** (Common): tail leaves poison 3 ticks — green trail
- [ ] **Head Bash** (Common): destroy 1 wall block on contact, 1x per wave — shatter particles
- [ ] **Iron Gut** (Common): +2 length per food — thicker growth pulse
- [ ] **Scavenger** (Common): 2 food on grid simultaneously
- [ ] **Dash** (Uncommon): double-tap to skip 3 cells — motion blur trail
- [ ] **Time Dilation** (Uncommon): 30% slowdown 2s on near-miss — screen tint
- [ ] **Rewind** (Rare): undo death, rewind 3s, 1x per arena — VHS static effect
- [ ] **Singularity** (Rare): food within 3 cells drifts toward head — pull lines
- [ ] Unit tests for each power-up effect
- [ ] **Playwright MCP**: Screenshot each power-up active — visual effects match descriptions

### 2.7 — Power-Up Stacking & HUD
- [ ] Power-ups accumulate across arenas within a run
- [ ] Icons in bottom HUD for active power-ups
- [ ] Temporary effects show countdown timer on icon
- [ ] Duplicate power-ups stack (2x Scavenger = 3 food)
- [ ] **Playwright MCP**: Screenshot HUD with multiple icons

### 2.8 — Particle System
- [ ] Create `src/rendering/ParticleSystem.ts` — object-pooled (200 particles)
- [ ] Types: burst (eat), scatter (death), sparkle (power-up), trail (venom), shatter (wall bash)
- [ ] Per particle: position, velocity, lifetime, color, size, alpha decay
- [ ] **Playwright MCP**: Screenshot each particle type

### 2.9 — Transitions
- [ ] Wave clear: score float-up, flash, 500ms pause
- [ ] Arena clear: "ARENA CLEAR" text + scales earned, fade to power-up screen
- [ ] Arena start: fade in, snake at center, countdown "3, 2, 1, GO"
- [ ] **Playwright MCP**: Screenshot each transition

### 2.10 — Extended Audio
- [ ] Per-food-type eat sounds (blip, sparkle chord, descending tone)
- [ ] Wave clear fanfare, arena clear chord, power-up chime
- [ ] Hazard spawn warning pulse, near-miss whoosh

### 2.11 — Persistence
- [ ] Install `idb-keyval`
- [ ] Create `src/utils/storage.ts`
- [ ] Persist: high score, total scales, settings
- [ ] Load on startup, save on run end

### 2.12 — Phase 2 Polish & Playtest
- [ ] Play 15+ runs with power-up variety
- [ ] Tune: hazard rates, food quotas, tick scaling, power-up balance
- [ ] Verify: runs feel different based on power-up choices
- [ ] Mobile performance with particles active
- [ ] **Playwright MCP**: Full visual regression
- [ ] Git tag: `v0.2.0-roguelike-core`

---

## Phase 3 — Depth & Polish

### 3.1 — Remaining Power-Ups
- [ ] **Split Strike** (Rare): split into 2 snakes for 5s
- [ ] **Ouroboros** (Legendary): eating own tail heals, 1x per arena
- [ ] **Lucky** (Uncommon): always 1+ Uncommon in power-up choices
- [ ] **Afterimage** (Uncommon): decoy trail that fades
- [ ] **Shockwave** (Uncommon): eating pushes hazards 2 cells — ripple visual
- [ ] Tests for each

### 3.2 — Power-Up Synergies
- [ ] Synergy detection on power-up acquisition
- [ ] **Gluttony** (Ghost + Iron Gut): always phase through tail when length > 15
- [ ] **Warp Speed** (Wall Wrap + Dash): dash through wall → 1s invincibility
- [ ] **Toxic Blast** (Venom + Shockwave): shockwave leaves venom trail
- [ ] **Black Hole** (Scavenger + Singularity): all food drifts toward head
- [ ] Discovery notification on first trigger
- [ ] **Playwright MCP**: Screenshot synergy notification

### 3.3 — Remaining Hazards
- [ ] **Warp Hole** (pair): teleport snake to partner hole — purple swirl visual
- [ ] **Magnet**: pulls nearest food 1 cell/tick toward it — field lines visual
- [ ] Hazard variety scales with arena number

### 3.4 — Remaining Food Types
- [ ] **Speed Fruit**: 1.5x speed 3s, green (#39ff14), trailing particles
- [ ] **Bomb Fruit**: destroys 3x3 hazards on eat, orange (#ff6600), flashing

### 3.5 — Meta Progression
- [ ] Create `src/meta/Progression.ts` — scales currency + unlocks
- [ ] Scales formula: score/10 + 50/arena + 2/food
- [ ] Create `src/data/unlocks.ts` + `src/screens/CollectionScreen.ts`
- [ ] Unlocks: Starting Length 4 (100), Reroll (200), Arena Preview (300), Extra Life (500), Endless Mode (750)
- [ ] Persist to IndexedDB
- [ ] **Playwright MCP**: Screenshot collection screen

### 3.6 — Snake Skins
- [ ] 6-8 skins: Default, Crimson, Cyan, Solar, Phantom, Toxic, Ember, Void
- [ ] Cost 50-500 scales, cosmetic only
- [ ] Skin changes: body color, head color, glow, particle colors
- [ ] Selection in Collection screen, persisted
- [ ] **Playwright MCP**: Screenshot 3-4 skins in gameplay

### 3.7 — Achievements
- [ ] Create `src/meta/Achievements.ts` + `src/data/achievements.ts`
- [ ] 15+ achievements (see spec for list)
- [ ] Toast notification slides in from top, auto-dismiss 3s
- [ ] Achievement gallery in Collection screen
- [ ] **Playwright MCP**: Screenshot achievement toast

### 3.8 — Daily Challenge
- [ ] Create `src/meta/DailyChallenge.ts`
- [ ] Seeded RNG (mulberry32, seed = YYYYMMDD)
- [ ] Fixed spawns, layouts, offerings per seed
- [ ] Entry from title screen, personal daily best displayed
- [ ] Tests: same seed = same sequence

### 3.9 — Music
- [ ] Create `src/audio/Music.ts`
- [ ] 3 Tone.js synthwave loops: menu (chill), gameplay (layered intensity), death (drone)
- [ ] Crossfade on state transitions
- [ ] Separate music/SFX volume controls

### 3.10 — Juice & Feel
- [ ] Screen shake: death (300ms decay), bomb explosion (brief)
- [ ] Score pop animation on change
- [ ] Speed lines during dash
- [ ] Golden apple flash on eat
- [ ] Snake head subtle pulse (scale oscillation)
- [ ] **Playwright MCP**: Screenshot during shake effect

### 3.11 — Settings Screen
- [ ] Music volume, SFX volume, CRT toggle, curvature toggle, control type, reset progress
- [ ] Accessible from title + pause menu
- [ ] All persisted to IndexedDB
- [ ] **Playwright MCP**: Screenshot settings

### 3.12 — Pause Menu
- [ ] Pause button top-right (44x44px+ touch target)
- [ ] Overlay: Resume, Settings, Quit Run
- [ ] Escape key to toggle
- [ ] Full game loop pause

### 3.13 — Responsive Polish
- [ ] Test at: 320x568 (SE), 390x844 (14), 768x1024 (iPad), 1920x1080 (desktop)
- [ ] Touch targets ≥ 44px, fonts scale, cards reflow
- [ ] **Playwright MCP**: Screenshot all 4 viewports

### 3.14 — Phase 3 Playtest
- [ ] 20+ runs exploring builds
- [ ] Verify synergy discovery feels rewarding
- [ ] Verify meta progression pacing (unlocks feel earned)
- [ ] Daily challenge determinism verified
- [ ] 60fps with all effects on mobile
- [ ] Bundle < 500KB
- [ ] **Playwright MCP**: Complete visual regression
- [ ] Git tag: `v0.3.0-full-game`

---

## Phase 4 — Launch & Platform

### 4.1 — Leaderboard (Supabase)
- [ ] Supabase project setup
- [ ] Leaderboard table + anonymous auth
- [ ] Submit score on death, offline queue for sync
- [ ] Leaderboard screen: all-time top 50, daily top 50, personal history

### 4.2 — Social Sharing
- [ ] Canvas-to-PNG death screen capture
- [ ] Web Share API (mobile) / copy-to-clipboard (desktop)

### 4.3 — Endless Mode
- [ ] Unlocks at 750 scales
- [ ] No arenas — continuous, escalating difficulty
- [ ] Power-up every 15 food eaten
- [ ] Separate leaderboard

### 4.4 — Boss Arenas
- [ ] Every 5th arena: boss enemy snake on a pattern
- [ ] Boss leaves poison trail, speeds up
- [ ] Defeat → large scale bonus + guaranteed Rare+ power-up
- [ ] **Playwright MCP**: Screenshot boss arena

### 4.5 — Capacitor (iOS/Android)
- [ ] Capacitor setup, safe area insets, haptics plugin
- [ ] Test on real devices

### 4.6 — App Store Prep
- [ ] Icons, screenshots, description, privacy policy, age rating

### 4.7 — Analytics
- [ ] Minimal tracking via Supabase: runs, arenas reached, popular power-ups, daily challenge participation

### 4.8 — Accessibility
- [ ] Colorblind mode (patterns/shapes supplement color)
- [ ] Reduced motion option (disable particles, shake, CRT)
- [ ] `prefers-reduced-motion` auto-detect
- [ ] Lighthouse audit: 90+ Performance + Accessibility

### 4.9 — Launch
- [ ] Deploy web (Vercel/Netlify/Cloudflare Pages)
- [ ] Custom domain
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] Git tag: `v1.0.0`

---

## Backlog (Post-Launch)

- [ ] Real-time multiplayer arena mode
- [ ] Community level editor + sharing
- [ ] Seasonal power-up rotations
- [ ] Weekly challenge (hard modifiers)
- [ ] Replay system (record + share runs)
- [ ] Twitch integration (chat votes on power-ups)
