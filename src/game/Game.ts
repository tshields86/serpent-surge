import { Snake, Direction } from './Snake';
import { Grid } from './Grid';
import { InputManager } from './Input';
import { FoodItem, spawnFood, checkFoodCollision } from './Food';
import { Renderer } from '../rendering/Renderer';
import { SnakeRenderer } from '../rendering/SnakeRenderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { UI } from '../rendering/UI';
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
  private input: InputManager;
  private grid: Grid;
  private snake: Snake;
  private foods: FoodItem[] = [];
  private currentTick = 0;

  private lastTimestamp = 0;
  private tickAccumulator = 0;
  private interpolation = 0;
  private currentTickRate = BASE_TICK_RATE;

  // Run stats
  score = 0;
  totalFoodEaten = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.snakeRenderer = new SnakeRenderer();
    this.particles = new ParticleSystem();
    this.ui = new UI();
    this.input = new InputManager();
    this.grid = new Grid();

    this.snake = this.createSnake();
    this.foods.push(spawnFood(this.snake, this.foods, this.currentTick));
    this.input.onDirectionInput((dir) => this.onDirection(dir));
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

    // Update particles and UI every frame (they use real time)
    const dtSec = delta / 1000;
    this.particles.update(dtSec);
    this.ui.update(dtSec, this.score);

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

      // Emit eat particles at the food's pixel position
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

    // Draw snake
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
      this.snake.segments.length,
    );
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

      // Draw apple as a circle
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
  }

  restart(): void {
    this.snake = this.createSnake();
    this.foods = [];
    this.foods.push(spawnFood(this.snake, this.foods, 0));
    this.score = 0;
    this.totalFoodEaten = 0;
    this.currentTick = 0;
    this.tickAccumulator = 0;
    this.interpolation = 0;
    this.currentTickRate = BASE_TICK_RATE;
    this.ui.reset();
    this.state = GameState.PLAYING;
  }
}
