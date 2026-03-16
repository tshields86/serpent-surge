import { Snake, Direction } from './Snake';
import { Grid } from './Grid';
import { InputManager } from './Input';
import { Arena } from './Arena';
import { FoodItem, spawnFood, checkFoodCollision } from './Food';
import { HazardType, HazardInstance, spawnHazards, updateHazards, checkHazardCollision } from './Hazard';
import { Renderer } from '../rendering/Renderer';
import { SnakeRenderer } from '../rendering/SnakeRenderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { UI } from '../rendering/UI';
import { Effects } from '../rendering/Effects';
import { DeathScreen } from '../screens/DeathScreen';
import { TitleScreen } from '../screens/TitleScreen';
import { AudioManager } from '../audio/AudioManager';
import { checkWallCollision, checkSelfCollision } from './Collision';
import { BASE_TICK_RATE, COLORS, MAX_DELTA } from '../utils/constants';

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
  private audio: AudioManager;
  private input: InputManager;
  private grid: Grid;
  private snake: Snake;
  private arena: Arena;
  private foods: FoodItem[] = [];
  private hazards: HazardInstance[] = [];
  private currentTick = 0;

  private lastTimestamp = 0;
  private tickAccumulator = 0;
  private interpolation = 0;
  private currentTickRate = BASE_TICK_RATE;

  // Timers
  private screenFlashTimer = 0;
  private transitionTimer = 0;
  private transitionMessage = '';

  // Run stats
  score = 0;
  totalFoodEaten = 0;
  private deathLength = 0;
  private highScore = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.snakeRenderer = new SnakeRenderer();
    this.particles = new ParticleSystem();
    this.ui = new UI();
    this.effects = new Effects();
    this.deathScreen = new DeathScreen();
    this.titleScreen = new TitleScreen();
    this.audio = new AudioManager();
    this.input = new InputManager();
    this.grid = new Grid();
    this.arena = new Arena();

    this.snake = this.createSnake();
    this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards));
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
      this.snake.queueDirection(dir);
    }
  }

  private startRun(): void {
    this.audio.init();
    this.snake = this.createSnake();
    this.arena.reset();
    this.foods = [];
    this.hazards = [];
    this.foods.push(spawnFood(this.snake, this.foods, 0, this.hazards));
    this.score = 0;
    this.totalFoodEaten = 0;
    this.deathLength = 0;
    this.currentTick = 0;
    this.tickAccumulator = 0;
    this.interpolation = 0;
    this.currentTickRate = this.arena.getWaveConfig().tickRate;
    this.screenFlashTimer = 0;
    this.transitionTimer = 0;
    this.ui.reset();
    this.deathScreen.reset();
    this.state = GameState.PLAYING;
  }

  private onClick(e: MouseEvent): void {
    if (this.state === GameState.TITLE) {
      this.startRun();
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
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    const delta = Math.min(timestamp - this.lastTimestamp, MAX_DELTA);
    this.lastTimestamp = timestamp;

    if (this.state === GameState.PLAYING) {
      const tickInterval = 1000 / this.currentTickRate;
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

    if (this.screenFlashTimer > 0) {
      this.screenFlashTimer = Math.max(0, this.screenFlashTimer - dtSec);
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

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(): void {
    this.snake.move();
    this.currentTick++;

    const head = this.snake.head;

    if (checkWallCollision(head, this.grid.size)) {
      this.die();
      return;
    }

    if (checkSelfCollision(this.snake.segments)) {
      this.die();
      return;
    }

    // Update hazards (toggle spikes, decay poison)
    this.hazards = updateHazards(this.hazards, this.currentTick);

    // Check hazard collision
    const hitHazard = checkHazardCollision(head, this.hazards);
    if (hitHazard) {
      this.die();
      return;
    }

    const eatenFood = checkFoodCollision(head, this.foods);
    if (eatenFood) {
      this.snake.grow(1);
      this.score += 10;
      this.totalFoodEaten++;
      this.ui.triggerScorePulse();
      this.audio.playEat();

      this.foods = this.foods.filter(f => f !== eatenFood);

      // Emit eat particles
      const pixel = this.renderer.gridToPixel(
        eatenFood.position.x,
        eatenFood.position.y,
      );
      const cellSize = this.renderer.layout.cellSize;
      this.particles.emit(pixel.x + cellSize / 2, pixel.y + cellSize / 2, {
        count: 12,
        speed: 150,
        lifetime: 0.3,
        color: COLORS.apple,
        size: 3,
      });

      // Check wave progression
      const waveCleared = this.arena.eatFood();
      if (waveCleared) {
        this.onWaveClear();
      } else {
        // Spawn next food
        this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards));
      }
    }
  }

  private onWaveClear(): void {
    this.screenFlashTimer = 0.15;

    // Float up score tally
    const { playArea } = this.renderer.layout;
    const centerX = playArea.x + playArea.size / 2;
    const centerY = playArea.y + playArea.size / 2;
    this.ui.addFloatingText(`WAVE ${this.arena.currentWave} CLEAR!`, centerX, centerY, 1.5);

    const isArenaCleared = this.arena.advanceWave();

    if (isArenaCleared) {
      // Arena cleared — show transition then advance
      this.transitionMessage = `ARENA ${this.arena.currentArena} CLEAR!`;
      this.transitionTimer = 1.5;
      this.state = GameState.ARENA_TRANSITION;
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
      this.snake = this.createSnake();
      this.foods = [];
      this.hazards = [];
      this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards));
      this.currentTickRate = this.arena.getWaveConfig().tickRate;
      this.tickAccumulator = 0;
      this.interpolation = 0;
    } else {
      // Wave transition — spawn new food and hazards
      this.foods = [];
      this.foods.push(spawnFood(this.snake, this.foods, this.currentTick, this.hazards));
      this.currentTickRate = this.arena.getWaveConfig().tickRate;
    }

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
    this.renderer.drawGrid();

    this.drawHazards();
    this.drawFood();

    this.snakeRenderer.draw(
      this.renderer.ctx,
      this.snake,
      this.renderer.layout,
      this.interpolation,
    );

    this.particles.render(this.renderer.ctx);

    this.ui.drawHUD(this.renderer.ctx, this.renderer.layout, {
      score: this.score,
      snakeLength: this.state === GameState.DEATH ? this.deathLength : this.snake.segments.length,
      waveProgress: this.arena.waveProgress,
      arenaNumber: this.arena.currentArena,
    });

    // Transition overlay
    if ((this.state === GameState.WAVE_TRANSITION || this.state === GameState.ARENA_TRANSITION)
        && this.transitionMessage) {
      this.drawTransitionOverlay();
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

    this.effects.drawCRT(this.renderer.ctx);

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

  private drawFood(): void {
    const ctx = this.renderer.ctx;
    const { cellSize } = this.renderer.layout;
    const padding = Math.max(2, Math.floor(cellSize * 0.15));

    for (const food of this.foods) {
      const pixel = this.renderer.gridToPixel(food.position.x, food.position.y);

      ctx.save();
      ctx.shadowColor = COLORS.apple;
      ctx.shadowBlur = cellSize * 0.4;
      ctx.fillStyle = COLORS.apple;

      const cx = pixel.x + cellSize / 2;
      const cy = pixel.y + cellSize / 2;
      const r = (cellSize - padding * 2) / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  die(): void {
    this.state = GameState.DEATH;
    this.deathLength = this.snake.segments.length;
    this.screenFlashTimer = 0.2;
    this.audio.playDeath();
    if (this.score > this.highScore) {
      this.highScore = this.score;
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
