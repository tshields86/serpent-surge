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
- [x] Create `src/rendering/Renderer.ts` — main renderer class that owns the canvas context
- [x] Implement responsive canvas sizing: square play area, centered horizontally, fills height minus HUD space
- [x] Create `src/game/Grid.ts` — 20x20 grid model, cell-to-pixel coordinate mapping
- [x] Render faint grid lines (#1a1a1a) on the canvas
- [x] Handle window resize: recalculate cell size, re-center canvas
- [x] **Playwright MCP**: Screenshot at 390x844 (mobile) and 1920x1080 (desktop) — grid visible, square, centered

### 1.2 — Snake Movement
- [x] Create `src/game/Snake.ts` — segments array, direction, nextDirection
- [x] Implement tick-based movement: head moves in direction, body segments follow
- [x] Create `src/rendering/SnakeRenderer.ts` — green (#00ff41) rounded rects, brighter head (#39ff14)
- [x] Add glow effect (shadowBlur, 20% opacity #00ff41)
- [x] Implement smooth lerp interpolation between ticks
- [x] **Playwright MCP**: Screenshot — snake visible, green, glowing, smooth

### 1.3 — Input System
- [x] Create `src/game/Input.ts` — unified input handler
- [x] Keyboard controls (Arrow keys + WASD)
- [x] Touch swipe detection (touchstart/touchend delta → direction)
- [x] Input buffering: queue one direction change ahead of current tick
- [x] Block 180-degree reversal
- [x] Test: rapid direction changes feel responsive, no missed inputs

### 1.4 — Game Loop
- [x] Create `src/game/Game.ts` — main game class with state machine
- [x] Fixed timestep: 8 ticks/sec game logic, 60fps render with interpolation
- [x] Game states enum: `TITLE`, `PLAYING`, `WAVE_TRANSITION`, `POWER_UP_SELECT`, `PAUSED`, `DEATH`
- [x] Wire up: `main.ts` → Game instance → loop starts
- [x] Verify: snake speed is consistent regardless of frame rate

### 1.5 — Collision Detection
- [x] Create `src/game/Collision.ts` — collision helpers
- [x] Wall collision: head hits boundary → death
- [x] Self-collision: head overlaps body segment → death
- [x] Unit tests for edge cases (boundary, U-turn at short length, exact corner)

### 1.6 — Food System (Basic)
- [x] Create `src/game/Food.ts` — food spawning and management
- [x] Spawn one apple at random empty cell
- [x] Snake head reaches food → eat: grow +1, new food spawns, +10 score
- [x] Render apple as red (#ff073a) circle/cluster
- [x] Eat particle burst: colored particles expand outward, fade over ~300ms
- [x] **Playwright MCP**: Screenshot with snake + food — food clearly red, distinct from snake

### 1.7 — Score & HUD
- [x] Create `src/rendering/UI.ts` — HUD rendering on canvas
- [x] Load pixel font (Press Start 2P, bundled woff2 or Google Fonts)
- [x] Top HUD: score (left), arena/wave info (right)
- [x] Bottom HUD: length, power-up icon slots (empty for now)
- [x] Score counter animates briefly on change (scale pulse)
- [x] **Playwright MCP**: Screenshot — HUD readable, positioned correctly, no overlap with play area

### 1.8 — Death & Restart
- [x] Death animation: segments scatter outward + screen flash (white, 200ms fade)
- [x] Create `src/screens/DeathScreen.ts` — overlay with final score, length, food eaten
- [x] "Try Again" button resets state, starts new run
- [x] **Playwright MCP**: Screenshot death screen — text readable, button clear

### 1.9 — Title Screen
- [x] Create `src/screens/TitleScreen.ts`
- [x] "SERPENT SURGE" in pixel font, green with glow
- [x] Pulsing "TAP TO START" / "PRESS ENTER"
- [x] Show high score below title
- [x] Any input → transition to PLAYING
- [x] **Playwright MCP**: Screenshot — polished, retro, inviting

### 1.10 — CRT Visual Effects
- [x] Create `src/rendering/Effects.ts` — post-processing
- [x] CRT scanlines: horizontal lines, 50% opacity, 2px spacing, cached on offscreen canvas
- [x] Vignette: radial gradient darkening at edges
- [x] Screen flash effect (death, wave clear)
- [x] **Playwright MCP**: Screenshot — scanlines visible but not distracting, vignette subtle

### 1.11 — Basic Audio
- [x] Install Tone.js: `npm install tone`
- [x] Create `src/audio/AudioManager.ts`
- [x] Synth SFX: eat (rising blip), death (descending buzz + static)
- [x] Audio context init on first user interaction
- [x] Mute toggle persisted to storage

### 1.12 — PWA Setup
- [x] `public/manifest.json`: name, icons, theme #0a0a0a, display: standalone
- [x] Basic service worker for offline caching
- [x] PWA icons (16, 32, 192, 512px)
- [x] Verify: installable on mobile, launches full-screen

### 1.13 — Phase 1 Polish & Playtest
- [x] Play 10 full games — note feel issues
- [x] Tune: tick rate, swipe sensitivity, death feel
- [x] Mobile performance check (throttled CPU in devtools)
- [x] `npm run build` — bundle < 200KB (17KB game code + 64KB gzip Tone.js)
- [x] **Playwright MCP**: Full screenshot suite at mobile + desktop
- [x] Git tag: `v0.1.0-mvp`

---

## Phase 2 — Roguelike Core

### 2.1 — Wave System
- [x] Create `src/game/Arena.ts` — arena/wave progression
- [x] Wave food quotas: W1=5, W2=7, W3=9 (base + arena scaling)
- [x] HUD shows wave progress ("WAVE 1/3 — 0/5")
- [x] Wave clear: 500ms pause, score tally floats up
- [x] **Playwright MCP**: Screenshot wave HUD

### 2.2 — Arena Progression
- [x] 3 waves = 1 arena. Arena clear resets grid, snake to length 3 at center
- [x] Difficulty scaling: +2 food quota, +0.5 tick/sec per arena
- [x] Power-ups retained across arenas
- [x] Arena counter in HUD

### 2.3 — Hazard System
- [x] Create `src/game/Hazard.ts` + `src/data/hazards.ts`
- [x] **Wall Block**: static 1x1, spawns Wave 2+
- [x] **Spike Trap**: toggles on/off every 4 ticks, red when active / dim when off
- [x] **Poison Trail**: kills on contact, fades after 8 ticks
- [x] Hazards spawn at wave start, count increases with arena
- [x] Collision detection: snake vs hazards
- [x] Unit tests for hazard behaviors
- [x] **Playwright MCP**: Screenshot each hazard type — visually distinct, clearly dangerous

### 2.4 — Extended Food Types
- [x] **Golden Apple**: 15% replace chance, +50 pts, pulsing gold (#ffd700 ↔ #ffaa00)
- [x] **Shrink Pellet**: 10% after wave 3, -2 length (min 3), +25 pts, blue (#00bfff), smaller
- [x] Distinct eat particles per food type
- [x] **Playwright MCP**: Screenshot all food types on grid

### 2.5 — Power-Up Selection Screen
- [x] Create `src/screens/PowerUpScreen.ts`
- [x] Create `src/game/PowerUp.ts` + `src/data/powerups.ts`
- [x] 3 cards: icon, name, rarity border, 1-line description
- [x] Rarity borders: Common=white, Uncommon=blue, Rare=purple, Legendary=gold
- [x] Tap to select: card zooms + sparkle, then resume gameplay
- [x] Current held power-ups shown at bottom
- [x] **Playwright MCP**: Screenshot — polished cards, readable, rarity clear

### 2.6 — Implement Core Power-Ups (10)
Implement one at a time, test each:
- [x] **Ghost Mode** (Common): phase through tail 3s after eating — body turns translucent
- [x] **Wall Wrap** (Common): exit one side → enter opposite — warp effect at edges
- [x] **Venom Trail** (Common): tail leaves poison 3 ticks — green trail
- [x] **Head Bash** (Common): destroy 1 wall block on contact, 1x per wave — shatter particles
- [x] **Iron Gut** (Common): +2 length per food — thicker growth pulse
- [x] **Scavenger** (Common): 2 food on grid simultaneously
- [x] **Dash** (Uncommon): double-tap to skip 3 cells — motion blur trail
- [x] **Time Dilation** (Uncommon): 30% slowdown 2s on near-miss — screen tint
- [x] **Rewind** (Rare): undo death, rewind 3s, 1x per arena — VHS static effect
- [x] **Singularity** (Rare): food within 3 cells drifts toward head — pull lines
- [x] Unit tests for each power-up effect
- [x] **Playwright MCP**: Screenshot each power-up active — visual effects match descriptions

### 2.7 — Power-Up Stacking & HUD
- [x] Power-ups accumulate across arenas within a run
- [x] Icons in bottom HUD for active power-ups
- [x] Temporary effects show countdown timer on icon
- [x] Duplicate power-ups stack (2x Scavenger = 3 food)
- [x] **Playwright MCP**: Screenshot HUD with multiple icons

### 2.8 — Particle System
- [x] Create `src/rendering/ParticleSystem.ts` — object-pooled (200 particles)
- [x] Types: burst (eat), scatter (death), sparkle (power-up), trail (venom), shatter (wall bash)
- [x] Per particle: position, velocity, lifetime, color, size, alpha decay
- [x] **Playwright MCP**: Screenshot each particle type

### 2.9 — Transitions
- [x] Wave clear: score float-up, flash, 500ms pause
- [x] Arena clear: "ARENA CLEAR" text + scales earned, fade to power-up screen
- [x] Arena start: fade in, snake at center, countdown "3, 2, 1, GO"
- [x] **Playwright MCP**: Screenshot each transition

### 2.10 — Extended Audio
- [x] Per-food-type eat sounds (blip, sparkle chord, descending tone)
- [x] Wave clear fanfare, arena clear chord, power-up chime
- [x] Hazard spawn warning pulse, near-miss whoosh

### 2.11 — Persistence
- [x] Install `idb-keyval`
- [x] Create `src/utils/storage.ts`
- [x] Persist: high score, total scales, settings
- [x] Load on startup, save on run end

### 2.12 — Phase 2 Polish & Playtest
- [x] Play 15+ runs with power-up variety
- [x] Tune: hazard rates, food quotas, tick scaling, power-up balance
- [x] Verify: runs feel different based on power-up choices
- [x] Mobile performance with particles active
- [x] **Playwright MCP**: Full visual regression
- [x] Git tag: `v0.2.0-roguelike-core`

---

## Phase 3 — Depth & Polish

### 3.1 — Remaining Power-Ups
- [x] **Split Strike** (Rare): split into 2 snakes for 5s
- [x] **Ouroboros** (Legendary): eating own tail heals, 1x per arena
- [x] **Lucky** (Uncommon): always 1+ Uncommon in power-up choices
- [x] **Afterimage** (Uncommon): decoy trail that fades
- [x] **Shockwave** (Uncommon): eating pushes hazards 2 cells — ripple visual
- [x] Tests for each

### 3.2 — Power-Up Synergies
- [x] Synergy detection on power-up acquisition
- [x] **Gluttony** (Ghost + Iron Gut): always phase through tail when length > 15
- [x] **Warp Speed** (Wall Wrap + Dash): dash through wall → 1s invincibility
- [x] **Toxic Blast** (Venom + Shockwave): shockwave leaves venom trail
- [x] **Black Hole** (Scavenger + Singularity): all food drifts toward head
- [x] Discovery notification on first trigger
- [x] **Playwright MCP**: Screenshot synergy notification

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
