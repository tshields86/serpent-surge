# TECHNICAL_SPEC.md — Serpent Surge

> Architecture, data structures, algorithms, and implementation details.

---

## 1. Project Structure

```
serpent-surge/
├── index.html                    # Entry HTML, canvas element, viewport meta
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript strict config
├── package.json
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   ├── icons/                    # PWA icons (16, 32, 192, 512)
│   └── fonts/
│       └── PressStart2P.woff2    # Pixel font
├── src/
│   ├── main.ts                   # Entry: create canvas, instantiate Game, start loop
│   ├── game/
│   │   ├── Game.ts               # Game loop, state machine, orchestration
│   │   ├── Snake.ts              # Snake entity
│   │   ├── Grid.ts               # Grid model, coordinate conversion
│   │   ├── Food.ts               # Food spawning, types, effects
│   │   ├── Hazard.ts             # Hazard entities, behaviors
│   │   ├── Arena.ts              # Arena/wave progression
│   │   ├── PowerUp.ts            # Power-up application, stacking, synergy detection
│   │   ├── Input.ts              # Keyboard + touch input, buffering
│   │   └── Collision.ts          # Collision detection functions
│   ├── rendering/
│   │   ├── Renderer.ts           # Canvas setup, frame orchestration, post-processing
│   │   ├── SnakeRenderer.ts      # Snake drawing (segments, glow, interpolation)
│   │   ├── ParticleSystem.ts     # Object-pooled particle manager
│   │   ├── Effects.ts            # CRT scanlines, vignette, screen shake, flash
│   │   └── UI.ts                 # HUD, floating text, score display
│   ├── audio/
│   │   ├── AudioManager.ts       # SFX synthesis and playback (Tone.js)
│   │   └── Music.ts              # Background music loops, crossfading
│   ├── meta/
│   │   ├── Progression.ts        # Scales currency, permanent unlocks, save/load
│   │   ├── Achievements.ts       # Achievement tracking, notification triggers
│   │   └── DailyChallenge.ts     # Seeded RNG run generation
│   ├── screens/
│   │   ├── TitleScreen.ts        # Title menu
│   │   ├── GameScreen.ts         # Gameplay HUD + canvas orchestration
│   │   ├── PowerUpScreen.ts      # Power-up card selection UI
│   │   ├── DeathScreen.ts        # Run summary overlay
│   │   ├── CollectionScreen.ts   # Unlocks, skins, achievements
│   │   └── SettingsScreen.ts     # Audio, visual, control settings
│   ├── data/
│   │   ├── powerups.ts           # Power-up definitions array
│   │   ├── hazards.ts            # Hazard definitions array
│   │   ├── achievements.ts       # Achievement definitions array
│   │   ├── unlocks.ts            # Unlock tree (costs, effects)
│   │   └── skins.ts              # Skin color definitions
│   └── utils/
│       ├── math.ts               # Lerp, clamp, seeded RNG, distance
│       ├── storage.ts            # IndexedDB wrapper (idb-keyval)
│       └── constants.ts          # Colors, grid size, tick rate, sizing
```

---

## 2. Core Interfaces & Types

