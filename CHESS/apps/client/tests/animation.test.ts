import { describe, it, expect } from 'vitest';
import { AnimationManager, findKingSquareFromFen } from '../src/animation/animationManager';
import { ParticleEngine } from '../src/animation/particleEngine';
import { GameEvent } from '@cinematic-chess/shared-types';

describe('Presentation & Animation System (§9)', () => {
  const manager = new AnimationManager();

  it('Correctly classifies moves into Micro, Tactical, and Cinematic tiers', () => {
    // 1. Ordinary move -> Tier A (Micro)
    const normalMoveEvent: GameEvent = {
      type: 'MOVE',
      moveNumber: 1,
      san: 'e4',
      uci: 'e2e4',
      piece: 'P',
      color: 'w',
      capture: null,
      special: null,
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      fenBefore: '',
      fenAfter: '',
      resultingLegalMoves: 20
    };
    expect(manager.classifyTier(normalMoveEvent)).toBe('TierA_Micro');

    // 2. Check event -> Tier B (Tactical)
    const checkEvent: GameEvent = {
      ...normalMoveEvent,
      san: 'Qh5+',
      isCheck: true
    };
    expect(manager.classifyTier(checkEvent)).toBe('TierB_Tactical');

    // 3. Queen Capture -> Tier B (Tactical)
    const queenCaptureEvent: GameEvent = {
      ...normalMoveEvent,
      san: 'Nxf7',
      capture: { piece: 'Q', square: 'f7' }
    };
    expect(manager.classifyTier(queenCaptureEvent)).toBe('TierB_Tactical');

    // 4. Castling -> Tier B (Tactical)
    const castleEvent: GameEvent = {
      ...normalMoveEvent,
      san: 'O-O',
      special: 'castle-kingside'
    };
    expect(manager.classifyTier(castleEvent)).toBe('TierB_Tactical');

    // 5. Promotion -> Tier B (Tactical)
    const promoEvent: GameEvent = {
      ...normalMoveEvent,
      san: 'e8=Q',
      special: 'promotion',
      promotedTo: 'Q'
    };
    expect(manager.classifyTier(promoEvent)).toBe('TierB_Tactical');

    // 6. Checkmate -> Tier C (Cinematic)
    const checkmateEvent: GameEvent = {
      ...normalMoveEvent,
      san: 'Qxf7#',
      isCheck: true,
      isCheckmate: true
    };
    expect(manager.classifyTier(checkmateEvent)).toBe('TierC_Cinematic');
  });

  it('Scales durations strictly per Animation Level (Off / Minimal / Normal / Cinematic)', () => {
    // Off: 0ms for all tiers
    expect(manager.getDuration('TierA_Micro', 'Off')).toBe(0);
    expect(manager.getDuration('TierB_Tactical', 'Off')).toBe(0);
    expect(manager.getDuration('TierC_Cinematic', 'Off')).toBe(0);

    // Minimal: Tier A is fast (~200ms), Tier B and C collapse to 150ms
    expect(manager.getDuration('TierA_Micro', 'Minimal')).toBe(200);
    expect(manager.getDuration('TierB_Tactical', 'Minimal')).toBe(150);
    expect(manager.getDuration('TierC_Cinematic', 'Minimal')).toBe(150);

    // Normal: Balanced play
    expect(manager.getDuration('TierA_Micro', 'Normal')).toBe(350);
    expect(manager.getDuration('TierB_Tactical', 'Normal')).toBe(900);
    expect(manager.getDuration('TierC_Cinematic', 'Normal')).toBe(2000);

    // Cinematic: Full battle choreography
    expect(manager.getDuration('TierA_Micro', 'Cinematic')).toBe(500);
    expect(manager.getDuration('TierB_Tactical', 'Cinematic')).toBe(1300);
    expect(manager.getDuration('TierC_Cinematic', 'Cinematic')).toBe(3400);
  });

  it('Accurately locates target King square from FEN for Check laser rays', () => {
    // Starting position
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(findKingSquareFromFen(startFen, 'w')).toBe('e1');
    expect(findKingSquareFromFen(startFen, 'b')).toBe('e8');

    // After Scholar's mate
    const mateFen = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';
    expect(findKingSquareFromFen(mateFen, 'b')).toBe('e8');
  });

  it('Spawns battle particles correctly across piece types', () => {
    const engine = new ParticleEngine();
    expect(engine.getParticleCount()).toBe(0);

    // Spawn Queen Supernova
    engine.spawnCaptureBurst(100, 100, 'Q');
    expect(engine.getParticleCount()).toBeGreaterThan(50);

    // Clear particles
    engine.clear();
    expect(engine.getParticleCount()).toBe(0);

    // Spawn Knight dust & shockwave
    engine.spawnCaptureBurst(100, 100, 'N');
    expect(engine.getParticleCount()).toBeGreaterThan(20);
  });
});
