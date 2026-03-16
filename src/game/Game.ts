import { Snake, Direction } from './Snake';
import { Grid } from './Grid';
import { InputManager } from './Input';
import { Renderer } from '../rendering/Renderer';
import { SnakeRenderer } from '../rendering/SnakeRenderer';
import { checkWallCollision, checkSelfCollision } from './Collision';
import { BASE_TICK_RATE, MAX_DELTA } from '../utils/constants';

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
  private input: InputManager;
  private grid: Grid;
  private snake: Snake;

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
    this.input = new InputManager();
    this.grid = new Grid();

    this.snake = this.createSnake();
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
        this.tickAccumulator -= tickInterval;
      }

      this.interpolation = this.tickAccumulator / tickInterval;
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(): void {
    this.snake.move();

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
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawGrid();
    this.snakeRenderer.draw(
      this.renderer.ctx,
      this.snake,
      this.renderer.layout,
      this.interpolation,
    );
  }

  die(): void {
    this.state = GameState.DEATH;
  }

  restart(): void {
    this.snake = this.createSnake();
    this.score = 0;
    this.totalFoodEaten = 0;
    this.tickAccumulator = 0;
    this.interpolation = 0;
    this.currentTickRate = BASE_TICK_RATE;
    this.state = GameState.PLAYING;
  }
}