```typescript
// === ENUMS ===

enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  WAVE_TRANSITION = 'WAVE_TRANSITION',
  ARENA_TRANSITION = 'ARENA_TRANSITION',
  POWER_UP_SELECT = 'POWER_UP_SELECT',
  PAUSED = 'PAUSED',
  DEATH = 'DEATH',
}

enum FoodType {
  APPLE = 'APPLE',
  GOLDEN_APPLE = 'GOLDEN_APPLE',
  SHRINK_PELLET = 'SHRINK_PELLET',
  SPEED_FRUIT = 'SPEED_FRUIT',
  BOMB_FRUIT = 'BOMB_FRUIT',
}

enum HazardType {
  WALL_BLOCK = 'WALL_BLOCK',
  SPIKE_TRAP = 'SPIKE_TRAP',
  POISON_TRAIL = 'POISON_TRAIL',
  WARP_HOLE = 'WARP_HOLE',
  MAGNET = 'MAGNET',
}

enum PowerUpRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

enum PowerUpId {
  GHOST_MODE = 'GHOST_MODE',
  WALL_WRAP = 'WALL_WRAP',
  VENOM_TRAIL = 'VENOM_TRAIL',
  HEAD_BASH = 'HEAD_BASH',
  IRON_GUT = 'IRON_GUT',
  SCAVENGER = 'SCAVENGER',
  DASH = 'DASH',
  TIME_DILATION = 'TIME_DILATION',
  REWIND = 'REWIND',
  SINGULARITY = 'SINGULARITY',
  SPLIT_STRIKE = 'SPLIT_STRIKE',
  OUROBOROS = 'OUROBOROS',
  LUCKY = 'LUCKY',
  AFTERIMAGE = 'AFTERIMAGE',
  SHOCKWAVE = 'SHOCKWAVE',
}

// === CORE TYPES ===

interface Vec2 {
  x: number;
  y: number;
}

interface Snake {
  segments: Vec2[];           // [0] is head
  direction: Direction;
  queuedDirection: Direction | null;  // input buffer (one ahead)
  growthPending: number;      // segments to add on next moves
  speed: number;              // tick rate multiplier (1.0 = normal)
  isGhost: boolean;           // currently phasing through tail
  ghostTimer: number;         // ticks remaining for ghost mode
  isDashing: boolean;
  dashCooldown: number;
}

interface FoodItem {
  position: Vec2;
  type: FoodType;
  spawnTick: number;          // tick when spawned (for animations)
}

interface HazardInstance {
  position: Vec2;
  type: HazardType;
  state: 'active' | 'inactive';  // for spike traps
  ticksRemaining: number | null;  // for poison trails (null = permanent)
  pairedPosition?: Vec2;          // for warp holes
}

interface PowerUpInstance {
  id: PowerUpId;
  stackCount: number;         // how many times this power-up has been picked
  usesRemaining: number | null;   // null = passive (always active), number = limited uses per arena
  tempTimer: number | null;       // ticks remaining for temporary effects
}

interface PowerUpDefinition {
  id: PowerUpId;
  name: string;
  description: string;        // 1 line, shown on card
  rarity: PowerUpRarity;
  icon: string;               // emoji or canvas draw function reference
  maxStack: number;           // max times it can be picked (most = 3)
  onAcquire?: (state: RunState) => void;
  onTick?: (state: RunState) => void;
  onEat?: (state: RunState, food: FoodItem) => void;
  onDeath?: (state: RunState) => boolean;  // return true to prevent death
  onCollision?: (state: RunState, target: Vec2) => boolean;  // return true to survive
}

interface SynergyDefinition {
  id: string;
  name: string;
  requires: PowerUpId[];      // must have all of these
  description: string;
  onActivate: (state: RunState) => void;
}

// === RUN STATE (single source of truth during gameplay) ===

interface RunState {
  snake: Snake;
  foods: FoodItem[];
  hazards: HazardInstance[];
  heldPowerUps: PowerUpInstance[];
  activeSynergies: string[];     // synergy IDs that have been activated

  // Progression within the run
  currentArena: number;          // 1-indexed
  currentWave: number;           // 1-3
  waveFoodEaten: number;         // count toward current wave quota
  waveFoodQuota: number;         // food needed to clear wave

  // Scoring
  score: number;
  totalFoodEaten: number;
  highestLength: number;

  // Timing
  currentTick: number;           // global tick counter for this run
  currentTickRate: number;       // moves per second (scales with difficulty)

  // Run modifiers (from unlocks)
  hasExtraLife: boolean;
  extraLifeUsed: boolean;
  rerollsRemaining: number;

  // RNG
  rng: () => number;             // seeded for daily challenge, Math.random for normal
}

// === META STATE (persisted between runs) ===

interface MetaState {
  highScore: number;
  totalScales: number;
  unlockedItems: string[];       // IDs of purchased unlocks
  equippedSkin: string;
  achievementsUnlocked: string[];
  settings: GameSettings;
  dailyChallengeHistory: Record<string, number>;  // "YYYYMMDD" → best score
}

interface GameSettings {
  musicVolume: number;           // 0-1
  sfxVolume: number;             // 0-1
  crtEnabled: boolean;
  crtCurvature: boolean;
  controlType: 'swipe' | 'dpad';
  reducedMotion: boolean;
}

// === PARTICLES ===

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;                  // 0-1, decreases each frame
  maxLife: number;
  color: string;
  size: number;
  active: boolean;               // false = available in pool
}
```

