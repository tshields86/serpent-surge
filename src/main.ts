import { Game } from './game/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

// Screenshot mode: append ?screenshot=<scene> to URL
// Scenes: title, gameplay, powerup, death, collection, leaderboard
const url = new URL(window.location.href);
const screenshotScene = url.searchParams.get('screenshot');
const forceReducedMotion = url.searchParams.get('rm') === '1';
if (screenshotScene) {
  game.setupScreenshot(screenshotScene, { reducedMotion: forceReducedMotion });
}

game.start();

// Service worker: production only. In dev it would cache the Vite bundle and
// shadow every code change until the user manually clears storage.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Clean up any SW left behind by a previous prod-mode visit.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
  if ('caches' in window) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
  }
}
