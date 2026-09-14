import { GameEvent, AnimationLevel, PieceSymbol, Square } from '@cinematic-chess/shared-types';
import { SoundSystem, globalSoundSystem } from './soundSystem';

export type AnimationTier = 'TierA_Micro' | 'TierB_Tactical' | 'TierC_Cinematic';

export interface ActiveAnimationState {
  tier: AnimationTier;
  event: GameEvent;
  durationMs: number;
  progress: number; // 0..1
  isCheckSequence: boolean;
  isCheckmateSequence: boolean;
  isPromotionSequence: boolean;
  isCaptureSequence: boolean;
  attackerPiece: PieceSymbol;
  capturedPiece?: PieceSymbol;
  sourceSquare?: Square;
  targetSquare?: Square;
  surroundingAttackers: Square[];
  kingSquare?: Square;
  checkRay?: { from: Square; to: Square };
  shakeIntensity: number; // 0..3
  canSkip: boolean;
}

export class AnimationManager {
  private sound: SoundSystem;
  private currentAnimation: ActiveAnimationState | null = null;
  private skipRequested: boolean = false;
  private onStateChangeListeners: ((state: ActiveAnimationState | null) => void)[] = [];

  constructor(soundSystem: SoundSystem = globalSoundSystem) {
    this.sound = soundSystem;
  }

  getCurrentAnimation(): ActiveAnimationState | null {
    return this.currentAnimation;
  }

  onAnimationStateChange(cb: (state: ActiveAnimationState | null) => void): () => void {
    this.onStateChangeListeners.push(cb);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== cb);
    };
  }

  private notify(state: ActiveAnimationState | null) {
    this.currentAnimation = state;
    for (const l of this.onStateChangeListeners) {
      l(state);
    }
  }

  skip(): void {
    this.skipRequested = true;
  }

  classifyTier(event: GameEvent): AnimationTier {
    if (event.isCheckmate) {
      return 'TierC_Cinematic';
    }
    if (
      event.isCheck ||
      (event.capture && event.capture.piece === 'Q') ||
      event.special === 'promotion' ||
      event.special === 'castle-kingside' ||
      event.special === 'castle-queenside' ||
      event.special === 'en-passant'
    ) {
      return 'TierB_Tactical';
    }
    return 'TierA_Micro';
  }

  getDuration(tier: AnimationTier, level: AnimationLevel): number {
    if (level === 'Off') return 0;

    if (level === 'Minimal') {
      if (tier === 'TierA_Micro') return 200;
      return 150; // B and C collapse to fast generic flash
    }

    if (level === 'Normal') {
      switch (tier) {
        case 'TierA_Micro': return 350;
        case 'TierB_Tactical': return 900;
        case 'TierC_Cinematic': return 2000;
      }
    }

    // Cinematic level (full intended durations per §9.2)
    switch (tier) {
      case 'TierA_Micro': return 500;
      case 'TierB_Tactical': return 1300;
      case 'TierC_Cinematic': return 3400;
    }
  }

  async playEvent(event: GameEvent, level: AnimationLevel): Promise<void> {
    if (level === 'Off') {
      this.playAudioForEvent(event, level);
      return;
    }

    const tier = this.classifyTier(event);
    const durationMs = this.getDuration(tier, level);
    if (durationMs <= 0) return;

    this.skipRequested = false;
    this.playAudioForEvent(event, level);

    const fromSq = (event.uci.slice(0, 2) || undefined) as Square | undefined;
    const toSq = (event.uci.slice(2, 4) || undefined) as Square | undefined;

    // Check ray and target king determination
    let kingSquare: Square | undefined = undefined;
    let checkRay: { from: Square; to: Square } | undefined = undefined;

    if (event.isCheck && toSq) {
      const oppColor = event.color === 'w' ? 'b' : 'w';
      kingSquare = findKingSquareFromFen(event.fenAfter, oppColor);
      checkRay = { from: toSq, to: kingSquare };
    } else if (event.isCheckmate) {
      const oppColor = event.color === 'w' ? 'b' : 'w';
      kingSquare = findKingSquareFromFen(event.fenAfter, oppColor);
    }

    // Determine surrounding attackers for checkmate army cinematic (§9.5)
    let surroundingAttackers: Square[] = [];
    if (event.isCheckmate && kingSquare) {
      surroundingAttackers = this.computeSurroundingSquares(kingSquare);
    }

    // Screen shake calculation
    let shakeIntensity = 0;
    if (event.isCheckmate) shakeIntensity = 3;
    else if (event.capture?.piece === 'Q' || event.piece === 'Q' || event.piece === 'R') shakeIntensity = 2;
    else if (event.capture || event.isCheck) shakeIntensity = 1;

    const animState: ActiveAnimationState = {
      tier,
      event,
      durationMs,
      progress: 0,
      isCheckSequence: event.isCheck && !event.isCheckmate,
      isCheckmateSequence: event.isCheckmate,
      isPromotionSequence: event.special === 'promotion',
      isCaptureSequence: event.capture !== null,
      attackerPiece: event.piece,
      capturedPiece: event.capture?.piece,
      sourceSquare: fromSq,
      targetSquare: toSq,
      surroundingAttackers,
      kingSquare,
      checkRay,
      shakeIntensity,
      canSkip: tier === 'TierC_Cinematic'
    };

    this.notify(animState);

    const startTime = Date.now();

    return new Promise<void>((resolve) => {
      const tick = () => {
        if (this.skipRequested) {
          this.notify(null);
          resolve();
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        if (this.currentAnimation) {
          this.currentAnimation.progress = progress;
          this.notify({ ...this.currentAnimation, progress });
        }

        if (progress >= 1) {
          this.notify(null);
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    });
  }

  private playAudioForEvent(event: GameEvent, level: AnimationLevel): void {
    if (event.isCheckmate) {
      this.sound.play(event.color === 'w' ? 'victory' : 'checkmate');
    } else if (event.isCheck) {
      this.sound.play('check');
    } else if (event.capture) {
      if (event.capture.piece === 'Q') {
        this.sound.play('captureQueen');
      } else {
        this.sound.play('capture');
      }
    } else if (event.special === 'castle-kingside' || event.special === 'castle-queenside') {
      this.sound.play('castle');
    } else if (event.special === 'promotion') {
      this.sound.play('promote');
    } else if (event.type === 'MOVE') {
      this.sound.play('move');
    }
  }

  private computeSurroundingSquares(target: Square): Square[] {
    const file = target.charCodeAt(0) - 97;
    const rank = parseInt(target[1], 10) - 1;
    const squares: Square[] = [];
    for (let df = -2; df <= 2; df++) {
      for (let dr = -2; dr <= 2; dr++) {
        if (df === 0 && dr === 0) continue;
        const f = file + df;
        const r = rank + dr;
        if (f >= 0 && f < 8 && r >= 0 && r < 8) {
          squares.push(`${String.fromCharCode(97 + f)}${r + 1}` as Square);
        }
      }
    }
    return squares.slice(0, 4); // top surrounding attacker squares
  }
}

export function findKingSquareFromFen(fen: string, color: 'w' | 'b'): Square {
  const parts = fen.split(' ')[0].split('/');
  const targetChar = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    const rankNum = 8 - r;
    let f = 0;
    for (const char of parts[r]) {
      if (char === targetChar) {
        return `${String.fromCharCode(97 + f)}${rankNum}` as Square;
      } else if (char >= '1' && char <= '8') {
        f += parseInt(char, 10);
      } else {
        f++;
      }
    }
  }
  return color === 'w' ? 'e1' : 'e8';
}

export const globalAnimationManager = new AnimationManager();