---

## 3. Game Loop Architecture

### Fixed Timestep with Interpolation

```typescript
class Game {
  private state: GameState = GameState.TITLE;
  private runState: RunState | null = null;
  private tickAccumulator: number = 0;
  private lastTimestamp: number = 0;
  private interpolation: number = 0;

  start(): void {
    this.lastTimestamp = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Cap delta to prevent spiral of death (e.g., tab was backgrounded)
    const cappedDelta = Math.min(delta, 200);

    if (this.state === GameState.PLAYING && this.runState) {
      const tickInterval = 1000 / this.runState.currentTickRate;
      this.tickAccumulator += cappedDelta;

      // Fixed update: game logic ticks
      while (this.tickAccumulator >= tickInterval) {
        this.update();
        this.tickAccumulator -= tickInterval;
      }

      // Interpolation factor for smooth rendering (0 to 1)
      this.interpolation = this.tickAccumulator / tickInterval;
    }

    // Always render (even non-PLAYING states)
    this.render(this.interpolation);

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(): void {
    // 1. Apply queued input
    // 2. Move snake
    // 3. Check collisions (wall, self, hazard, food)
    // 4. Update hazards (spike toggle, poison decay)
    // 5. Apply power-up tick effects
    // 6. Check wave/arena completion
    // 7. Increment tick counter
  }

  private render(interpolation: number): void {
    // 1. Clear canvas
    // 2. Draw grid
    // 3. Draw hazards
    // 4. Draw food
    // 5. Draw snake (with interpolation for smooth movement)
    // 6. Draw particles
    // 7. Draw HUD
    // 8. Apply post-processing (CRT, vignette)
    // 9. Draw screen overlays (death, power-up select, etc.)
  }
}
```

### Interpolation for Smooth Snake Movement

```typescript
function renderSnake(snake: Snake, interpolation: number, cellSize: number): void {
  // For each segment, lerp between previous position and current position
  // Head: lerp from previousHead to currentHead by `interpolation`
  // This gives smooth movement even at 8 ticks/sec rendered at 60fps

  const headRenderX = lerp(snake.previousHead.x, snake.segments[0].x, interpolation) * cellSize;
  const headRenderY = lerp(snake.previousHead.y, snake.segments[0].y, interpolation) * cellSize;

  // Draw head at interpolated position
  // Draw body segments similarly (each lerps from its previous to current)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

---

## 4. Input System

### Input Buffering

The input system queues ONE direction change ahead. This is critical for responsive controls.

```typescript
class InputManager {
  private currentDirection: Direction = Direction.RIGHT;
  private queuedDirection: Direction | null = null;
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private readonly SWIPE_THRESHOLD = 30; // pixels

  // Called by game on each tick
  consumeInput(): Direction {
    if (this.queuedDirection && !isOpposite(this.queuedDirection, this.currentDirection)) {
      this.currentDirection = this.queuedDirection;
      this.queuedDirection = null;
    }
    return this.currentDirection;
  }

  // Called on keyboard/touch events
  queueDirection(dir: Direction): void {
    // Only queue if not opposite to current AND not same as current
    if (!isOpposite(dir, this.currentDirection) && dir !== this.currentDirection) {
      this.queuedDirection = dir;
    }
  }

