import { Snake, Direction } from './Snake';
import { Grid } from './Grid';
import { InputManager } from './Input';
import { Arena } from './Arena';
import { FoodType, FoodItem, FOOD_SCORES, spawnFood, checkFoodCollision } from './Food';
import { HazardType, HazardInstance, spawnHazards, updateHazards, checkHazardCollision, checkWarpHole } from './Hazard';
import { Renderer } from '../rendering/Renderer';
import { SnakeRenderer } from '../rendering/SnakeRenderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { UI } from '../rendering/UI';
import { Effects } from '../rendering/Effects';
import { DeathScreen } from '../screens/DeathScreen';
import { TitleScreen } from '../screens/TitleScreen';
import { PowerUpScreen } from '../screens/PowerUpScreen';
import { AudioManager } from '../audio/AudioManager';
import { MusicPlayer } from '../audio/Music';
import { PowerUpId, PowerUpInstance, acquirePowerUp, hasPowerUp, getStackCount, rollPowerUpOfferings } from './PowerUp';
import { ActiveSynergy, getActiveSynergies, detectNewSynergies } from './Synergy';
import { checkWallCollision, checkSelfCollision } from './Collision';
import { BASE_TICK_RATE, COLORS, GRID_SIZE, MAX_DELTA } from '../utils/constants';
import { loadData, saveData, PersistedData } from '../utils/storage';
import { calculateScales } from '../meta/Progression';
import { SKIN_DEFS } from '../data/skins';
import { AchievementTracker } from '../meta/Achievements';
import { SkinColors } from '../rendering/SnakeRenderer';

export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  WAVE_TRANSITION = 'WAVE_TRANSITION',
  ARENA_TRANSITION = 'ARENA_TRANSITION',
  POWER_UP_SELECT = 'POWER_UP_SELECT',
  PAUSED = 'PAUSED',
  DEATH = 'DEATH',
}

export class Game {
  private state: GameState = GameState.TITLE;
  private renderer: Renderer;
  private snakeRenderer: SnakeRenderer;
  private particles: ParticleSystem;
  private ui: UI;
  private effects: Effects;
  private deathScreen: DeathScreen;
  private titleScreen: TitleScreen;
  private powerUpScreen: PowerUpScreen;
  private audio: AudioManager;
  private music: MusicPlayer;
  private input: InputManager;
  private grid: Grid;
  private snake: Snake;
  private arena: Arena;
  private foods: FoodItem[] = [];
  private hazards: HazardInstance[] = [];
  private heldPowerUps: PowerUpInstance[] = [];
  private currentTick = 0;

  private lastTimestamp = 0;
  private tickAccumulator = 0;
  private interpolation = 0;
  private currentTickRate = BASE_TICK_RATE;

  // Timers
  private screenFlashTimer = 0;
  private transitionTimer = 0;
  private transitionMessage = '';
  private countdownTimer = 0; // Arena start countdown

  // Power-up effect state
  private ghostTimer = 0;           // Ghost Mode: ticks remaining of phasing
  private headBashUsed = false;     // Head Bash: used this wave?
  private timeDilationTimer = 0;    // Time Dilation: seconds remaining of slowdown
  private rewindUsed = false;       // Rewind: used this arena?
  private rewindSnapshots: { segments: { x: number; y: number }[]; direction: Direction }[] = [];
  private lastDirectionInput: { dir: Direction; tick: number } | null = null; // Dash detection
  private ouroborosUsed = false;    // Ouroboros: used this arena?
  private splitSnake: Snake | null = null; // Split Strike: clone snake
  private splitTimer = 0;           // Split Strike: seconds remaining
  private afterimages: { x: number; y: number; alpha: number }[] = []; // Afterimage trail
  private activeSynergies: ActiveSynergy[] = [];
  private synergyToast: { text: string; timer: number } | null = null;
  private warpSpeedTimer = 0; // Warp Speed synergy: invincibility after wall dash
  private speedBoostTimer = 0; // Speed Fruit: 1.5x speed for 3s
  private achievements = new AchievementTracker();
  private achievementToast: { icon: string; name: string; timer: number } | null = null;

