import { COLORS } from '../utils/constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

const PAGE_TITLES = [
  'CONTROLS',
  'FOOD TYPES',
  'HAZARDS',
  'WAVES & ARENAS',
  'POWER-UPS',
  'SCALES & UNLOCKS',
];
const TOTAL_PAGES = PAGE_TITLES.length;

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class HowToPlayScreen {
  private visible = false;
  private currentPage = 0;
  private closeBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private prevBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private nextBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };

  show(): void {
    this.visible = true;
    this.currentPage = 0;
  }

  hide(): void {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.visible) return;

    ctx.save();

    // Backdrop
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    const titleSize = Math.min(18, Math.floor(width / 24));
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiAccent;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 10;
    ctx.fillText('HOW TO PLAY', width / 2, 45);
    ctx.shadowBlur = 0;

    // Page subtitle
    const subtitleSize = Math.min(11, Math.floor(width / 34));
    ctx.font = `${subtitleSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.score;
    ctx.fillText(PAGE_TITLES[this.currentPage]!, width / 2, 80);

    // Content area
    const contentWidth = Math.min(320, width - 40);
    const contentX = (width - contentWidth) / 2;
    const startY = 110;

    switch (this.currentPage) {
      case 0: this.drawControlsPage(ctx, contentX, contentWidth, startY); break;
      case 1: this.drawFoodPage(ctx, contentX, contentWidth, startY); break;
      case 2: this.drawHazardsPage(ctx, contentX, contentWidth, startY); break;
      case 3: this.drawWavesPage(ctx, contentX, contentWidth, startY); break;
      case 4: this.drawPowerUpsPage(ctx, contentX, contentWidth, startY); break;
      case 5: this.drawScalesPage(ctx, contentX, contentWidth, startY); break;
    }

    // Navigation arrows
    const arrowSize = Math.min(16, Math.floor(width / 28));
    const arrowY = height / 2;
    ctx.font = `${arrowSize}px ${FONT_FAMILY}`;

    if (this.currentPage > 0) {
      ctx.fillStyle = COLORS.uiAccent;
      ctx.textAlign = 'center';
      ctx.fillText('\u25C0', 24, arrowY);
      this.prevBounds = { x: 0, y: arrowY - 22, width: 48, height: 44 };
    } else {
      this.prevBounds = { x: 0, y: 0, width: 0, height: 0 };
    }

    if (this.currentPage < TOTAL_PAGES - 1) {
      ctx.fillStyle = COLORS.uiAccent;
      ctx.textAlign = 'center';
      ctx.fillText('\u25B6', width - 24, arrowY);
      this.nextBounds = { x: width - 48, y: arrowY - 22, width: 48, height: 44 };
    } else {
      this.nextBounds = { x: 0, y: 0, width: 0, height: 0 };
    }

    // Page dots
    const dotY = height - 65;
    const dotSpacing = 16;
    const dotsWidth = (TOTAL_PAGES - 1) * dotSpacing;
    const dotStartX = width / 2 - dotsWidth / 2;

    for (let i = 0; i < TOTAL_PAGES; i++) {
      ctx.beginPath();
      ctx.arc(dotStartX + i * dotSpacing, dotY, i === this.currentPage ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === this.currentPage ? COLORS.uiAccent : '#444';
      ctx.fill();
    }

    // Close button
    const closeSize = Math.min(10, Math.floor(width / 40));
    ctx.font = `${closeSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    const closeY = height - 30;
    ctx.fillText('CLOSE', width / 2, closeY);
    const closeMetrics = ctx.measureText('CLOSE');
    this.closeBounds = {
      x: width / 2 - closeMetrics.width / 2 - 10,
      y: closeY - closeSize,
      width: closeMetrics.width + 20,
      height: closeSize * 2.5,
    };

    ctx.restore();
  }

  handleClick(x: number, y: number): 'close' | null {
    if (!this.visible) return null;

    // Close button
    const cb = this.closeBounds;
    if (x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height) {
      return 'close';
    }

    // Previous page
    const pb = this.prevBounds;
    if (pb.width > 0 && x >= pb.x && x <= pb.x + pb.width && y >= pb.y && y <= pb.y + pb.height) {
      this.currentPage--;
      return null;
    }

    // Next page
    const nb = this.nextBounds;
    if (nb.width > 0 && x >= nb.x && x <= nb.x + nb.width && y >= nb.y && y <= nb.y + nb.height) {
      this.currentPage++;
      return null;
    }

    return null;
  }

  // --- Page renderers ---

  private drawControlsPage(ctx: CanvasRenderingContext2D, x: number, w: number, y: number): void {
    const bodySize = Math.min(8, Math.floor(ctx.canvas.width / 50));
    const headingSize = Math.min(9, Math.floor(ctx.canvas.width / 45));
    const lineH = bodySize + 8;

    let cy = y;

    // Mobile controls
    ctx.font = `${headingSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText('MOBILE', x, cy);
    cy += lineH + 4;

    ctx.font = `${bodySize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiText;
    const mobileLines = this.wrapText(ctx, 'Swipe in any direction to turn the snake. Swipe while turning to queue your next move.', w);
    for (const line of mobileLines) {
      ctx.fillText(line, x, cy);
      cy += lineH;
    }

    cy += lineH;

    // Keyboard controls
    ctx.font = `${headingSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText('KEYBOARD', x, cy);
    cy += lineH + 4;

    ctx.font = `${bodySize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiText;

    const controls = [
      ['ARROW KEYS / WASD', 'Move'],
      ['ENTER / TAP', 'Start game'],
      ['ESC', 'Pause / Back'],
    ];
    for (const [key, desc] of controls) {
      ctx.fillStyle = COLORS.score;
      ctx.fillText(key!, x, cy);
      cy += lineH;
      ctx.fillStyle = '#999';
      ctx.fillText(desc!, x + 10, cy);
      cy += lineH + 2;
    }

    cy += lineH;

    // Goal
    ctx.font = `${headingSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiAccent;
    ctx.fillText('GOAL', x, cy);
    cy += lineH + 4;

    ctx.font = `${bodySize}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.uiText;
    const goalLines = this.wrapText(ctx, 'Eat food to grow and clear waves. Avoid walls, hazards, and your own tail. Survive as long as you can!', w);
    for (const line of goalLines) {
      ctx.fillText(line, x, cy);
      cy += lineH;
    }
  }

  private drawFoodPage(ctx: CanvasRenderingContext2D, x: number, w: number, y: number): void {
    const nameSize = Math.min(9, Math.floor(ctx.canvas.width / 45));
    const descSize = Math.min(8, Math.floor(ctx.canvas.width / 50));
    const lineH = descSize + 6;
    const itemGap = 14;

    const foods: [string, string, string, string][] = [
      [COLORS.apple, 'APPLE', '+10 pts, +1 length', 'Basic food. Eat to grow and score.'],
      [COLORS.goldenApple, 'GOLDEN APPLE', '+50 pts, +1 length', 'Rare and valuable. Pulsing gold glow.'],
      [COLORS.shrinkPellet, 'SHRINK PELLET', '+25 pts, -2 length', 'Makes you shorter. Great for tight spaces.'],
      [COLORS.speedFruit, 'SPEED FRUIT', '+15 pts, 1.5x speed', 'Temporary speed boost for 3 seconds.'],
      [COLORS.bombFruit, 'BOMB FRUIT', '+30 pts, clears hazards', 'Destroys hazards in a 3x3 area.'],
    ];

    let cy = y;
    for (const [color, name, stats, desc] of foods) {
      // Color swatch
      ctx.beginPath();
      ctx.arc(x + 8, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Name
      ctx.font = `${nameSize}px ${FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.uiText;
      ctx.fillText(name, x + 22, cy + 2);

      // Stats
      cy += lineH + 2;
      ctx.font = `${descSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.score;
      ctx.fillText(stats, x + 22, cy);

      // Description
      cy += lineH;
      ctx.fillStyle = '#999';
      const lines = this.wrapText(ctx, desc, w - 22);
      for (const line of lines) {
        ctx.fillText(line, x + 22, cy);
        cy += lineH;
      }

      cy += itemGap;
    }
  }

  private drawHazardsPage(ctx: CanvasRenderingContext2D, x: number, w: number, y: number): void {
    const nameSize = Math.min(9, Math.floor(ctx.canvas.width / 45));
    const descSize = Math.min(8, Math.floor(ctx.canvas.width / 50));
    const lineH = descSize + 6;
    const itemGap = 14;

    const hazards: [string, string, string][] = [
      ['#8b0000', 'WALL BLOCK', 'Static obstacle. Deadly on contact. Can be destroyed by Bomb Fruit or Head Bash.'],
      ['#ff0040', 'SPIKE TRAP', 'Toggles on and off every few ticks. Safe when retracted, deadly when red.'],
      ['#7b00ff', 'POISON TRAIL', 'Fades after 8 ticks. Avoid the purple glow until it disappears.'],
      ['#7722cc', 'WARP HOLE', 'Comes in pairs. Enter one, exit the other. Not harmful but disorienting!'],
      ['#ff3333', 'MAGNET', 'Pulls nearby food toward it each tick. Plan your route carefully.'],
    ];

    let cy = y;
    for (const [color, name, desc] of hazards) {
      // Color swatch
      ctx.beginPath();
      ctx.arc(x + 8, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Name
      ctx.font = `${nameSize}px ${FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.uiText;
      ctx.fillText(name, x + 22, cy + 2);

      // Description
      cy += lineH + 2;
      ctx.font = `${descSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#999';
      const lines = this.wrapText(ctx, desc, w - 22);
      for (const line of lines) {
        ctx.fillText(line, x + 22, cy);
        cy += lineH;
      }

      cy += itemGap;
    }
  }

  private drawWavesPage(ctx: CanvasRenderingContext2D, x: number, w: number, y: number): void {
    const headingSize = Math.min(9, Math.floor(ctx.canvas.width / 45));
    const bodySize = Math.min(8, Math.floor(ctx.canvas.width / 50));
    const lineH = bodySize + 8;

    let cy = y;

    const sections: [string, string][] = [
      ['ARENAS', 'Each run is a series of arenas. Clear all 3 waves in an arena to advance to the next one.'],
      ['WAVES', 'Each wave has a food quota. Eat enough food to clear the wave. Quotas increase: 5, 7, then 9.'],
      ['DIFFICULTY', 'Hazards appear starting from wave 2 and increase each wave. The snake also speeds up as waves progress.'],
      ['BOSSES', 'Every 5th arena features a boss fight with unique attack patterns. Defeat them to earn bonus Scales.'],
      ['BETWEEN ARENAS', 'After clearing an arena you choose 1 of 3 power-ups to carry into the next arena.'],
    ];

    for (const [title, text] of sections) {
      ctx.font = `${headingSize}px ${FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.uiAccent;
      ctx.fillText(title, x, cy);
      cy += lineH;

      ctx.font = `${bodySize}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.uiText;
      const lines = this.wrapText(ctx, text, w);
      for (const line of lines) {
        ctx.fillText(line, x, cy);
        cy += lineH;
      }
      cy += 8;
    }
  }

  private drawPowerUpsPage(ctx: CanvasRenderingContext2D, x: number, w: number, y: number): void {
    const headingSize = Math.min(9, Math.floor(ctx.canvas.width / 45));
    const bodySize = Math.min(8, Math.floor(ctx.canvas.width / 50));
    const lineH = bodySize + 8;

    let cy = y;

    const sections: [string, string][] = [
      ['SELECTION', 'After each arena, pick 1 of 3 random power-ups. They stack and carry across arenas within a run.'],
      ['RARITY', 'Power-ups come in 3 tiers: Common (white), Rare (blue), and Legendary (gold). Higher rarity = stronger effects.'],
      ['STACKING', 'Picking the same power-up again makes it stronger. Some power-ups also combine into hidden synergies.'],
      ['SYNERGIES', 'Certain power-up pairs unlock secret bonus effects! Experiment with different combinations to discover them all.'],
      ['REROLL', 'Unlock the Reroll ability in the Collection to get a fresh set of 3 choices if you don\'t like your options.'],
    ];

    for (const [title, text] of sections) {
      ctx.font = `${headingSize}px ${FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.uiAccent;
      ctx.fillText(title, x, cy);
      cy += lineH;

      ctx.font = `${bodySize}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.uiText;
      const lines = this.wrapText(ctx, text, w);
      for (const line of lines) {
        ctx.fillText(line, x, cy);
        cy += lineH;
      }
      cy += 8;
    }
  }

  private drawScalesPage(ctx: CanvasRenderingContext2D, x: number, w: number, y: number): void {
    const headingSize = Math.min(9, Math.floor(ctx.canvas.width / 45));
    const bodySize = Math.min(8, Math.floor(ctx.canvas.width / 50));
    const lineH = bodySize + 8;

    let cy = y;

    const sections: [string, string][] = [
      ['SCALES', 'Scales are the meta currency earned after each run. Your reward is based on score, arenas cleared, and food eaten.'],
      ['UNLOCKS', 'Spend Scales in the Collection to unlock permanent upgrades that carry across all future runs.'],
      ['UPGRADES', 'Starting Length 4, Reroll power-ups, Arena Preview, Extra Life, and Endless Mode are all available to unlock.'],
      ['SKINS', 'Unlock cosmetic snake skins to customize your look. Pure style, no gameplay advantage.'],
      ['DAILY CHALLENGE', 'A seeded daily run where everyone gets the same layout. Compete for the top of the daily leaderboard!'],
    ];

    for (const [title, text] of sections) {
      ctx.font = `${headingSize}px ${FONT_FAMILY}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.uiAccent;
      ctx.fillText(title, x, cy);
      cy += lineH;

      ctx.font = `${bodySize}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.uiText;
      const lines = this.wrapText(ctx, text, w);
      for (const line of lines) {
        ctx.fillText(line, x, cy);
        cy += lineH;
      }
      cy += 8;
    }
  }

  // --- Helpers ---

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}