  // Touch handling
  onTouchStart(e: TouchEvent): void {
    this.swipeStartX = e.touches[0].clientX;
    this.swipeStartY = e.touches[0].clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.swipeStartX;
    const dy = e.changedTouches[0].clientY - this.swipeStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < this.SWIPE_THRESHOLD) return; // too small

    if (absDx > absDy) {
      this.queueDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT);
    } else {
      this.queueDirection(dy > 0 ? Direction.DOWN : Direction.UP);
    }
  }
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === Direction.UP && b === Direction.DOWN) ||
    (a === Direction.DOWN && b === Direction.UP) ||
    (a === Direction.LEFT && b === Direction.RIGHT) ||
    (a === Direction.RIGHT && b === Direction.LEFT)
  );
}
```

---

## 5. Collision Detection

```typescript
function checkWallCollision(head: Vec2, gridSize: number): boolean {
  return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
}

function checkSelfCollision(segments: Vec2[]): boolean {
  const head = segments[0];
  // Start from index 1 (skip head)
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].x === head.x && segments[i].y === head.y) {
      return true;
    }
  }
  return false;
}

function checkHazardCollision(head: Vec2, hazards: HazardInstance[]): HazardInstance | null {
  for (const hazard of hazards) {
    if (hazard.position.x === head.x && hazard.position.y === head.y) {
      if (hazard.type === HazardType.SPIKE_TRAP && hazard.state === 'inactive') {
        continue; // spike is off, safe to cross
      }
      return hazard;
    }
  }
  return null;
}

function checkFoodCollision(head: Vec2, foods: FoodItem[]): FoodItem | null {
  for (const food of foods) {
    if (food.position.x === head.x && food.position.y === head.y) {
      return food;
    }
  }
  return null;
}
```

---

## 6. Power-Up Effect System

Power-ups modify game behavior through hook functions. The game loop calls these hooks at the right time.

```typescript
// Each power-up defines optional hooks
const GHOST_MODE: PowerUpDefinition = {
  id: PowerUpId.GHOST_MODE,
  name: 'Ghost Mode',
  description: 'Phase through your tail for 3s after eating',
  rarity: PowerUpRarity.COMMON,
  icon: '👻',
  maxStack: 3,
  onEat: (state: RunState) => {
    state.snake.isGhost = true;
    state.snake.ghostTimer = 24; // 3 seconds at 8 ticks/sec
  },
  onTick: (state: RunState) => {
    if (state.snake.ghostTimer > 0) {
      state.snake.ghostTimer--;
      if (state.snake.ghostTimer === 0) {
        state.snake.isGhost = false;
      }
    }
  },
};

// Game loop applies power-ups:
function applyPowerUpHooks(
  runState: RunState,
  hook: 'onTick' | 'onEat' | 'onDeath',
  ...args: any[]
): void {
  for (const held of runState.heldPowerUps) {
    const def = POWER_UP_REGISTRY[held.id];
    const hookFn = def[hook];
    if (hookFn) {
      for (let i = 0; i < held.stackCount; i++) {
        hookFn(runState, ...args);
      }
    }
  }
}
```

### Synergy Detection

```typescript
function checkSynergies(runState: RunState): SynergyDefinition[] {
  const heldIds = new Set(runState.heldPowerUps.map(p => p.id));
  const newSynergies: SynergyDefinition[] = [];

  for (const synergy of SYNERGY_REGISTRY) {
    if (runState.activeSynergies.includes(synergy.id)) continue; // already active
    if (synergy.requires.every(req => heldIds.has(req))) {
      synergy.onActivate(runState);
      runState.activeSynergies.push(synergy.id);
      newSynergies.push(synergy);
    }
  }

  return newSynergies; // caller shows notification for each
}
```

---

## 7. Particle System (Object Pool)

```typescript
class ParticleSystem {
  private pool: Particle[];
  private readonly POOL_SIZE = 200;

