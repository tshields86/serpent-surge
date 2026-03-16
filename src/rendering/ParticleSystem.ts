interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export interface ParticleConfig {
  speed: number;
  lifetime: number;
  color: string;
  size: number;
  count: number;
}

const POOL_SIZE = 200;

export class ParticleSystem {
  private pool: Particle[];

  constructor() {
    this.pool = Array.from({ length: POOL_SIZE }, () => ({
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 0, color: '', size: 0, active: false,
    }));
  }

  emit(x: number, y: number, config: ParticleConfig): void {
    for (let i = 0; i < config.count; i++) {
      const p = this.getAvailable();
      if (!p) return;

      p.x = x;
      p.y = y;
      p.vx = (Math.random() - 0.5) * config.speed;
      p.vy = (Math.random() - 0.5) * config.speed;
      p.life = config.lifetime;
      p.maxLife = config.lifetime;
      p.color = config.color;
      p.size = config.size;
      p.active = true;
    }
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const half = p.size / 2;
      ctx.fillRect(p.x - half, p.y - half, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private getAvailable(): Particle | null {
    let oldest: Particle | null = null;
    for (const p of this.pool) {
      if (!p.active) return p;
      if (!oldest || p.life < oldest.life) oldest = p;
    }
    return oldest;
  }
}
