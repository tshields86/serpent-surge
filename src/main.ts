import { Renderer } from './rendering/Renderer';
import { SnakeRenderer } from './rendering/SnakeRenderer';
import { Snake } from './game/Snake';
import { InputManager } from './game/Input';
import { BASE_TICK_RATE, GRID_SIZE, MAX_DELTA } from './utils/constants';

function setup(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const renderer = new Renderer(canvas);
  const snakeRenderer = new SnakeRenderer();
  const input = new InputManager();

  const center = { x: 10, y: 10 };
  const snake = new Snake(center);

  input.onDirectionInput((dir) => snake.queueDirection(dir));

  let lastTimestamp = 0;
  let tickAccumulator = 0;
  const tickInterval = 1000 / BASE_TICK_RATE;

  function loop(timestamp: number): void {
    const delta = Math.min(timestamp - lastTimestamp, MAX_DELTA);
    lastTimestamp = timestamp;

    tickAccumulator += delta;

    while (tickAccumulator >= tickInterval) {
      snake.move();
      // Temporary: wrap at grid boundaries so snake stays visible
      for (const seg of snake.segments) {
        seg.x = ((seg.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
        seg.y = ((seg.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
      }
      tickAccumulator -= tickInterval;
    }

    const interpolation = tickAccumulator / tickInterval;

    renderer.clear();
    renderer.drawGrid();
    snakeRenderer.draw(renderer.ctx, snake, renderer.layout, interpolation);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame((t) => {
    lastTimestamp = t;
    loop(t);
  });
}

setup();
