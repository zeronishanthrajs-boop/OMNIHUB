export type SoundEffectType =
  | 'move'
  | 'capture'
  | 'captureQueen'
  | 'castle'
  | 'check'
  | 'checkmate'
  | 'victory'
  | 'defeat'
  | 'promote';

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.7;

  constructor() {
    // Lazy AudioContext creation on first user interaction
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  play(type: SoundEffectType): void {
    const ctx = this.getContext();
    if (!ctx || !this.enabled || this.volume <= 0) return;

    try {
      switch (type) {
        case 'move':
          this.playTone(ctx, 420, 0.06, 'triangle', 0.15 * this.volume);
          break;
        case 'castle':
          this.playTone(ctx, 380, 0.08, 'triangle', 0.2 * this.volume);
          setTimeout(() => {
            if (this.ctx) this.playTone(this.ctx, 440, 0.08, 'triangle', 0.2 * this.volume);
          }, 80);
          break;
        case 'capture':
          this.playImpact(ctx, 160, 0.18, 0.4 * this.volume);
          break;
        case 'captureQueen':
          this.playImpact(ctx, 120, 0.35, 0.6 * this.volume, true);
          break;
        case 'check':
          this.playChord(ctx, [523.25, 659.25, 783.99], 0.3, 'sine', 0.4 * this.volume);
          break;
        case 'promote':
          this.playArpeggio(ctx, [440, 554.37, 659.25, 880], 0.08, 0.4 * this.volume);
          break;
        case 'checkmate':
        case 'victory':
          this.playFanfare(ctx);
          break;
        case 'defeat':
          this.playDefeat(ctx);
          break;
      }
    } catch (err) {
      console.warn('Sound playback failed:', err);
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    gainLevel: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playImpact(
    ctx: AudioContext,
    startFreq: number,
    duration: number,
    gainLevel: number,
    heavy: boolean = false
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = heavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  private playChord(
    ctx: AudioContext,
    freqs: number[],
    duration: number,
    type: OscillatorType,
    gainLevel: number
  ): void {
    freqs.forEach((f) => this.playTone(ctx, f, duration, type, gainLevel / freqs.length));
  }

  private playArpeggio(
    ctx: AudioContext,
    freqs: number[],
    stepDuration: number,
    gainLevel: number
  ): void {
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.ctx) this.playTone(this.ctx, freq, 0.2, 'sine', gainLevel);
      }, idx * stepDuration * 1000);
    });
  }

  private playFanfare(ctx: AudioContext): void {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.ctx) {
          this.playTone(this.ctx, freq, i === 3 ? 0.8 : 0.2, 'triangle', 0.3 * this.volume);
        }
      }, i * 140);
    });
  }

  private playDefeat(ctx: AudioContext): void {
    const notes = [392.0, 369.99, 349.23, 311.13];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (this.ctx) {
          this.playTone(this.ctx, freq, i === 3 ? 0.9 : 0.3, 'sawtooth', 0.25 * this.volume);
        }
      }, i * 200);
    });
  }
}

export const globalSoundSystem = new SoundSystem();