  constructor() {
    this.pool = Array.from({ length: this.POOL_SIZE }, () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, color: '', size: 0, active: false,
    }));
  }

  emit(x: number, y: number, count: number, config: ParticleConfig): void {
    for (let i = 0; i < count; i++) {
      const p = this.getAvailable();
      if (!p) return; // pool exhausted

      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * config.speed;
      p.vy = (Math.random() - 0.5) * config.speed;
      p.life = config.lifetime;
      p.maxLife = config.lifetime;
      p.color = config.color;
      p.size = config.size;
      p.active = true;
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private getAvailable(): Particle | null {
    // Find inactive particle, or steal oldest active one
    let oldest: Particle | null = null;
    for (const p of this.pool) {
      if (!p.active) return p;
      if (!oldest || p.life < oldest.life) oldest = p;
    }
    return oldest; // reuse oldest if pool is full
  }
}

interface ParticleConfig {
  speed: number;
  lifetime: number;  // seconds
  color: string;
  size: number;
}
```

---

## 8. Seeded RNG

```typescript
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  // e.g., 20260310
}

// Usage:
// Normal run: rng = Math.random
// Daily challenge: rng = mulberry32(dailySeed())
// All food positions, hazard positions, power-up offerings use rng()
```

---

## 9. Canvas Rendering Pipeline

```
Each frame:
1. ctx.clearRect(0, 0, width, height)
2. ctx.fillStyle = '#0a0a0a'; ctx.fillRect(...)  // background
3. drawGrid(ctx)                                   // faint #1a1a1a lines
4. drawHazards(ctx, hazards)                       // red/orange elements
5. drawFood(ctx, foods)                            // colored food items
6. drawSnake(ctx, snake, interpolation)            // green segments + glow
7. particleSystem.render(ctx)                      // particles on top
8. drawHUD(ctx, runState)                          // score, wave, icons
9. applyCRTEffect(ctx, offscreenCRT)               // scanlines + vignette
10. drawScreenOverlay(ctx, state)                  // death/power-up/pause if active
```

### CRT Effect (Cached)

```typescript
// Create once, redraw only on resize
function createCRTOverlay(width: number, height: number): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const octx = offscreen.getContext('2d')!;

  // Scanlines
  octx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < height; y += 3) {
    octx.fillRect(0, y, width, 1);
  }

  // Vignette
  const gradient = octx.createRadialGradient(
    width / 2, height / 2, height * 0.3,
    width / 2, height / 2, height * 0.8
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  octx.fillStyle = gradient;
  octx.fillRect(0, 0, width, height);

  return offscreen;
}
```

---

## 10. Responsive Sizing

```typescript
function calculateLayout(windowWidth: number, windowHeight: number): Layout {
  const HUD_HEIGHT_TOP = 60;
  const HUD_HEIGHT_BOTTOM = 50;
  const PADDING = 16;

  const availableHeight = windowHeight - HUD_HEIGHT_TOP - HUD_HEIGHT_BOTTOM - PADDING * 2;
  const availableWidth = windowWidth - PADDING * 2;

  // Play area is square, fits within available space
  const playSize = Math.min(availableWidth, availableHeight);
  const cellSize = Math.floor(playSize / GRID_SIZE); // integer for crisp pixels
  const actualPlaySize = cellSize * GRID_SIZE;

  const playX = Math.floor((windowWidth - actualPlaySize) / 2);
  const playY = HUD_HEIGHT_TOP + Math.floor((availableHeight - actualPlaySize) / 2);

  return {
    playArea: { x: playX, y: playY, size: actualPlaySize },
    cellSize,
    hudTop: { x: 0, y: 0, width: windowWidth, height: HUD_HEIGHT_TOP },
    hudBottom: { x: 0, y: playY + actualPlaySize, width: windowWidth, height: HUD_HEIGHT_BOTTOM },
  };
}

