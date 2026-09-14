import { PieceSymbol } from '@cinematic-chess/shared-types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape: 'circle' | 'spark' | 'ring' | 'rune';
}

export class ParticleEngine {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    if (canvas) {
      this.ctx = canvas.getContext('2d');
    } else {
      this.ctx = null;
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear() {
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Spawn capture impact burst at coordinate (x, y) relative to canvas
  spawnCaptureBurst(x: number, y: number, piece: PieceSymbol) {
    switch (piece) {
      case 'P':
        // Pawn: Sparks and quick metal shards
        this.createSparks(x, y, 20, '#fbbf24', 3);
        break;
      case 'N':
        // Knight: Dust cloud and green electrical sparks
        this.createDust(x, y, 25, '#34d399');
        this.createRings(x, y, 2, '#10b981');
        break;
      case 'B':
        // Bishop: Arcane purple/cyan rune burst
        this.createArcaneRunes(x, y, 30, '#a855f7', '#38bdf8');
        break;
      case 'R':
        // Rook: Heavy stone debris and shockwave ring
        this.createDebris(x, y, 35, '#f97316');
        this.createRings(x, y, 3, '#ea580c');
        break;
      case 'Q':
        // Queen: Supernova golden starburst with cosmic particles
        this.createSupernova(x, y, 60, '#fde047');
        this.createRings(x, y, 4, '#eab308');
        break;
      default:
        this.createSparks(x, y, 25, '#fbbf24', 4);
    }
    this.startLoop();
  }

  // Spawn golden victory embers for checkmate
  spawnVictoryEmbers(width: number, height: number) {
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: height + Math.random() * 50,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2 + 1.5),
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.3 ? '#fde047' : '#fbbf24',
        alpha: 1,
        decay: Math.random() * 0.008 + 0.004,
        gravity: -0.02, // float upwards
        shape: 'spark'
      });
    }
    this.startLoop();
  }

  private createSparks(x: number, y: number, count: number, color: string, speedMult: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 4 + 2) * speedMult;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.15,
        shape: 'spark'
      });
    }
  }

  private createDust(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color,
        alpha: 0.8,
        decay: Math.random() * 0.025 + 0.015,
        gravity: 0.05,
        shape: 'circle'
      });
    }
  }

  private createArcaneRunes(x: number, y: number, count: number, color1: string, color2: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color: i % 2 === 0 ? color1 : color2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
        gravity: -0.05, // arcane particles hover
        shape: 'rune'
      });
    }
  }

  private createDebris(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 4,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.018,
        gravity: 0.25,
        shape: 'circle'
      });
    }
  }

  private createSupernova(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012,
        gravity: 0.08,
        shape: 'spark'
      });
    }
  }

  private createRings(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: (i + 1) * 8,
        color,
        alpha: 0.9,
        decay: 0.035,
        gravity: 0,
        shape: 'ring'
      });
    }
  }

  private startLoop() {
    if (this.isRunning) return;
    if (typeof requestAnimationFrame === 'undefined') return;
    this.isRunning = true;

    const loop = () => {
      this.update();
      this.render();

      if (this.particles.length > 0 && typeof requestAnimationFrame !== 'undefined') {
        this.animFrameId = requestAnimationFrame(loop);
      } else {
        this.isRunning = false;
        this.animFrameId = null;
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;

      if (p.shape === 'ring') {
        p.size += 3.5;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'circle') {
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'spark') {
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'ring') {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (p.shape === 'rune') {
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      this.ctx.restore();
    }
  }
}

export const globalParticleEngine = new ParticleEngine();
