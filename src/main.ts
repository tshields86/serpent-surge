import { COLORS } from './utils/constants';

function setup(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  function resize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw(ctx!);
  }

  function draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();
}

setup();