  // Run stats
  score = 0;
  totalFoodEaten = 0;
  private deathLength = 0;
  private highScore = 0;
  private persistedData: PersistedData | null = null;
  private activeSkin: SkinColors = {
    bodyColor: SKIN_DEFS[0]!.bodyColor,
    headColor: SKIN_DEFS[0]!.headColor,
    glowColor: SKIN_DEFS[0]!.glowColor,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.snakeRenderer = new SnakeRenderer();
    this.particles = new ParticleSystem();
    this.ui = new UI();
    this.effects = new Effects();
    this.deathScreen = new DeathScreen();
    this.titleScreen = new TitleScreen();
    this.powerUpScreen = new PowerUpScreen();
    this.audio = new AudioManager();
    this.music = new MusicPlayer();
    this.input = new InputManager();
    this.grid = new Grid();
    this.arena = new Arena();

    this.snake = this.createSnake();
    this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards, this.arena.currentWave));
    this.input.onDirectionInput((dir) => this.onDirection(dir));

    canvas.addEventListener('click', (e) => this.onClick(e));
    canvas.addEventListener('touchend', (e) => this.onTap(e));
  }

  private createSnake(): Snake {
    const center = this.grid.centerCell();
    return new Snake(center);
  }

  private onDirection(dir: Direction): void {
    if (this.state === GameState.TITLE) {
      this.startRun();
      return;
    }
    if (this.state === GameState.PLAYING) {
      // Dash: double-tap same direction to skip 3 cells
      if (hasPowerUp(this.heldPowerUps, PowerUpId.DASH) &&
          this.lastDirectionInput &&
          this.lastDirectionInput.dir === dir &&
          this.currentTick - this.lastDirectionInput.tick <= 3) {
        this.performDash(dir);
        this.lastDirectionInput = null;
      } else {
        this.snake.queueDirection(dir);
        this.lastDirectionInput = { dir, tick: this.currentTick };
      }
    }
  }

  private performDash(dir: Direction): void {
    const skipCells = 2 + getStackCount(this.heldPowerUps, PowerUpId.DASH);
    const head = this.snake.head;
    const dx = dir === Direction.LEFT ? -1 : dir === Direction.RIGHT ? 1 : 0;
    const dy = dir === Direction.UP ? -1 : dir === Direction.DOWN ? 1 : 0;
    const newHead = { x: head.x + dx * skipCells, y: head.y + dy * skipCells };

    // Check if dash went through wall (for Warp Speed synergy)
    const dashedThroughWall = newHead.x < 0 || newHead.x >= GRID_SIZE ||
      newHead.y < 0 || newHead.y >= GRID_SIZE;

    // Check if dash destination is valid
    if (hasPowerUp(this.heldPowerUps, PowerUpId.WALL_WRAP)) {
      newHead.x = ((newHead.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      newHead.y = ((newHead.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    }

    if (newHead.x >= 0 && newHead.x < GRID_SIZE &&
        newHead.y >= 0 && newHead.y < GRID_SIZE) {
      this.snake.segments.unshift(newHead);
      this.snake.segments.pop();
      // Motion blur particles along dash path
      const cellSize = this.renderer.layout.cellSize;
      for (let i = 1; i <= skipCells; i++) {
        const mx = head.x + dx * i;
        const my = head.y + dy * i;
        const pixel = this.renderer.gridToPixel(mx, my);
        this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
          count: 3,
          speed: 50,
          lifetime: 0.2,
          color: COLORS.snakeGlow,
          size: 2,
        });
      }
      // Warp Speed synergy: dash through wall grants invincibility
      if (dashedThroughWall && this.activeSynergies.some(s => s.id === 'WARP_SPEED')) {
        this.warpSpeedTimer = 1.0;
      }
    }
  }

  private startRun(): void {
    this.audio.init();
    this.music.init().then(() => this.music.transition('gameplay'));
    this.snake = this.createSnake();
    this.arena.reset();
    this.foods = [];
    this.hazards = [];
    this.heldPowerUps = [];
    this.foods.push(spawnFood(this.snake, this.foods, 0, this.hazards, this.arena.currentWave));
    this.score = 0;
    this.totalFoodEaten = 0;
    this.deathLength = 0;
    this.currentTick = 0;
    this.tickAccumulator = 0;
    this.interpolation = 0;
    this.currentTickRate = this.arena.getWaveConfig().tickRate;
    this.screenFlashTimer = 0;
    this.transitionTimer = 0;
    this.ghostTimer = 0;
    this.headBashUsed = false;
    this.timeDilationTimer = 0;
    this.rewindUsed = false;
    this.rewindSnapshots = [];
    this.lastDirectionInput = null;
    this.countdownTimer = 0;
    this.ouroborosUsed = false;
    this.splitSnake = null;
    this.splitTimer = 0;
    this.afterimages = [];
    this.activeSynergies = [];
    this.synergyToast = null;
    this.warpSpeedTimer = 0;
    this.speedBoostTimer = 0;
    this.ui.reset();
    this.deathScreen.reset();
    this.state = GameState.PLAYING;
  }

  private onClick(e: MouseEvent): void {
    if (this.state === GameState.TITLE) {
      this.startRun();
      return;
    }
    if (this.state === GameState.POWER_UP_SELECT) {
      this.powerUpScreen.handleClick(e.offsetX, e.offsetY);
      return;
    }
    if (this.state === GameState.DEATH && this.deathScreen.isReady()) {
      const bounds = this.deathScreen.getButtonBounds(
        this.renderer.canvas.width,
        this.renderer.canvas.height,
      );
      if (
        e.offsetX >= bounds.x && e.offsetX <= bounds.x + bounds.width &&
        e.offsetY >= bounds.y && e.offsetY <= bounds.y + bounds.height
      ) {
        this.restart();
      }
    }
  }

  private onTap(e: TouchEvent): void {
    if (this.state === GameState.TITLE) {
      this.startRun();
      return;
    }
    if (this.state === GameState.POWER_UP_SELECT) {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const rect = this.renderer.canvas.getBoundingClientRect();
      this.powerUpScreen.handleClick(
        touch.clientX - rect.left,
        touch.clientY - rect.top,
      );
      return;
    }
    if (this.state === GameState.DEATH && this.deathScreen.isReady()) {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const rect = this.renderer.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const bounds = this.deathScreen.getButtonBounds(
        this.renderer.canvas.width,
        this.renderer.canvas.height,
      );
      if (
        x >= bounds.x && x <= bounds.x + bounds.width &&
        y >= bounds.y && y <= bounds.y + bounds.height
      ) {
        this.restart();
      }
    }
  }

  start(): void {
    this.lastTimestamp = performance.now();
    loadData().then(data => {
      this.persistedData = data;
      this.highScore = data.highScore;
      if (data.settings.muted && !this.audio.isMuted) {
        this.audio.toggleMute();
        this.music.setMuted(true);
      }
      // Load achievements
      if (data.achievementIds) {
        this.achievements.loadState({ unlockedIds: data.achievementIds });
      }
      // Load selected skin
      const skinDef = SKIN_DEFS.find(s => s.id === data.selectedSkin);
      if (skinDef) {
        this.activeSkin = {
          bodyColor: skinDef.bodyColor,
          headColor: skinDef.headColor,
          glowColor: skinDef.glowColor,
        };
      }
    });
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    const delta = Math.min(timestamp - this.lastTimestamp, MAX_DELTA);
    this.lastTimestamp = timestamp;

    if (this.state === GameState.PLAYING && this.countdownTimer <= 0) {
      // Speed modifiers
      let effectiveTickRate = this.currentTickRate;
      if (this.speedBoostTimer > 0) {
        effectiveTickRate *= 1.5; // Speed Fruit: 50% faster
      }
      if (this.timeDilationTimer > 0) {
        effectiveTickRate *= 0.7; // Time Dilation: 30% slowdown
      }
      const tickInterval = 1000 / effectiveTickRate;
      this.tickAccumulator += delta;

      while (this.tickAccumulator >= tickInterval) {
        this.update();
        if (this.state !== GameState.PLAYING) break;
        this.tickAccumulator -= tickInterval;
      }

      if (this.state === GameState.PLAYING) {
        this.interpolation = this.tickAccumulator / tickInterval;
      }
    }

    const dtSec = delta / 1000;
    this.particles.update(dtSec);
    this.ui.update(dtSec, this.score);
    this.effects.updateShake(dtSec);

    if (this.screenFlashTimer > 0) {
      this.screenFlashTimer = Math.max(0, this.screenFlashTimer - dtSec);
    }

    if (this.timeDilationTimer > 0) {
      this.timeDilationTimer = Math.max(0, this.timeDilationTimer - dtSec);
    }

    // Speed Fruit boost timer
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dtSec);
    }

    // Warp Speed invincibility timer
    if (this.warpSpeedTimer > 0) {
      this.warpSpeedTimer = Math.max(0, this.warpSpeedTimer - dtSec);
    }

    // Split Strike timer
    if (this.splitTimer > 0) {
      this.splitTimer = Math.max(0, this.splitTimer - dtSec);
      if (this.splitTimer <= 0) {
        this.splitSnake = null;
      }
    }

    if (this.countdownTimer > 0) {
      this.countdownTimer = Math.max(0, this.countdownTimer - dtSec);
    }

    // Achievement toast timer
    if (this.achievementToast) {
      this.achievementToast.timer -= dtSec;
      if (this.achievementToast.timer <= 0) {
        this.achievementToast = null;
        // Check for next queued toast
        const next = this.achievements.popToast();
        if (next) {
          this.achievementToast = { icon: next.icon, name: next.name, timer: 3.0 };
        }
      }
    } else if (this.achievements.hasToasts()) {
      const next = this.achievements.popToast();
      if (next) {
        this.achievementToast = { icon: next.icon, name: next.name, timer: 3.0 };
      }
    }

    // Synergy toast timer
    if (this.synergyToast) {
      this.synergyToast.timer -= dtSec;
      if (this.synergyToast.timer <= 0) {
        this.synergyToast = null;
      }
    }

    // Handle transition timers
    if (this.state === GameState.WAVE_TRANSITION || this.state === GameState.ARENA_TRANSITION) {
      this.transitionTimer -= dtSec;
      if (this.transitionTimer <= 0) {
        this.finishTransition();
      }
    }

    if (this.state === GameState.TITLE) {
      this.titleScreen.update(dtSec);
    }
    if (this.state === GameState.DEATH) {
      this.deathScreen.update(dtSec);
    }
    if (this.state === GameState.POWER_UP_SELECT) {
      this.powerUpScreen.update(dtSec);
      if (this.powerUpScreen.isSelectionComplete()) {
        const selected = this.powerUpScreen.getSelectedPowerUp();
        if (selected) {
          const beforeSynergies = getActiveSynergies(this.heldPowerUps);
          acquirePowerUp(this.heldPowerUps, selected.id);
          this.audio.playPowerUpChime();
          // Check for new synergies
          const afterSynergies = getActiveSynergies(this.heldPowerUps);
          const newSynergies = detectNewSynergies(beforeSynergies, afterSynergies);
          this.activeSynergies = afterSynergies;
          if (newSynergies.length > 0) {
            const syn = newSynergies[0]!;
            this.synergyToast = { text: `SYNERGY: ${syn.name} — ${syn.description}`, timer: 3.0 };
            this.achievements.tryUnlock('SYNERGY_FOUND');
            if (afterSynergies.length >= 4) this.achievements.tryUnlock('ALL_SYNERGIES');
          }
        }
        this.powerUpScreen.reset();
        // Transition to arena transition
        this.transitionMessage = `ARENA ${this.arena.currentArena} CLEAR!`;
        this.transitionTimer = 1.5;
        this.state = GameState.ARENA_TRANSITION;
      }
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(): void {
    // Save snapshot for Rewind (keep last 24 ticks = ~3s at 8 ticks/sec)
    if (hasPowerUp(this.heldPowerUps, PowerUpId.REWIND)) {
      this.rewindSnapshots.push({
        segments: this.snake.segments.map(s => ({ x: s.x, y: s.y })),
        direction: this.snake.direction,
      });
      if (this.rewindSnapshots.length > 24) {
        this.rewindSnapshots.shift();
      }
    }

    this.snake.move();
    this.currentTick++;

    // Decrement ghost timer
    if (this.ghostTimer > 0) this.ghostTimer--;

    // Venom Trail: leave poison at tail's previous position
    if (hasPowerUp(this.heldPowerUps, PowerUpId.VENOM_TRAIL)) {
      const prevTail = this.snake.previousSegments[this.snake.previousSegments.length - 1];
      if (prevTail && this.snake.growthPending === 0) {
        const trailTicks = 3 * getStackCount(this.heldPowerUps, PowerUpId.VENOM_TRAIL);
        this.hazards.push({
          position: { x: prevTail.x, y: prevTail.y },
          type: HazardType.POISON_TRAIL,
          state: 'active',
          ticksRemaining: trailTicks,
          spawnTick: this.currentTick,
        });
      }
    }

    // Afterimage: add fading decoy at previous head position
    if (hasPowerUp(this.heldPowerUps, PowerUpId.AFTERIMAGE)) {
      const prevHead = this.snake.previousSegments[0];
      if (prevHead) {
        const stacks = getStackCount(this.heldPowerUps, PowerUpId.AFTERIMAGE);
        this.afterimages.push({ x: prevHead.x, y: prevHead.y, alpha: 0.5 * stacks });
      }
      // Decay and remove faded afterimages
      this.afterimages = this.afterimages.filter(a => {
        a.alpha -= 0.05;
        return a.alpha > 0.05;
      });
    }

    const head = this.snake.head;

    // Wall collision — Wall Wrap overrides
    if (checkWallCollision(head, this.grid.size)) {
      if (hasPowerUp(this.heldPowerUps, PowerUpId.WALL_WRAP)) {
        // Wrap to opposite side
        const wrapped = {
          x: ((head.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
          y: ((head.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
        };
        this.snake.segments[0] = wrapped;
      } else {
        this.die();
        return;
      }
    }

    // Self collision — Ghost Mode overrides, Ouroboros heals
    // Gluttony synergy: always ghosting when length > 15
    const gluttonyActive = this.activeSynergies.some(s => s.id === 'GLUTTONY') &&
      this.snake.segments.length > 15;
    const isGhosting = this.ghostTimer > 0 || gluttonyActive;
    if (!isGhosting && checkSelfCollision(this.snake.segments)) {
      if (hasPowerUp(this.heldPowerUps, PowerUpId.OUROBOROS) && !this.ouroborosUsed) {
        // Eat own tail: remove segments from collision point onward
        this.ouroborosUsed = true;
        this.achievements.tryUnlock('OUROBOROS_HEAL');
        const head = this.snake.head;
        const hitIdx = this.snake.segments.findIndex(
          (s, i) => i > 0 && s.x === head.x && s.y === head.y,
        );
        if (hitIdx > 0) {
          const removed = this.snake.segments.splice(hitIdx);
          this.score += removed.length * 5;
          this.ui.triggerScorePulse();
          // Heal particles
          const cellSize = this.renderer.layout.cellSize;
          const pixel = this.renderer.gridToPixel(head.x, head.y);
          this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
            count: 20,
            speed: 120,
            lifetime: 0.5,
            color: '#ffd700',
            size: 3,
          });
        }
        this.screenFlashTimer = 0.15;
      } else {
        this.die();
        return;
      }
    }

    // Update hazards (toggle spikes, decay poison)
    this.hazards = updateHazards(this.hazards, this.currentTick);

    // Check hazard collision (Warp Speed invincibility bypasses)
    const hitHazard = this.warpSpeedTimer > 0 ? null : checkHazardCollision(head, this.hazards);
    if (hitHazard) {
      // Head Bash: destroy wall block instead of dying
      if (hitHazard.type === HazardType.WALL_BLOCK &&
          hasPowerUp(this.heldPowerUps, PowerUpId.HEAD_BASH) &&
          !this.headBashUsed) {
        this.headBashUsed = true;
        this.hazards = this.hazards.filter(h => h !== hitHazard);
        // Shatter particles
        const cellSize = this.renderer.layout.cellSize;
        const pixel = this.renderer.gridToPixel(hitHazard.position.x, hitHazard.position.y);
        this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
          count: 16,
          speed: 250,
          lifetime: 0.4,
          color: '#ff0040',
          size: 4,
        });
      } else {
        this.die();
        return;
      }
    }

    // Warp Hole: teleport snake to partner hole
    const warpDest = checkWarpHole(head, this.hazards);
    if (warpDest) {
      this.snake.segments[0] = { x: warpDest.x, y: warpDest.y };
      const cellSize = this.renderer.layout.cellSize;
      // Warp-in particles
      const pixel = this.renderer.gridToPixel(warpDest.x, warpDest.y);
      this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
        count: 10,
        speed: 100,
        lifetime: 0.3,
        color: '#9944ff',
        size: 3,
      });
    }

    // Magnet hazards: pull nearest food 1 cell toward them each tick
    for (const h of this.hazards) {
      if (h.type !== HazardType.MAGNET) continue;
      let nearestFood: FoodItem | null = null;
      let nearestDist = Infinity;
      for (const food of this.foods) {
        const d = Math.abs(food.position.x - h.position.x) + Math.abs(food.position.y - h.position.y);
        if (d > 0 && d < nearestDist) {
          nearestDist = d;
          nearestFood = food;
        }
      }
      if (nearestFood) {
        const fdx = Math.sign(h.position.x - nearestFood.position.x);
        const fdy = Math.sign(h.position.y - nearestFood.position.y);
        const nx = nearestFood.position.x + fdx;
        const ny = nearestFood.position.y + fdy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          nearestFood.position = { x: nx, y: ny };
        }
      }
    }

    // Singularity: drift food toward head
    // Black Hole synergy: all food drifts (no range limit)
    if (hasPowerUp(this.heldPowerUps, PowerUpId.SINGULARITY)) {
      const blackHole = this.activeSynergies.some(s => s.id === 'BLACK_HOLE');
      for (const food of this.foods) {
        const dx = head.x - food.position.x;
        const dy = head.y - food.position.y;
        const dist = Math.abs(dx) + Math.abs(dy); // manhattan
        if (dist > 0 && (blackHole || dist <= 3)) {
          // Move food 1 cell toward head
          const newX = food.position.x + Math.sign(dx);
          const newY = food.position.y + Math.sign(dy);
          // Only move if target cell is valid and not occupied by snake or hazard
          if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            food.position = { x: newX, y: newY };
          }
        }
      }
    }

    // Time Dilation: check near-miss (head adjacent to hazard or wall)
    if (hasPowerUp(this.heldPowerUps, PowerUpId.TIME_DILATION) && this.timeDilationTimer <= 0) {
      const isNearMiss = this.checkNearMiss(head);
      if (isNearMiss) {
        this.timeDilationTimer = 2.0;
        this.audio.playNearMiss();
      }
    }

    const eatenFood = checkFoodCollision(head, this.foods);
    if (eatenFood) {
      // Apply food effect
      if (eatenFood.type === FoodType.SHRINK_PELLET) {
        this.snake.shrink(2);
      } else if (eatenFood.type === FoodType.SPEED_FRUIT) {
        this.speedBoostTimer = 3.0;
        this.snake.grow(1);
      } else if (eatenFood.type === FoodType.BOMB_FRUIT) {
        // Destroy hazards in 3x3 area around eat position
        const bx = eatenFood.position.x;
        const by = eatenFood.position.y;
        const beforeCount = this.hazards.length;
        this.hazards = this.hazards.filter(h => {
          const dx = Math.abs(h.position.x - bx);
          const dy = Math.abs(h.position.y - by);
          return dx > 1 || dy > 1;
        });
        const destroyed = beforeCount - this.hazards.length;
        if (destroyed > 0) {
          this.score += destroyed * 10;
        }
        if (destroyed >= 3) this.achievements.tryUnlock('BOMB_CLEAR');
        if (destroyed > 0) this.effects.triggerShake(0.15, 4);
        this.snake.grow(1);
      } else {
        // Iron Gut: +2 per stack instead of +1
        const growAmount = hasPowerUp(this.heldPowerUps, PowerUpId.IRON_GUT)
          ? 1 + getStackCount(this.heldPowerUps, PowerUpId.IRON_GUT)
          : 1;
        this.snake.grow(growAmount);
      }

      // Ghost Mode: activate on eat
      if (hasPowerUp(this.heldPowerUps, PowerUpId.GHOST_MODE)) {
        const ghostTicks = Math.round(3 * this.currentTickRate); // 3 seconds worth of ticks
        this.ghostTimer = ghostTicks;
      }

      this.score += FOOD_SCORES[eatenFood.type];
      this.totalFoodEaten++;
      this.ui.triggerScorePulse();

      // Achievement triggers on eat
      this.achievements.tryUnlock('FIRST_BITE');
      if (eatenFood.type === FoodType.GOLDEN_APPLE) this.achievements.tryUnlock('GOLDEN_TONGUE');
      if (this.snake.segments.length >= 20) this.achievements.tryUnlock('LENGTH_20');
      if (this.snake.segments.length >= 50) this.achievements.tryUnlock('LENGTH_50');
      if (this.score >= 500) this.achievements.tryUnlock('SCORE_500');
      if (this.score >= 1000) this.achievements.tryUnlock('SCORE_1000');
      if (this.heldPowerUps.length >= 5) this.achievements.tryUnlock('POWER_5');
      if (this.speedBoostTimer > 0) this.achievements.tryUnlock('SPEED_RUN');
      if (eatenFood.type === FoodType.GOLDEN_APPLE) {
        this.audio.playGoldenEat();
      } else if (eatenFood.type === FoodType.SHRINK_PELLET) {
        this.audio.playShrinkEat();
      } else if (eatenFood.type === FoodType.BOMB_FRUIT) {
        this.audio.playBombEat();
      } else {
        this.audio.playEat();
      }

      this.foods = this.foods.filter(f => f !== eatenFood);

      // Emit eat particles (color per food type)
      const pixel = this.renderer.gridToPixel(
        eatenFood.position.x,
        eatenFood.position.y,
      );
      const cellSize = this.renderer.layout.cellSize;
      const particleColor = eatenFood.type === FoodType.GOLDEN_APPLE
        ? COLORS.goldenApple
        : eatenFood.type === FoodType.SHRINK_PELLET
          ? COLORS.shrinkPellet
          : eatenFood.type === FoodType.SPEED_FRUIT
            ? COLORS.speedFruit
            : eatenFood.type === FoodType.BOMB_FRUIT
              ? COLORS.bombFruit
              : COLORS.apple;
      const particleCount = eatenFood.type === FoodType.GOLDEN_APPLE ? 18
        : eatenFood.type === FoodType.BOMB_FRUIT ? 24 : 12;
      this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
        count: particleCount,
        speed: 150,
        lifetime: 0.3,
        color: particleColor,
        size: 3,
      });

      // Shockwave: push hazards 2 cells away from eaten food
      if (hasPowerUp(this.heldPowerUps, PowerUpId.SHOCKWAVE)) {
        const pushDist = 1 + getStackCount(this.heldPowerUps, PowerUpId.SHOCKWAVE);
        for (const h of this.hazards) {
          const hdx = h.position.x - eatenFood.position.x;
          const hdy = h.position.y - eatenFood.position.y;
          const dist = Math.abs(hdx) + Math.abs(hdy);
          if (dist > 0 && dist <= 4) {
            const newX = h.position.x + Math.sign(hdx) * pushDist;
            const newY = h.position.y + Math.sign(hdy) * pushDist;
            // Clamp to grid
            h.position.x = Math.max(0, Math.min(GRID_SIZE - 1, newX));
            h.position.y = Math.max(0, Math.min(GRID_SIZE - 1, newY));
          }
        }
        // Toxic Blast synergy: shockwave leaves venom trail
        if (this.activeSynergies.some(s => s.id === 'TOXIC_BLAST')) {
          for (const h of this.hazards) {
            this.hazards.push({
              position: { x: h.position.x, y: h.position.y },
              type: HazardType.POISON_TRAIL,
              state: 'active',
              ticksRemaining: 5,
              spawnTick: this.currentTick,
            });
          }
        }
        // Ripple visual
        this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
          count: 12,
          speed: 300,
          lifetime: 0.3,
          color: '#88ccff',
          size: 2,
        });
      }

      // Split Strike: spawn clone snake on eat
      if (hasPowerUp(this.heldPowerUps, PowerUpId.SPLIT_STRIKE) && !this.splitSnake) {
        // Create a clone heading the opposite direction
        const cloneSegs = this.snake.segments.slice(0, Math.max(3, Math.floor(this.snake.segments.length / 2)));
        const oppositeDir = this.snake.direction === Direction.UP ? Direction.DOWN
          : this.snake.direction === Direction.DOWN ? Direction.UP
          : this.snake.direction === Direction.LEFT ? Direction.RIGHT
          : Direction.LEFT;
        this.splitSnake = new Snake(cloneSegs[0]!, cloneSegs.length, oppositeDir);
        this.splitSnake.segments = cloneSegs.map(s => ({ x: s.x, y: s.y }));
        this.splitSnake.previousSegments = cloneSegs.map(s => ({ x: s.x, y: s.y }));
        this.splitTimer = 5.0;
      }

      // Check wave progression
      const waveCleared = this.arena.eatFood();
      if (waveCleared) {
        this.onWaveClear();
      } else {
        // Spawn next food
        this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards, this.arena.currentWave));

        // Scavenger: keep 2 foods on grid per stack
        if (hasPowerUp(this.heldPowerUps, PowerUpId.SCAVENGER)) {
          const targetFoods = 1 + getStackCount(this.heldPowerUps, PowerUpId.SCAVENGER);
          while (this.foods.length < targetFoods) {
            this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards, this.arena.currentWave));
          }
        }
      }
    }

    // Update split snake
    if (this.splitSnake && this.splitTimer > 0) {
      this.splitSnake.move();
      const splitHead = this.splitSnake.head;
      // Wall collision for split snake
      if (splitHead.x < 0 || splitHead.x >= GRID_SIZE ||
          splitHead.y < 0 || splitHead.y >= GRID_SIZE) {
        if (hasPowerUp(this.heldPowerUps, PowerUpId.WALL_WRAP)) {
          this.splitSnake.segments[0] = {
            x: ((splitHead.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
            y: ((splitHead.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
          };
        } else {
          this.splitSnake = null;
          this.splitTimer = 0;
        }
      }
      // Split snake can eat food
      if (this.splitSnake) {
        const splitEaten = checkFoodCollision(this.splitSnake.head, this.foods);
        if (splitEaten) {
          this.splitSnake.grow(1);
          this.score += FOOD_SCORES[splitEaten.type];
          this.totalFoodEaten++;
          this.ui.triggerScorePulse();
          this.audio.playEat();
          this.foods = this.foods.filter(f => f !== splitEaten);
          const pixel = this.renderer.gridToPixel(splitEaten.position.x, splitEaten.position.y);
          const cellSize = this.renderer.layout.cellSize;
          this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
            count: 10,
            speed: 150,
            lifetime: 0.3,
            color: COLORS.snakeGlow,
            size: 3,
          });
          const waveCleared = this.arena.eatFood();
          if (waveCleared) {
            this.onWaveClear();
          } else {
            this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards, this.arena.currentWave));
          }
        }
      }
    }
  }

  private checkNearMiss(head: { x: number; y: number }): boolean {
    // Check adjacent cells for hazards
    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    for (const d of dirs) {
      const nx = head.x + d.x;
      const ny = head.y + d.y;
      // Near wall
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return true;
      // Near active hazard
      for (const h of this.hazards) {
        if (h.position.x === nx && h.position.y === ny && h.state === 'active') return true;
      }
    }
    return false;
  }

  private onWaveClear(): void {
    this.screenFlashTimer = 0.15;
    this.audio.playWaveClear();

    // Float up score tally
    const { playArea } = this.renderer.layout;
    const centerX = playArea.x + playArea.size / 2;
    const centerY = playArea.y + playArea.size / 2;
    this.ui.addFloatingText(`WAVE ${this.arena.currentWave} CLEAR!`, centerX, centerY, 1.5);

    const isArenaCleared = this.arena.advanceWave();

    if (isArenaCleared) {
      // Arena achievements
      this.achievements.tryUnlock('ARENA_1');
      if (this.arena.currentArena >= 3) this.achievements.tryUnlock('ARENA_3');
      if (this.arena.currentArena >= 5) this.achievements.tryUnlock('ARENA_5');
      // Arena cleared — show power-up selection
      const offerings = rollPowerUpOfferings(this.heldPowerUps);
      if (offerings.length > 0) {
        this.powerUpScreen.setOfferings(offerings);
        this.state = GameState.POWER_UP_SELECT;
        this.audio.playArenaClear();
      } else {
        // No power-ups available, skip to arena transition
        this.transitionMessage = `ARENA ${this.arena.currentArena} CLEAR!`;
        this.transitionTimer = 1.5;
        this.state = GameState.ARENA_TRANSITION;
      }
    } else {
      // Wave cleared — brief pause then continue
      this.transitionMessage = '';
      this.transitionTimer = 0.5;
      this.state = GameState.WAVE_TRANSITION;
    }
  }

  private finishTransition(): void {
    if (this.state === GameState.ARENA_TRANSITION) {
      // Advance arena, reset snake and grid
      this.arena.advanceArena();
      this.rewindUsed = false;
      this.ouroborosUsed = false;
      this.splitSnake = null;
      this.splitTimer = 0;
      this.afterimages = [];
      this.snake = this.createSnake();
      this.foods = [];
      this.hazards = [];
      this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards, this.arena.currentWave));
      this.currentTickRate = this.arena.getWaveConfig().tickRate;
      this.tickAccumulator = 0;
      this.interpolation = 0;
      this.countdownTimer = 2.0; // 2s countdown before play resumes
    } else {
      // Wave transition — spawn new food and hazards
      this.foods = [];
      this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards, this.arena.currentWave));
      this.currentTickRate = this.arena.getWaveConfig().tickRate;
    }

    // Reset per-wave power-up state
    this.headBashUsed = false;

    // Spawn hazards for new wave
    const waveConfig = this.arena.getWaveConfig();
    const newHazards = spawnHazards(
      waveConfig.hazardCount,
      this.arena.currentWave,
      this.snake,
      this.foods,
      this.hazards,
      this.currentTick,
    );
    this.hazards.push(...newHazards);

    this.state = GameState.PLAYING;
  }

  private render(): void {
    if (this.state === GameState.TITLE) {
      this.titleScreen.draw(this.renderer.ctx, this.highScore);
      this.effects.drawCRT(this.renderer.ctx);
      return;
    }

    this.renderer.clear();

    // Apply screen shake
    const ctx = this.renderer.ctx;
    ctx.save();
    this.effects.applyShake(ctx);

    this.renderer.drawGrid();

    this.drawHazards();
    this.drawFood();

    // Draw afterimages
    if (this.afterimages.length > 0) {
      this.drawAfterimages();
    }

    this.snakeRenderer.draw(
      this.renderer.ctx,
      this.snake,
      this.renderer.layout,
      this.interpolation,
      this.ghostTimer > 0,
      this.activeSkin,
    );

    // Draw split snake
    if (this.splitSnake && this.splitTimer > 0) {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.globalAlpha = 0.7;
      this.snakeRenderer.draw(
        ctx,
        this.splitSnake,
        this.renderer.layout,
        this.interpolation,
        false,
        this.activeSkin,
      );
      ctx.restore();
    }

    this.particles.render(this.renderer.ctx);

    this.ui.drawHUD(this.renderer.ctx, this.renderer.layout, {
      score: this.score,
      snakeLength: this.state === GameState.DEATH ? this.deathLength : this.snake.segments.length,
      waveProgress: this.arena.waveProgress,
      arenaNumber: this.arena.currentArena,
      heldPowerUps: this.heldPowerUps,
      ghostTimer: this.ghostTimer,
      timeDilationTimer: this.timeDilationTimer,
    });

    // Transition overlay
    if ((this.state === GameState.WAVE_TRANSITION || this.state === GameState.ARENA_TRANSITION)
        && this.transitionMessage) {
      this.drawTransitionOverlay();
    }

    // Countdown overlay
    if (this.countdownTimer > 0 && this.state === GameState.PLAYING) {
      this.drawCountdown();
    }

    // Time Dilation tint
    if (this.timeDilationTimer > 0) {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#0044ff';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    // Screen flash
    if (this.screenFlashTimer > 0) {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.globalAlpha = this.screenFlashTimer * 5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    // Restore shake transform before overlays
    ctx.restore();

    // Synergy discovery toast
    if (this.synergyToast) {
      this.drawSynergyToast();
    }

    // Achievement toast
    if (this.achievementToast) {
      this.drawAchievementToast();
    }

    this.effects.drawCRT(this.renderer.ctx);

    if (this.state === GameState.POWER_UP_SELECT) {
      this.powerUpScreen.draw(
        this.renderer.ctx,
        this.renderer.canvas.width,
        this.renderer.canvas.height,
        this.heldPowerUps,
      );
    }

    if (this.state === GameState.DEATH) {
      this.deathScreen.draw(
        this.renderer.ctx,
        this.renderer.layout,
        this.score,
        this.deathLength,
        this.totalFoodEaten,
      );
    }
  }

  private drawTransitionOverlay(): void {
    const ctx = this.renderer.ctx;
    const { width, height } = ctx.canvas;

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    ctx.font = `${Math.min(24, Math.floor(width / 18))}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiAccent;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 15;
    ctx.fillText(this.transitionMessage, width / 2, height / 2);
    ctx.restore();
  }

  private drawCountdown(): void {
    const ctx = this.renderer.ctx;
    const { width, height } = ctx.canvas;
    const count = Math.ceil(this.countdownTimer / 0.65);
    const text = count > 0 ? `${count}` : 'GO!';
    const scale = 1 + (this.countdownTimer % 0.65) * 0.5;

    ctx.save();
    ctx.font = `${Math.floor(40 * scale)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiAccent;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = Math.min(1, this.countdownTimer * 3);
    ctx.fillText(text, width / 2, height / 2);
    ctx.restore();
  }

  private drawHazards(): void {
    const ctx = this.renderer.ctx;
    const { cellSize } = this.renderer.layout;
    const padding = Math.max(1, Math.floor(cellSize * 0.1));

    for (const hazard of this.hazards) {
      const pixel = this.renderer.gridToPixel(hazard.position.x, hazard.position.y);
      const x = pixel.x + padding;
      const y = pixel.y + padding;
      const size = cellSize - padding * 2;

      ctx.save();

      if (hazard.type === HazardType.WALL_BLOCK) {
        // Solid dark red/brown block
        ctx.fillStyle = '#8b0000';
        ctx.shadowColor = '#ff0040';
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y, size, size);
        // Inner border for depth
        ctx.strokeStyle = '#ff0040';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      } else if (hazard.type === HazardType.SPIKE_TRAP) {
        if (hazard.state === 'active') {
          // Bright red spikes
          ctx.fillStyle = '#ff0040';
          ctx.shadowColor = '#ff0040';
          ctx.shadowBlur = 8;
          // Draw X pattern for spikes
          const cx = pixel.x + cellSize / 2;
          const cy = pixel.y + cellSize / 2;
          const r = size / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.3, cy - r * 0.3);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx + r * 0.3, cy + r * 0.3);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.3, cy + r * 0.3);
          ctx.lineTo(cx - r, cy);
          ctx.lineTo(cx - r * 0.3, cy - r * 0.3);
          ctx.closePath();
          ctx.fill();
        } else {
          // Dim inactive spikes
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#660020';
          const cx = pixel.x + cellSize / 2;
          const cy = pixel.y + cellSize / 2;
          const r = size / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.3, cy - r * 0.3);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx + r * 0.3, cy + r * 0.3);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.3, cy + r * 0.3);
          ctx.lineTo(cx - r, cy);
          ctx.lineTo(cx - r * 0.3, cy - r * 0.3);
          ctx.closePath();
          ctx.fill();
        }
      } else if (hazard.type === HazardType.WARP_HOLE) {
        // Purple swirling portal
        const cx = pixel.x + cellSize / 2;
        const cy = pixel.y + cellSize / 2;
        const r = size / 2;
        const spin = performance.now() / 500;
        ctx.fillStyle = '#7722cc';
        ctx.shadowColor = '#9944ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // Inner swirl
        ctx.strokeStyle = '#cc88ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.5, spin, spin + Math.PI * 1.5);
        ctx.stroke();
      } else if (hazard.type === HazardType.MAGNET) {
        // Red/blue magnet with field lines
        const cx = pixel.x + cellSize / 2;
        const cy = pixel.y + cellSize / 2;
        const r = size / 2;
        // Red half
        ctx.fillStyle = '#ff3333';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        // Blue half
        ctx.fillStyle = '#3366ff';
        ctx.shadowColor = '#3366ff';
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2);
        ctx.fill();
        // Field lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let ring = 1; ring <= 2; ring++) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + ring * cellSize * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (hazard.type === HazardType.POISON_TRAIL) {
        // Purple-green poison with fade based on remaining ticks
        const fade = hazard.ticksRemaining !== null ? hazard.ticksRemaining / 8 : 1;
        ctx.globalAlpha = 0.4 + fade * 0.4;
        ctx.fillStyle = '#7b00ff';
        ctx.shadowColor = '#7b00ff';
        ctx.shadowBlur = 6;
        const cx = pixel.x + cellSize / 2;
        const cy = pixel.y + cellSize / 2;
        const r = (size / 2) * (0.5 + fade * 0.5);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawAchievementToast(): void {
    if (!this.achievementToast) return;
    const ctx = this.renderer.ctx;
    const { width } = ctx.canvas;
    // Slide in from top
    const slideProgress = Math.min(1, (3.0 - this.achievementToast.timer) * 4);
    const slideOut = this.achievementToast.timer < 0.3 ? this.achievementToast.timer / 0.3 : 1;
    const yOffset = -40 + slideProgress * 40;
    const alpha = slideOut;

    ctx.save();
    ctx.globalAlpha = alpha;

    const barHeight = 32;
    const barY = yOffset;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width * 0.15, barY, width * 0.7, barHeight);
    ctx.strokeStyle = COLORS.score;
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.15, barY, width * 0.7, barHeight);

    const fontSize = Math.min(10, Math.floor(width / 45));
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.score;
    ctx.fillText(
      `${this.achievementToast.icon} ${this.achievementToast.name}`,
      width / 2,
      barY + barHeight / 2,
    );

    ctx.restore();
  }

  private drawSynergyToast(): void {
    if (!this.synergyToast) return;
    const ctx = this.renderer.ctx;
    const { width } = ctx.canvas;
    const alpha = Math.min(1, this.synergyToast.timer * 2);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background bar
    const barHeight = 36;
    const barY = 80;
    ctx.fillStyle = 'rgba(128, 0, 255, 0.7)';
    ctx.fillRect(0, barY, width, barHeight);

    // Text
    const fontSize = Math.min(12, Math.floor(width / 40));
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillText(this.synergyToast.text, width / 2, barY + barHeight / 2);

    ctx.restore();
  }

  private drawAfterimages(): void {
    const ctx = this.renderer.ctx;
    const { cellSize } = this.renderer.layout;
    const padding = Math.max(1, Math.floor(cellSize * 0.05));

    for (const img of this.afterimages) {
      const pixel = this.renderer.gridToPixel(img.x, img.y);
      ctx.save();
      ctx.globalAlpha = img.alpha * 0.5;
      ctx.fillStyle = COLORS.snakeBody;
      ctx.shadowColor = COLORS.snakeGlow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(
        pixel.x + padding,
        pixel.y + padding,
        cellSize - padding * 2,
        cellSize - padding * 2,
        cellSize * 0.2,
      );
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFood(): void {
    const ctx = this.renderer.ctx;
    const { cellSize } = this.renderer.layout;
    const padding = Math.max(2, Math.floor(cellSize * 0.15));

    for (const food of this.foods) {
      const pixel = this.renderer.gridToPixel(food.position.x, food.position.y);
      const cx = pixel.x + cellSize / 2;
      const cy = pixel.y + cellSize / 2;

      ctx.save();

      if (food.type === FoodType.GOLDEN_APPLE) {
        // Pulsing gold
        const pulse = Math.sin(performance.now() / 200) * 0.5 + 0.5;
        const r = (cellSize - padding * 2) / 2;
        ctx.shadowColor = COLORS.goldenApple;
        ctx.shadowBlur = cellSize * 0.6;
        // Interpolate between gold and pulse color
        ctx.fillStyle = pulse > 0.5 ? COLORS.goldenApple : COLORS.goldenApplePulse;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === FoodType.SHRINK_PELLET) {
        // Smaller blue circle
        const r = (cellSize - padding * 2) / 2 * 0.7;
        ctx.shadowColor = COLORS.shrinkPellet;
        ctx.shadowBlur = cellSize * 0.4;
        ctx.fillStyle = COLORS.shrinkPellet;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === FoodType.SPEED_FRUIT) {
        // Green speed fruit with trailing particles
        const r = (cellSize - padding * 2) / 2;
        ctx.shadowColor = COLORS.speedFruit;
        ctx.shadowBlur = cellSize * 0.5;
        ctx.fillStyle = COLORS.speedFruit;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // Small trailing dots
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(cx - r * 0.8, cy, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - r * 1.4, cy, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === FoodType.BOMB_FRUIT) {
        // Orange flashing bomb
        const r = (cellSize - padding * 2) / 2;
        const flash = Math.sin(performance.now() / 150) > 0 ? 1.0 : 0.6;
        ctx.globalAlpha = flash;
        ctx.shadowColor = COLORS.bombFruit;
        ctx.shadowBlur = cellSize * 0.6;
        ctx.fillStyle = COLORS.bombFruit;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        // Fuse line
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.4, cy - r * 1.4);
        ctx.stroke();
      } else {
        // Standard apple
        const r = (cellSize - padding * 2) / 2;
        ctx.shadowColor = COLORS.apple;
        ctx.shadowBlur = cellSize * 0.4;
        ctx.fillStyle = COLORS.apple;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  die(): void {
    // Rewind: undo death, restore snake to 3s ago
    if (hasPowerUp(this.heldPowerUps, PowerUpId.REWIND) &&
        !this.rewindUsed &&
        this.rewindSnapshots.length > 0) {
      this.rewindUsed = true;
      this.achievements.tryUnlock('REWIND_SAVE');
      const snapshot = this.rewindSnapshots[0]!; // earliest snapshot
      this.snake.segments = snapshot.segments.map(s => ({ x: s.x, y: s.y }));
      this.snake.direction = snapshot.direction;
      this.snake.queuedDirection = null;
      this.snake.previousSegments = snapshot.segments.map(s => ({ x: s.x, y: s.y }));
      this.rewindSnapshots = [];
      this.screenFlashTimer = 0.3;
      // VHS static particles
      const { playArea } = this.renderer.layout;
      for (let i = 0; i < 30; i++) {
        const px = playArea.x + Math.random() * playArea.size;
        const py = playArea.y + Math.random() * playArea.size;
        this.particles.emit(px, py, {
          count: 1,
          speed: 30,
          lifetime: 0.5,
          color: '#ffffff',
          size: 2,
        });
      }
      return;
    }

    this.state = GameState.DEATH;
    this.deathLength = this.snake.segments.length;
    this.screenFlashTimer = 0.2;
    this.audio.playDeath();
    this.music.transition('death');
    this.effects.triggerShake(0.3, 8);
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Persist stats
    if (this.persistedData) {
      this.persistedData.highScore = this.highScore;
      this.persistedData.totalRuns++;
      const scalesEarned = calculateScales(this.score, this.arena.currentArena - 1, this.totalFoodEaten);
      this.persistedData.totalScales += scalesEarned;
      this.persistedData.achievementIds = this.achievements.getState().unlockedIds;
      saveData(this.persistedData);
    }

    const cellSize = this.renderer.layout.cellSize;
    for (const seg of this.snake.segments) {
      const pixel = this.renderer.gridToPixel(seg.x, seg.y);
      this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
        count: 4,
        speed: 200,
        lifetime: 0.5,
        color: COLORS.snakeBody,
        size: 4,
      });
    }
  }

  restart(): void {
    this.startRun();
  }
}
