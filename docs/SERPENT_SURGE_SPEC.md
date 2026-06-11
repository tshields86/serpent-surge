# SERPENT SURGE — Game Design Spec

> A roguelike reimagining of Snake. Simple to learn, impossible to master, endlessly replayable.

---

## 1. Elevator Pitch

Classic Snake meets roguelike progression. Each run is a unique combination of procedural arenas, power-up choices, and escalating chaos. Swipe to move, survive as long as you can, make meaningful choices between runs. Think "Vampire Survivors meets Snake" — that dopamine loop of getting absurdly powerful before inevitably dying.

---

## 2. Target Platforms & Tech Stack

### Platforms (priority order)
1. **Web (PWA)** — primary, ship first
2. **Mobile web** — responsive, touch-first design
3. **iOS / Android** — wrap with Capacitor once web is solid

### Tech Stack
- **Engine**: HTML5 Canvas (no framework overhead, Snake doesn't need Phaser)
- **Language**: TypeScript
- **Build**: Vite
- **State Management**: Vanilla (simple game state object, no Redux needed)
- **Audio**: Tone.js for retro synth SFX + Web Audio API
- **PWA**: Workbox for service worker, manifest.json
- **Persistence**: IndexedDB via idb-keyval (run history, unlocks, settings)
- **Leaderboard**: Firebase (Firestore + Anonymous Auth) — phase 2
- **Native wrapper**: Capacitor — phase 3

### Performance Targets
- 60fps on mid-range phones (2020 era)
- < 500KB initial bundle
- Offline-capable after first load
- < 2 second time-to-interactive

---

## 3. Core Gameplay

### 3.1 The Basics
- Grid-based movement (classic Snake rules)
- Snake starts at length 3
- Eating food grows the snake by 1 segment
- Hitting yourself or a wall = death (unless you have a power-up)
- **Tick rate**: starts at ~8 moves/sec, scales up with difficulty

### 3.2 Controls
- **Mobile**: Swipe in 4 directions (up/down/left/right)
- **Desktop**: Arrow keys or WASD
- **Alternative mobile**: Virtual d-pad (toggle in settings)
- **Critical**: Input buffering — queue the next direction so fast swipes feel responsive. Allow one queued input ahead of current tick.

### 3.3 Grid & Camera
- **Grid size**: 20x20 cells (scales to fit screen)
- **Cell rendering**: Each cell is `canvas.width / gridSize` pixels
- **Aspect ratio**: Always square play area, centered on screen with UI above/below
- **No scrolling camera** — the whole grid is always visible

---

## 4. The Roguelike Layer

This is what makes it special. Each "run" consists of waves within an arena, and between waves you make choices.

### 4.1 Run Structure

```
START RUN
  → Arena 1 (3 waves)
    → Wave 1: Eat 5 food to clear
    → Wave 2: Eat 8 food, 1 hazard active
    → Wave 3: Eat 10 food, 2 hazards active
    → CHOOSE 1 OF 3 POWER-UPS
  → Arena 2 (3 waves, harder)
    → ...
    → CHOOSE 1 OF 3 POWER-UPS
  → Arena 3...
  → ...
  → BOSS ARENA (every 5 arenas)
DEATH → Score screen → Meta progression
```

### 4.2 Wave Mechanics
- Each wave has a **food quota** to clear it
- Food spawns one at a time (classic) but special food can spawn alongside
- As waves progress:
  - More hazards appear on the grid
  - Tick rate increases slightly
  - Enemy entities may spawn (phase 2)
- Clearing a wave gives a brief pause + score tally
- Between arenas, the grid resets and you pick a power-up

### 4.3 Food Types
| Food | Effect | Visual | Spawn Rate |
|------|--------|--------|------------|
| **Apple** | +1 length, +10 pts | Red pixel cluster | Always |
| **Golden Apple** | +1 length, +50 pts | Gold, pulsing glow | 15% chance to replace apple |
| **Shrink Pellet** | -2 length (min 3), +25 pts | Blue, smaller | 10% after wave 3 |
| **Speed Fruit** | Temporary 1.5x speed boost, +15 pts | Green, trailing particles | 10% after wave 2 |
| **Bomb Fruit** | Destroys adjacent hazards when eaten, +30 pts | Orange, flashing | 8% when hazards present |

### 4.4 Hazards
Hazards are static or dynamic obstacles on the grid that make navigation harder.

| Hazard | Behavior | Introduced |
|--------|----------|------------|
| **Wall Block** | Static 1x1 obstacle | Arena 1, Wave 2 |
| **Spike Trap** | Toggles on/off every 4 ticks | Arena 2 |
| **Poison Trail** | Fades after 8 ticks, kills on contact | Arena 3 |
| **Warp Hole** (pair) | Teleports snake to the other hole | Arena 4 |
| **Magnet** | Pulls nearby food toward it each tick | Arena 5 |

### 4.5 Power-Up System (The Heart of the Game)

After each arena, player picks 1 of 3 randomly offered power-ups. These stack and combo.

#### Movement Powers
| Power-Up | Effect | Rarity |
|----------|--------|--------|
| **Ghost Mode** | Phase through your own tail for 3 seconds after eating | Common |
| **Wall Wrap** | Exiting one side enters the other (Pac-Man style) | Common |
| **Dash** | Double-tap direction to skip 3 cells forward | Uncommon |
| **Time Dilation** | Everything slows 30% for 2 sec after a near-miss | Uncommon |
| **Rewind** | On death, rewind 3 seconds (once per arena) | Rare |

#### Offensive Powers
| Power-Up | Effect | Rarity |
|----------|--------|--------|
| **Venom Trail** | Your tail leaves poison for 3 ticks (kills hazards on contact) | Common |
| **Head Bash** | Destroy one wall block by running into it (once per wave) | Common |
| **Shockwave** | Eating food sends a pulse that pushes hazards 2 cells away | Uncommon |
| **Split Strike** | Your snake splits into 2 for 5 seconds (control both, eat with either) | Rare |
| **Ouroboros** | Eating your own tail heals instead of killing (once per arena) | Legendary |

#### Passive Powers
| Power-Up | Effect | Rarity |
|----------|--------|--------|
| **Iron Gut** | +2 length per food instead of +1 (more score, more risk) | Common |
| **Scavenger** | 2 food items on grid at once instead of 1 | Common |
| **Lucky** | Power-up choices always include at least 1 Uncommon+ | Uncommon |
| **Afterimage** | Leave a decoy trail that fades — confuses enemies (phase 2) | Uncommon |
| **Singularity** | Food is pulled toward your head from 3 cells away | Rare |

#### Power-Up Synergies (discoverable, not explained to player)
- **Ghost Mode + Iron Gut** = "Gluttony": Phase through tail always active while length > 15
- **Wall Wrap + Dash** = "Warp Speed": Dashing through a wall wraps AND gives brief invincibility
- **Venom Trail + Shockwave** = "Toxic Blast": Shockwave also leaves venom in its path
- **Scavenger + Singularity** = "Black Hole": All food on grid slowly drifts toward you

---

## 5. Meta Progression (Between Runs)

### 5.1 Currency: Scales
- Earned each run based on: score, arenas cleared, food eaten, power-ups collected
- Persist between runs (saved to IndexedDB)
- NOT pay-to-win — purely earned through play

### 5.2 Permanent Unlocks (spend Scales)
| Unlock | Cost | Effect |
|--------|------|--------|
| **Starting Length 4** | 100 | Start runs at length 4 instead of 3 |
| **Power-Up Reroll** | 200 | Reroll power-up choices once per run |
| **Arena Preview** | 300 | See next arena's hazard types before choosing power-up |
| **Extra Life** | 500 | One free death per run |
| **Daily Challenge** | 0 | Unlocked by default — seeded daily run, everyone gets same layout |
| **Endless Mode** | 750 | No arenas, just infinite escalation |
| **New Snake Skins** | 50-500 | Cosmetic only |

### 5.3 Achievements
Tracked and displayed on profile. Examples:
- "First Blood" — Complete your first run
- "Ouroboros" — Eat your own tail and survive
- "Speed Demon" — Clear 3 arenas without slowing down
- "Minimalist" — Clear an arena at length 3
- "Combo Breaker" — Discover a power-up synergy
- "Century" — Reach length 100

---

## 6. Visual Design

### 6.1 Aesthetic: "CRT Neon"
- **Black background** with subtle CRT scanline overlay
- **Grid lines**: Very faint dark gray (barely visible)
- **Snake**: Bright green segments with a lighter green head, subtle glow/bloom
- **Food**: Distinct neon colors per type (see food table)
- **Hazards**: Red/orange family, pulsing or animated
- **UI text**: Pixel font (e.g., Press Start 2P from Google Fonts), white/green
- **Screen effects**: Slight vignette, optional CRT curvature (toggle in settings)
- **Particles**: Minimal but impactful — burst on eating, death explosion, power-up sparkle

### 6.2 Color Palette
```
Background:     #0a0a0a
Grid lines:     #1a1a1a
Snake body:     #00ff41 (Matrix green)
Snake head:     #39ff14 (brighter green)
Snake glow:     #00ff41 at 20% opacity, 4px blur
Apple:          #ff073a
Golden apple:   #ffd700 (pulsing between #ffd700 and #ffaa00)
Shrink pellet:  #00bfff
Speed fruit:    #39ff14
Bomb fruit:     #ff6600
Hazard:         #ff0040
UI accent:      #00ff41
UI text:        #e0e0e0
Score:          #ffd700
```

### 6.3 Animations
- **Snake movement**: Smooth interpolation between grid cells (lerp over tick duration)
- **Eating**: Quick scale-up pulse on head + particle burst
- **Death**: Snake segments scatter outward + screen flash + CRT glitch effect (brief)
- **Power-up select**: Cards slide up from bottom, selected card zooms to center then fades
- **Wave clear**: Brief flash + score float-up text
- **New hazard spawn**: Fade in with warning pulse

### 6.4 Screen Layout
```
┌─────────────────────────────┐
│  SCORE: 1,250   ARENA: 3   │  ← Top HUD (fixed)
│  ♦♦♦ (lives)    WAVE 2/3   │
├─────────────────────────────┤
│                             │
│                             │
│        PLAY AREA            │  ← Square, centered
│       (20x20 grid)          │
│                             │
│                             │
├─────────────────────────────┤
│  [Active Power-ups: icons]  │  ← Bottom HUD
│  Length: 12   Best: 3,400   │
└─────────────────────────────┘
```

---

## 7. Audio Design

### 7.1 Music
- **Menu**: Chill synthwave loop, low energy
- **Gameplay**: Driving retro synth that layers/intensifies as waves progress
- **Boss**: Heavier, faster tempo
- **Death**: Music cuts, low drone
- Keep it minimal — 3-4 tracks total, loop seamlessly

### 7.2 SFX (Tone.js synthesized, not audio files)
- **Move tick**: Very subtle soft click (optional, toggle in settings)
- **Eat food**: Satisfying blip (pitch rises with combo)
- **Eat golden**: Sparkle arpeggio
- **Death**: Descending buzz + static burst
- **Power-up select**: Ascending chime
- **Wave clear**: Short fanfare
- **Hazard spawn**: Low warning tone
- **Near miss**: Quick whoosh

---

## 8. Screens & UI Flow

```
TITLE SCREEN
  → Play (start run)
  → Daily Challenge
  → Collection (unlocks, skins, achievements)
  → Settings
  → Leaderboard (phase 2)

GAMEPLAY
  → HUD overlay
  → Pause menu (resume, settings, quit run)
  → Power-up selection (between arenas)
  → Wave transition

DEATH SCREEN
  → Run summary (score, arenas, power-ups collected, scales earned)
  → "Try Again" / "Menu"
  → New unlock notification (if any)
```

### 8.1 Title Screen
- Game logo with snake animation (snake slithers to form the title)
- Pulsing "TAP TO START" / "PRESS ENTER"
- Menu options below
- Current high score displayed

### 8.2 Power-Up Selection Screen
- 3 cards displayed horizontally
- Each card shows: icon, name, rarity border color, 1-line description
- Tap/click to select, brief confirmation animation
- Reroll button if unlocked (shows remaining rerolls)
- Current power-ups shown at bottom

### 8.3 Death Screen
- Brief death animation plays on the grid (background)
- Overlay slides up with:
  - Score (counts up dramatically)
  - Stats: length reached, food eaten, arenas cleared
  - Power-ups collected (icon row)
  - Scales earned (with multiplier breakdown)
  - High score notification if beaten
  - Two buttons: "Again" (large, primary) + "Menu" (smaller)

---

## 9. Technical Architecture

### 9.1 Project Structure
```
serpent-surge/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/                    # PWA icons
│   └── fonts/
│       └── PressStart2P.woff2
├── src/
│   ├── main.ts                   # Entry point, canvas setup
│   ├── game/
│   │   ├── Game.ts               # Main game loop, state machine
│   │   ├── Snake.ts              # Snake entity (position, growth, collision)
│   │   ├── Grid.ts               # Grid state, cell management
│   │   ├── Food.ts               # Food spawning, types, effects
│   │   ├── Hazard.ts             # Hazard types, behaviors, spawning
│   │   ├── Arena.ts              # Arena/wave progression logic
│   │   ├── PowerUp.ts            # Power-up definitions, stacking, synergies
│   │   ├── Input.ts              # Touch/keyboard input, buffering
│   │   └── Collision.ts          # Collision detection helpers
│   ├── rendering/
│   │   ├── Renderer.ts           # Main canvas renderer
│   │   ├── SnakeRenderer.ts      # Snake drawing with glow/interpolation
│   │   ├── ParticleSystem.ts     # Particle effects
│   │   ├── Effects.ts            # CRT overlay, screen shake, flash
│   │   └── UI.ts                 # HUD, menus, text rendering
│   ├── audio/
│   │   ├── AudioManager.ts       # Tone.js setup, SFX triggers
│   │   └── Music.ts              # Background music management
│   ├── meta/
│   │   ├── Progression.ts        # Scales, unlocks, save/load
│   │   ├── Achievements.ts       # Achievement tracking
│   │   └── DailyChallenge.ts     # Seeded daily run generation
│   ├── screens/
│   │   ├── TitleScreen.ts        # Title/menu screen
│   │   ├── GameScreen.ts         # Gameplay screen
│   │   ├── PowerUpScreen.ts      # Power-up selection UI
│   │   ├── DeathScreen.ts        # Run summary
│   │   └── CollectionScreen.ts   # Unlocks, achievements, skins
│   ├── data/
│   │   ├── powerups.ts           # Power-up definitions
│   │   ├── hazards.ts            # Hazard definitions
│   │   ├── achievements.ts       # Achievement definitions
│   │   └── unlocks.ts            # Unlock tree
│   └── utils/
│       ├── math.ts               # Lerp, random, seeded RNG
│       ├── storage.ts            # IndexedDB wrapper (idb-keyval)
│       └── constants.ts          # Grid size, timing, colors
```

### 9.2 Game Loop
```typescript
// Fixed timestep game loop
const TICK_RATE = 8; // moves per second (increases with difficulty)
let tickAccumulator = 0;

function gameLoop(timestamp: number) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  tickAccumulator += delta;
  const tickInterval = 1000 / currentTickRate;

  // Fixed update (game logic)
  while (tickAccumulator >= tickInterval) {
    update(); // Move snake, check collisions, update hazards
    tickAccumulator -= tickInterval;
  }

  // Variable render (smooth visuals)
  const interpolation = tickAccumulator / tickInterval;
  render(interpolation); // Lerp snake position for smooth movement

  requestAnimationFrame(gameLoop);
}
```

### 9.3 State Machine
```
STATES:
  TITLE → PLAYING → POWER_UP_SELECT → PLAYING → DEATH → TITLE
                  → PAUSED → PLAYING
                  → WAVE_TRANSITION → PLAYING
```

### 9.4 Snake Data Structure
```typescript
interface Snake {
  segments: Array<{ x: number; y: number }>; // head is [0]
  direction: Direction; // UP, DOWN, LEFT, RIGHT
  nextDirection: Direction; // buffered input
  length: number;
  isGhost: boolean;
  activePowerUps: PowerUpInstance[];
  speed: number; // multiplier on tick rate
}
```

### 9.5 Seeded RNG (for Daily Challenge)
```typescript
// Use a simple mulberry32 PRNG seeded by date string
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// Seed: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''))
```

---

## 10. Implementation Phases

### Phase 1 — MVP (Target: 1 weekend)
Core playable game loop:
- [ ] Canvas setup, responsive sizing
- [ ] Snake movement on grid with smooth interpolation
- [ ] Touch (swipe) + keyboard input with buffering
- [ ] Food spawning (apple only) and eating
- [ ] Self-collision and wall-collision death
- [ ] Basic wave system (eat N food to clear)
- [ ] Score tracking + HUD
- [ ] Death screen with score
- [ ] Title screen (minimal)
- [ ] CRT visual effect overlay
- [ ] Basic SFX (eat, death)
- [ ] PWA manifest + service worker

**Exit criteria**: You can play Snake with waves, it looks cool, it feels good on mobile.

### Phase 2 — Roguelike Core (Target: 1 week)
What makes it special:
- [ ] Arena/wave progression system
- [ ] 3 food types (apple, golden, shrink)
- [ ] 3 hazard types (wall block, spike trap, poison trail)
- [ ] Power-up selection screen between arenas
- [ ] 8-10 power-ups implemented with stacking
- [ ] Particle system (eat, death, power-up)
- [ ] Smooth wave/arena transitions
- [ ] Improved SFX variety
- [ ] IndexedDB persistence (high score, settings)

**Exit criteria**: Each run feels different. Power-up choices create meaningful variety.

### Phase 3 — Depth & Polish (Target: 1-2 weeks)
- [ ] Full power-up roster (15+) with synergy system
- [ ] All 5 hazard types
- [ ] All food types
- [ ] Meta progression: Scales currency, permanent unlocks
- [ ] Achievement system
- [ ] Daily Challenge mode with seeded RNG
- [ ] Snake skins (cosmetic unlocks)
- [ ] Background music (synthwave loops)
- [ ] Screen shake, flash, juice effects
- [ ] Settings screen (audio, controls, CRT toggle)
- [ ] Responsive layout polish for all screen sizes

### Phase 4 — Launch & Platform (Target: 2 weeks)
- [ ] Firebase leaderboard integration
- [ ] Social sharing (screenshot of death screen)
- [ ] Capacitor wrapper for iOS/Android
- [ ] App Store / Play Store submission
- [ ] Analytics (basic: runs started, arenas reached, popular power-ups)
- [ ] Endless Mode unlock
- [ ] Boss arenas (special arena every 5th with unique challenge)

---

## 11. Key Design Principles

1. **30-second rule**: A player should understand the game within 30 seconds of first play. No tutorials needed.
2. **"One more run" loop**: Runs should be 2-5 minutes. Death should feel fair and immediately restartable.
3. **Meaningful choices**: Every power-up pick should make you think for at least 3 seconds. No obvious best choice.
4. **Juice everything**: Screen shake on death, particles on eating, glow on the snake. The game should *feel* alive.
5. **Mobile-first, desktop-great**: Design for thumbs, enhance for keyboards.
6. **Performant simplicity**: No framework bloat. Canvas + TypeScript + Vite. Ship small, run fast.

---

## 12. Open Questions / Future Ideas

- **Multiplayer**: Real-time competitive mode? (Huge scope increase, phase 5+)
- **Level editor**: Let players create and share arena layouts?
- **Seasons**: Rotate available power-ups/hazards monthly for freshness?
- **Accessibility**: Colorblind mode, reduced motion option, haptic feedback on mobile
- **Monetization**: If pursued, cosmetic-only (skins, trail effects). Never pay-to-win.

---

## 13. Claude Code Implementation Notes

### Workflow
1. Start with Phase 1 tasks in order
2. Each task = one focused Claude Code session
3. Test in browser between sessions
4. Use `vite dev` for hot reload during development

### Key Technical Decisions
- **No game framework**: Raw Canvas API. Snake is simple enough that Phaser/PixiJS adds complexity without value.
- **No React**: Game UI is Canvas-rendered. No DOM manipulation during gameplay.
- **TypeScript strict mode**: Catch bugs early, the game state gets complex with power-ups.
- **requestAnimationFrame + fixed timestep**: Smooth visuals, deterministic game logic.
- **IndexedDB over localStorage**: More storage, async, won't block the main thread.

### First Claude Code Command
```
Create a new Vite + TypeScript project called "serpent-surge". Set up the canvas, 
responsive sizing (square play area centered on screen), and implement basic Snake 
movement on a 20x20 grid with keyboard (arrow keys) and touch (swipe) controls. 
Include input buffering. Use the color palette from the spec. Add a CRT scanline 
overlay effect. No game logic yet — just a snake you can steer around the screen 
that wraps at the edges for now.
```
