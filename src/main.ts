import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Screenshot mode: append ?screenshot=<scene> to URL
// Scenes: title, gameplay, powerup, death, collection, leaderboard
const screenshotScene = new URL(window.location.href).searchParams.get('screenshot');
if (screenshotScene) {
  game.setupScreenshot(screenshotScene);
}

game.start();
