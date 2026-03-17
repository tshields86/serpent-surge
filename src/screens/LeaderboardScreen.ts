import { COLORS } from '../utils/constants';
import { LeaderboardEntry } from '../meta/Leaderboard';

type Tab = 'all-time' | 'daily';

export class LeaderboardScreen {
  private visible = false;
  private activeTab: Tab = 'all-time';
  private allTimeEntries: LeaderboardEntry[] = [];
  private dailyEntries: LeaderboardEntry[] = [];
  private loading = false;

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setEntries(allTime: LeaderboardEntry[], daily: LeaderboardEntry[]): void {
    this.allTimeEntries = allTime;
    this.dailyEntries = daily;
    this.loading = false;
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.visible) return;

    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 10, 0.95)';
    ctx.fillRect(0, 0, width, height);

    // Title
    const titleSize = Math.min(18, Math.floor(width / 24));
    ctx.font = `${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.score;
    ctx.shadowColor = COLORS.score;
    ctx.shadowBlur = 10;
    ctx.fillText('LEADERBOARD', width / 2, 40);
    ctx.shadowBlur = 0;

    // Tabs
    const tabSize = Math.min(10, Math.floor(width / 40));
    ctx.font = `${tabSize}px "Press Start 2P", monospace`;
    const tabY = 70;

    ctx.fillStyle = this.activeTab === 'all-time' ? COLORS.uiAccent : '#666';
    ctx.textAlign = 'right';
    ctx.fillText('ALL TIME', width / 2 - 10, tabY);

    ctx.fillStyle = this.activeTab === 'daily' ? COLORS.uiAccent : '#666';
    ctx.textAlign = 'left';
    ctx.fillText('DAILY', width / 2 + 10, tabY);

    // Loading
    if (this.loading) {
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.uiText;
      ctx.fillText('LOADING...', width / 2, height / 2);
      ctx.restore();
      return;
    }

    // Entries
    const entries = this.activeTab === 'all-time' ? this.allTimeEntries : this.dailyEntries;
    const entrySize = Math.min(9, Math.floor(width / 45));
    ctx.font = `${entrySize}px "Press Start 2P", monospace`;
    const startY = 100;
    const rowHeight = 22;
    const maxVisible = Math.floor((height - startY - 40) / rowHeight);

    if (entries.length === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666';
      ctx.fillText('NO SCORES YET', width / 2, height / 2);
    } else {
      for (let i = 0; i < Math.min(entries.length, maxVisible); i++) {
        const entry = entries[i]!;
        const y = startY + i * rowHeight;

        // Rank
        ctx.textAlign = 'left';
        ctx.fillStyle = i < 3 ? COLORS.score : COLORS.uiText;
        ctx.fillText(`${i + 1}.`, 30, y);

        // Name
        ctx.fillText(entry.player_name, 70, y);

        // Score
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.score;
        ctx.fillText(`${entry.score}`, width - 30, y);
      }
    }

    // Close instruction
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = `${Math.min(8, Math.floor(width / 50))}px "Press Start 2P", monospace`;
    ctx.fillText('TAP TABS TO SWITCH • ESC TO CLOSE', width / 2, height - 20);

    ctx.restore();
  }

  /** Handle click — returns 'tab-switch' or 'close' or null */
  handleClick(x: number, y: number, width: number): 'close' | null {
    const tabY = 70;
    if (y >= tabY - 15 && y <= tabY + 15) {
      if (x < width / 2) {
        this.activeTab = 'all-time';
      } else {
        this.activeTab = 'daily';
      }
    }
    return null;
  }
}
