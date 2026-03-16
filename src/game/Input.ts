import { Direction } from './Snake';

const SWIPE_THRESHOLD = 30; // pixels

export class InputManager {
  private callback: ((dir: Direction) => void) | null = null;
  private swipeStartX = 0;
  private swipeStartY = 0;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    window.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: true });
  }

  onDirectionInput(callback: (dir: Direction) => void): void {
    this.callback = callback;
  }

  private emit(dir: Direction): void {
    this.callback?.(dir);
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.emit(Direction.UP);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        this.emit(Direction.DOWN);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.emit(Direction.LEFT);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.emit(Direction.RIGHT);
        break;
    }
  }

  private onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    if (!touch) return;
    this.swipeStartX = touch.clientX;
    this.swipeStartY = touch.clientY;
  }

  private onTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - this.swipeStartX;
    const dy = touch.clientY - this.swipeStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;

    if (absDx > absDy) {
      this.emit(dx > 0 ? Direction.RIGHT : Direction.LEFT);
    } else {
      this.emit(dy > 0 ? Direction.DOWN : Direction.UP);
    }
  }
}
