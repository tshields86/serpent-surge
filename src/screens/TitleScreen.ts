import { COLORS } from '../utils/constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

export interface TitleAction {
  action: 'start' | 'settings' | 'daily' | 'collection' | 'leaderboard' | 'howtoplay';
}

interface ButtonBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class TitleScreen {
  private pulseTimer = 0;
  private settingsBounds: ButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
  private dailyBounds: ButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
  private collectionBounds: ButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
  private leaderboardBounds: ButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
  private howToPlayBounds: ButtonBounds = { x: 0, y: 0, width: 0, height: 0 };
  update(dt: number): void {
    this.pulseTimer += dt;
  }

  draw(ctx: CanvasRenderingContext2D, highScore: number, totalScales?: number, dailyBest?: number): void {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title: "SERPENT" on one line, "SURGE" on next
    const titleSize = Math.min(36, Math.floor(width / 12));
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;

    // Glow effect for title
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.snakeBody;

    const titleY = height * 0.22;
    ctx.fillText('SERPENT', centerX, titleY);
    ctx.fillText('SURGE', centerX, titleY + titleSize * 1.6);

    ctx.shadowBlur = 0;

    // Pulsing "TAP TO START"
    const promptSize = Math.min(12, Math.floor(width / 35));
    ctx.font = `${promptSize}px ${FONT_FAMILY}`;
    const pulseAlpha = 0.4 + Math.sin(this.pulseTimer * 3) * 0.4 + 0.2;
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = COLORS.uiText;
    const startY = height * 0.48;
    ctx.fillText('TAP TO START', centerX, startY);
    ctx.globalAlpha = 1;

    // High score
    if (highScore > 0) {
      const hsSize = Math.min(10, Math.floor(width / 40));
      ctx.font = `${hsSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.score;
      ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, centerX, height * 0.56);
    }

    // Menu buttons
    const btnSize = Math.min(11, Math.floor(width / 36));
    ctx.font = `${btnSize}px ${FONT_FAMILY}`;
    const btnStartY = height * 0.66;
    const btnSpacing = btnSize * 3.5;

    // Daily Challenge (featured — gold)
    ctx.fillStyle = '#ffd700';
    const dailyY = btnStartY;
    const dailyLabel = dailyBest !== undefined && dailyBest > 0
      ? `DAILY CHALLENGE (${dailyBest})`
      : 'DAILY CHALLENGE';
    ctx.fillText(dailyLabel, centerX, dailyY);
    const dailyMetrics = ctx.measureText(dailyLabel);
    this.dailyBounds = {
      x: centerX - dailyMetrics.width / 2 - 10,
      y: dailyY - btnSize,
      width: dailyMetrics.width + 20,
      height: Math.max(44, btnSize * 2.5),
    };

    // How To Play (help — cyan)
    ctx.fillStyle = '#66ccff';
    const htpY = btnStartY + btnSpacing;
    ctx.fillText('HOW TO PLAY', centerX, htpY);
    const htpMetrics = ctx.measureText('HOW TO PLAY');
    this.howToPlayBounds = {
      x: centerX - htpMetrics.width / 2 - 10,
      y: htpY - btnSize,
      width: htpMetrics.width + 20,
      height: Math.max(44, btnSize * 2.5),
    };

    // Collection (progression — green)
    ctx.fillStyle = COLORS.uiAccent;
    const collY = btnStartY + btnSpacing * 2;
    ctx.fillText('COLLECTION', centerX, collY);
    const collMetrics = ctx.measureText('COLLECTION');
    this.collectionBounds = {
      x: centerX - collMetrics.width / 2 - 10,
      y: collY - btnSize,
      width: collMetrics.width + 20,
      height: Math.max(44, btnSize * 2.5),
    };

    // Leaderboard (progression — green)
    ctx.fillStyle = COLORS.uiAccent;
    const lbY = btnStartY + btnSpacing * 3;
    ctx.fillText('LEADERBOARD', centerX, lbY);
    const lbMetrics = ctx.measureText('LEADERBOARD');
    this.leaderboardBounds = {
      x: centerX - lbMetrics.width / 2 - 10,
      y: lbY - btnSize,
      width: lbMetrics.width + 20,
      height: Math.max(44, btnSize * 2.5),
    };

    // Settings (utility — gray)
    ctx.fillStyle = '#888';
    const settingsY = btnStartY + btnSpacing * 4;
    ctx.fillText('SETTINGS', centerX, settingsY);
    const settingsMetrics = ctx.measureText('SETTINGS');
    this.settingsBounds = {
      x: centerX - settingsMetrics.width / 2 - 10,
      y: settingsY - btnSize,
      width: settingsMetrics.width + 20,
      height: Math.max(44, btnSize * 2.5),
    };

    // Scales display
    if (totalScales !== undefined && totalScales > 0) {
      const scaleSize = Math.min(9, Math.floor(width / 45));
      ctx.font = `${scaleSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#888';
      ctx.fillText(`SCALES: ${totalScales}`, centerX, height * 0.93);
    }

    ctx.restore();
  }

  handleClick(x: number, y: number): TitleAction | null {
    if (this.isInBounds(x, y, this.dailyBounds)) return { action: 'daily' };
    if (this.isInBounds(x, y, this.collectionBounds)) return { action: 'collection' };
    if (this.isInBounds(x, y, this.leaderboardBounds)) return { action: 'leaderboard' };
    if (this.isInBounds(x, y, this.howToPlayBounds)) return { action: 'howtoplay' };
    if (this.isInBounds(x, y, this.settingsBounds)) return { action: 'settings' };
    // Anywhere else starts the game
    return { action: 'start' };
  }

  private isInBounds(x: number, y: number, b: ButtonBounds): boolean {
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }
}
