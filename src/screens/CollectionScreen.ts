import { COLORS } from '../utils/constants';
import { getUnlockStatus, ProgressionData, purchaseUnlock } from '../meta/Progression';

export class CollectionScreen {
  private scrollOffset = 0;
  private visible = false;
  private closeBounds = { x: 0, y: 0, width: 0, height: 0 };

  show(): void {
    this.visible = true;
    this.scrollOffset = 0;
  }

  hide(): void {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, data: ProgressionData): void {
    if (!this.visible) return;
    // Semi-transparent backdrop
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Title
    const titleSize = Math.min(20, Math.floor(width / 22));
    ctx.font = `${titleSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.uiAccent;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 15;
    ctx.fillText('COLLECTION', width / 2, 50);

    // Scales balance
    ctx.shadowBlur = 0;
    const balanceSize = Math.min(14, Math.floor(width / 30));
    ctx.font = `${balanceSize}px "Press Start 2P", monospace`;
    ctx.fillStyle = COLORS.score;
    ctx.fillText(`${data.totalScales} SCALES`, width / 2, 85);

    // Unlock cards
    const unlocks = getUnlockStatus(data);
    const cardWidth = Math.min(320, width - 40);
    const cardHeight = 70;
    const cardGap = 12;
    const startY = 120 - this.scrollOffset;

    for (let i = 0; i < unlocks.length; i++) {
      const unlock = unlocks[i]!;
      const y = startY + i * (cardHeight + cardGap);

      if (y + cardHeight < 0 || y > height) continue;

      const cardX = (width - cardWidth) / 2;

      // Card background
      ctx.fillStyle = unlock.owned
        ? 'rgba(0, 255, 65, 0.15)'
        : unlock.affordable
          ? 'rgba(255, 215, 0, 0.1)'
          : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(cardX, y, cardWidth, cardHeight);

      // Border
      ctx.strokeStyle = unlock.owned ? COLORS.uiAccent : unlock.affordable ? COLORS.score : '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, y, cardWidth, cardHeight);

      // Name
      const nameSize = Math.min(10, Math.floor(width / 40));
      ctx.font = `${nameSize}px "Press Start 2P", monospace`;
      ctx.textAlign = 'left';
      ctx.fillStyle = unlock.owned ? COLORS.uiAccent : COLORS.uiText;
      ctx.fillText(unlock.name, cardX + 12, y + 22);

      // Description — word wrap within card
      const descSize = Math.min(8, Math.floor(width / 50));
      ctx.font = `${descSize}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#999';
      const maxDescWidth = cardWidth - 24;
      const words = unlock.description.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        const test = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(test).width > maxDescWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
      const lineHeight = descSize + 4;
      for (let l = 0; l < lines.length; l++) {
        ctx.fillText(lines[l]!, cardX + 12, y + 44 + l * lineHeight);
      }

      // Cost / Owned
      ctx.textAlign = 'right';
      if (unlock.owned) {
        ctx.fillStyle = COLORS.uiAccent;
        ctx.fillText('OWNED', cardX + cardWidth - 12, y + 22);
      } else {
        ctx.fillStyle = unlock.affordable ? COLORS.score : '#666';
        ctx.font = `${nameSize}px "Press Start 2P", monospace`;
        ctx.fillText(`${unlock.cost} \u2666`, cardX + cardWidth - 12, y + 22);
      }
    }

    // Hint — directly below the last card
    const hintY = startY + unlocks.length * (cardHeight + cardGap) + 10;
    const instrSize = Math.min(8, Math.floor(width / 50));
    ctx.font = `${instrSize}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.fillText('TAP TO SPEND SCALES', width / 2, hintY);

    // Close button
    const closeSize = Math.min(10, Math.floor(width / 40));
    ctx.font = `${closeSize}px "Press Start 2P", monospace`;
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

  /** Returns unlock ID if user clicked on a purchasable card, 'back' for close, null otherwise */
  handleClick(
    x: number, y: number,
    width: number, _height: number,
    data: ProgressionData,
  ): string | null {
    // Check close button
    const cb = this.closeBounds;
    if (x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height) {
      return 'back';
    }

    const unlocks = getUnlockStatus(data);
    const cardWidth = Math.min(320, width - 40);
    const cardHeight = 70;
    const cardGap = 12;
    const startY = 120 - this.scrollOffset;
    const cardX = (width - cardWidth) / 2;

    for (let i = 0; i < unlocks.length; i++) {
      const unlock = unlocks[i]!;
      const cy = startY + i * (cardHeight + cardGap);
      if (x >= cardX && x <= cardX + cardWidth && y >= cy && y <= cy + cardHeight) {
        if (!unlock.owned && unlock.affordable) {
          return unlock.id;
        }
        return null;
      }
    }
    return null;
  }

  /** Attempt to purchase an unlock */
  tryPurchase(data: ProgressionData, unlockId: string): ProgressionData | null {
    return purchaseUnlock(data, unlockId);
  }

  reset(): void {
    this.scrollOffset = 0;
  }
}