interface Layout {
  playArea: { x: number; y: number; size: number };
  cellSize: number;
  hudTop: { x: number; y: number; width: number; height: number };
  hudBottom: { x: number; y: number; width: number; height: number };
}
```

---

## 11. Difficulty Scaling

```typescript
function getWaveConfig(arena: number, wave: number): WaveConfig {
  const baseQuota = 3 + wave * 2;            // W1=5, W2=7, W3=9
  const arenaBonus = (arena - 1) * 2;        // +2 per arena
  const foodQuota = baseQuota + arenaBonus;

  const hazardCount = Math.max(0, (wave - 1) + (arena - 1) * 2);  // ramps up
  const tickRate = 8 + (arena - 1) * 0.5;    // 8, 8.5, 9, 9.5, ...

  return { foodQuota, hazardCount, tickRate };
}

interface WaveConfig {
  foodQuota: number;
  hazardCount: number;
  tickRate: number;
}
```

---

## 12. Score & Scales Calculation

```typescript
function calculateRunScales(runState: RunState): number {
  const scoreBonus = Math.floor(runState.score / 10);
  const arenaBonus = (runState.currentArena - 1) * 50;
  const foodBonus = runState.totalFoodEaten * 2;
  return scoreBonus + arenaBonus + foodBonus;
}
```

---

## 13. State Persistence (IndexedDB)

```typescript
// Using idb-keyval for simplicity
import { get, set } from 'idb-keyval';

const META_KEY = 'serpent-surge-meta';

async function loadMeta(): Promise<MetaState> {
  const stored = await get(META_KEY);
  return stored ?? DEFAULT_META_STATE;
}

async function saveMeta(meta: MetaState): Promise<void> {
  await set(META_KEY, meta);
}

const DEFAULT_META_STATE: MetaState = {
  highScore: 0,
  totalScales: 0,
  unlockedItems: [],
  equippedSkin: 'default',
  achievementsUnlocked: [],
  settings: {
    musicVolume: 0.7,
    sfxVolume: 1.0,
    crtEnabled: true,
    crtCurvature: false,
    controlType: 'swipe',
    reducedMotion: false,
  },
  dailyChallengeHistory: {},
};
```

---

## 14. Food Spawning Algorithm

```typescript
function spawnFood(
  grid: Grid,
  snake: Snake,
  hazards: HazardInstance[],
  existingFoods: FoodItem[],
  arena: number,
  wave: number,
  rng: () => number
): FoodItem {
  // Determine food type
  const roll = rng();
  let type = FoodType.APPLE;

  if (roll < 0.08 && hazards.length > 0 && arena >= 3) {
    type = FoodType.BOMB_FRUIT;
  } else if (roll < 0.18 && wave >= 2 && arena >= 2) {
    type = FoodType.SPEED_FRUIT;
  } else if (roll < 0.28 && wave >= 3) {
    type = FoodType.SHRINK_PELLET;
  } else if (roll < 0.43) {
    type = FoodType.GOLDEN_APPLE;
  }

  // Find empty cell
  const occupied = new Set<string>();
  for (const seg of snake.segments) occupied.add(`${seg.x},${seg.y}`);
  for (const h of hazards) occupied.add(`${h.position.x},${h.position.y}`);
  for (const f of existingFoods) occupied.add(`${f.position.x},${f.position.y}`);

  const emptyCells: Vec2[] = [];
  for (let x = 0; x < grid.size; x++) {
    for (let y = 0; y < grid.size; y++) {
      if (!occupied.has(`${x},${y}`)) emptyCells.push({ x, y });
    }
  }

  if (emptyCells.length === 0) {
    // Grid is full — shouldn't happen in practice
    return { position: { x: 0, y: 0 }, type: FoodType.APPLE, spawnTick: 0 };
  }

  const pos = emptyCells[Math.floor(rng() * emptyCells.length)];
  return { position: pos, type, spawnTick: 0 };
}
```

---

## 15. PWA Configuration

### manifest.json
```json
{
  "name": "Serpent Surge",
  "short_name": "Serpent",
  "description": "A roguelike Snake game",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### index.html essentials
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0a; }
  canvas { display: block; touch-action: none; }
</style>
```
