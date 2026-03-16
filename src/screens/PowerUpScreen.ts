import { PowerUpDefinition, RARITY_COLORS } from '../data/powerups';
import { PowerUpInstance, getPowerUpDef } from '../game/PowerUp';
import { COLORS } from '../utils/constants';

const FONT_FAMILY = '"Press Start 2P", monospace';

interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PowerUpScreen {
  private offerings: PowerUpDefinition[] = [];
  private cardLayouts: CardLayout[] = [];
  private selectedIndex = -1;
  private selectTimer = 0;
  private fadeIn = 0;

  setOfferings(offerings: PowerUpDefinition[]): void {
    this.offerings = offerings;
    this.selectedIndex = -1;
    this.selectTimer = 0;
    this.fadeIn = 0;
  }

  update(dt: number): void {
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + dt * 3);
    }
    if (this.selectedIndex >= 0) {
      this.selectTimer += dt;
    }
  }

  /** Returns true when selection animation is done */
  isSelectionComplete(): boolean {
    return this.selectedIndex >= 0 && this.selectTimer >= 0.5;
  }

  getSelectedPowerUp(): PowerUpDefinition | null {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.offerings.length) {
      return this.offerings[this.selectedIndex]!;
    }
    return null;
  }

  /** Check if click hits a card, return index or -1 */
  handleClick(x: number, y: number): number {
    if (this.selectedIndex >= 0) return -1; // already selected
    for (let i = 0; i < this.cardLayouts.length; i++) {
      const card = this.cardLayouts[i]!;
      if (x >= card.x && x <= card.x + card.width &&
          y >= card.y && y <= card.y + card.height) {
        this.selectedIndex = i;
        this.selectTimer = 0;
        return i;
      }
    }
    return -1;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    heldPowerUps: readonly PowerUpInstance[],
  ): void {
    // Dim overlay
    ctx.save();
    ctx.globalAlpha = 0.7 * this.fadeIn;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    if (this.offerings.length === 0) return;

    ctx.save();
    ctx.globalAlpha = this.fadeIn;

    // Title
    const titleSize = Math.min(18, Math.floor(canvasWidth / 30));
    ctx.font = `${titleSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.score;
    ctx.shadowColor = COLORS.score;
    ctx.shadowBlur = 10;
    ctx.fillText('CHOOSE POWER-UP', canvasWidth / 2, canvasHeight * 0.12);
    ctx.shadowBlur = 0;

    // Cards
    const cardCount = this.offerings.length;
    const cardWidth = Math.min(180, Math.floor((canvasWidth - 80) / cardCount - 20));
    const cardHeight = Math.floor(cardWidth * 1.4);
    const gap = 20;
    const totalWidth = cardCount * cardWidth + (cardCount - 1) * gap;
    const startX = (canvasWidth - totalWidth) / 2;
    const cardY = canvasHeight * 0.2;

    this.cardLayouts = [];

    for (let i = 0; i < cardCount; i++) {
      const def = this.offerings[i]!;
      const x = startX + i * (cardWidth + gap);
      this.cardLayouts.push({ x, y: cardY, width: cardWidth, height: cardHeight });

      const isSelected = this.selectedIndex === i;
      const scale = isSelected ? 1 + this.selectTimer * 0.3 : 1;
      const rarityColor = RARITY_COLORS[def.rarity];

      ctx.save();

      if (isSelected) {
        const cx = x + cardWidth / 2;
        const cy = cardY + cardHeight / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        ctx.globalAlpha = Math.max(0, 1 - this.selectTimer * 1.5);
      }

      // Card background
      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 3;
      this.roundRect(ctx, x, cardY, cardWidth, cardHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Rarity glow
      ctx.shadowColor = rarityColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 1;
      this.roundRect(ctx, x + 4, cardY + 4, cardWidth - 8, cardHeight - 8, 6);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Icon
      const iconSize = Math.min(36, Math.floor(cardWidth * 0.3));
      ctx.font = `${iconSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, x + cardWidth / 2, cardY + cardHeight * 0.25);

      // Name
      const nameSize = Math.min(9, Math.floor(cardWidth / 16));
      ctx.font = `${nameSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(def.name, x + cardWidth / 2, cardY + cardHeight * 0.48);

      // Rarity label
      const raritySize = Math.min(7, Math.floor(cardWidth / 22));
      ctx.font = `${raritySize}px ${FONT_FAMILY}`;
      ctx.fillStyle = rarityColor;
      ctx.fillText(def.rarity, x + cardWidth / 2, cardY + cardHeight * 0.58);

      // Description (wrapped)
      const descSize = Math.min(7, Math.floor(cardWidth / 22));
      ctx.font = `${descSize}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#aaaaaa';
      this.wrapText(ctx, def.description, x + cardWidth / 2, cardY + cardHeight * 0.72, cardWidth - 16, descSize + 4);

      ctx.restore();
    }

    // Held power-ups at bottom
    if (heldPowerUps.length > 0) {
      const heldY = canvasHeight * 0.85;
      const iconSmall = Math.min(10, Math.floor(canvasWidth / 50));
      ctx.font = `${iconSmall}px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.uiText;
      ctx.fillText('HELD:', canvasWidth / 2, heldY - 15);

      const heldIconSize = 20;
      const heldTotalWidth = heldPowerUps.length * (heldIconSize + 8);
      const heldStartX = (canvasWidth - heldTotalWidth) / 2;

      ctx.font = `${heldIconSize}px serif`;
      for (let i = 0; i < heldPowerUps.length; i++) {
        const pu = heldPowerUps[i]!;
        const def = getPowerUpDef(pu.id);
        ctx.fillText(def.icon, heldStartX + i * (heldIconSize + 8) + heldIconSize / 2, heldY + 10);
      }
    }

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string, x: number, y: number, maxWidth: number, lineHeight: number,
  ): void {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, lineY);
        line = word;
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, lineY);
  }

  reset(): void {
    this.offerings = [];
    this.cardLayouts = [];
    this.selectedIndex = -1;
    this.selectTimer = 0;
    this.fadeIn = 0;
  }
}
