import { Renderer } from './rendering/Renderer';

function setup(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const renderer = new Renderer(canvas);

  function draw(): void {
    renderer.clear();
    renderer.drawGrid();
  }

  window.addEventListener('resize', () => draw());
  draw();
}

setup();
