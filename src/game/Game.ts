import { Snake, Direction } from './Snake';
import { Grid } from './Grid';
import { InputManager } from './Input';
import { FoodItem, spawnFood, checkFoodCollision } from './Food';
import { Renderer } from '../rendering/Renderer';
import { SnakeRenderer } from '../rendering/SnakeRenderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { UI } from '../rendering/UI';
import { DeathScreen } from '../screens/DeathScreen';
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
  private state: GameState = GameState.PLAYING;
  private renderer: Renderer;
  private snakeRenderer: SnakeRenderer;
  private particles: ParticleSystem;
  private ui: UI;
  private deathScreen: DeathScreen;
  private input: InputManager;
  private grid: Grid;
  private snake: Snake;
  private foods: FoodItem[] = [];
  private currentTick = 0;

  private lastTimestamp = 0;
  private tickAccumulator = 0;
  private interpolation = 0;
  private currentTickRate = BASE_TICK_RATE;

  // Death animation
  private screenFlashTimer = 0;

  // Run stats
  score = 0;
  totalFoodEaten = 0;
  private deathLength = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.snakeRenderer = new SnakeRenderer();
    this.particles = new ParticleSystem();
    this.ui = new UI();
    this.deathScreen = new DeathScreen();
    this.input = new InputManager();
    this.grid = new Grid();

    this.snake = this.createSnake();
    this.foods.push(spawnFood(this.snake, this.foods, this.currentTick));
    this.input.onDirectionInput((dir) => this.onDirection(dir));

    // Click/tap handler for death screen restart
    canvas.addEventListener('click', (e) => this.onClick(e));
    canvas.addEventListener('touchend', (e) => this.onTap(e));
  }

  private createSnake(): Snake {
    const center = this.grid.centerCell();
    return new Snake(center);
  }

  private onDirection(dir: Direction): void {
    if (this.state === GameState.PLAYING) {
      this.snake.queueDirection(dir);
    }
  }

  private onClick(e: MouseEvent): void {
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

    // Update particles and UI every frame
    const dtSec = delta / 1000;
    this.particles.update(dtSec);
    this.ui.update(dtSec, this.score);

    // Update screen flash
    if (this.screenFlashTimer > 0) {
      this.screenFlashTimer = Math.max(0, this.screenFlashTimer - dtSec);
    }

    // Update death screen
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

    // Check wall collision
    if (checkWallCollision(head, this.grid.size)) {
      this.die();
      return;
    }

    // Check self collision
    if (checkSelfCollision(this.snake.segments)) {
      this.die();
      return;
    }

    // Check food collision
    const eatenFood = checkFoodCollision(head, this.foods);
    if (eatenFood) {
      this.snake.grow(1);
      this.score += 10;
      this.totalFoodEaten++;
      this.ui.triggerScorePulse();

      // Remove eaten food and spawn new one
      this.foods = this.foods.filter(f => f !== eatenFood);
      this.foods.push(spawnFood(this.snake, this.foods, this.currentTick));

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
    }
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawGrid();

    // Draw food
    this.drawFood();

    // Draw snake (still visible during death)
    this.snakeRenderer.draw(
      this.renderer.ctx,
      this.snake,
      this.renderer.layout,
      this.interpolation,
    );

    // Draw particles on top
    this.particles.render(this.renderer.ctx);

    // Draw HUD
    this.ui.drawHUD(
      this.renderer.ctx,
      this.renderer.layout,
      this.score,
      this.state === GameState.DEATH ? this.deathLength : this.snake.segments.length,
    );

    // Screen flash effect
    if (this.screenFlashTimer > 0) {
      const ctx = this.renderer.ctx;
      ctx.save();
      ctx.globalAlpha = this.screenFlashTimer * 5; // fade from 1 to 0 over 0.2s
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }

    // Death screen overlay
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

    // Emit death particles from each segment
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
    this.snake = this.createSnake();
    this.foods = [];
    this.foods.push(spawnFood(this.snake, this.foods, 0));
    this.score = 0;
    this.totalFoodEaten = 0;
    this.deathLength = 0;
    this.currentTick = 0;
    this.tickAccumulator = 0;
    this.interpolation = 0;
    this.currentTickRate = BASE_TICK_RATE;
    this.screenFlashTimer = 0;
    this.ui.reset();
    this.deathScreen.reset();
    this.state = GameState.PLAYING;
  }
}
