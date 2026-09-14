import { describe, it, expect, afterAll } from 'vitest';
import { StockfishService, WorkerLike } from '../src/ai/stockfishService';
import { AI_TIER_CONFIGS } from '../src/ai/aiConfig';
import { AIDifficultyTier } from '@cinematic-chess/shared-types';

declare const require: any;
declare const __dirname: string;

function createNodeStockfishWorker(): WorkerLike {
  let onmessageHandler: ((e: { data: string }) => void) | null = null;
  const listeners: ((e: { data: string }) => void)[] = [];

  // Wire global postMessage for stockfish.js in node test environment
  (globalThis as any).postMessage = (data: string) => {
    const ev = { data };
    if (onmessageHandler) onmessageHandler(ev);
    for (const l of listeners) l(ev);
  };

  // Require pure self-contained stockfish.js
  try {
    const path = require('path');
    const sfPath = path.resolve(__dirname, '../../../node_modules/stockfish.js/stockfish.js');
    require(sfPath);
  } catch (e) {
    console.error('Failed to load stockfish.js in test:', e);
  }

  const sfOnMessage = (globalThis as any).onmessage;

  return {
    postMessage(msg: any) {
      if (sfOnMessage) {
        sfOnMessage({ data: String(msg) });
      }
    },
    set onmessage(fn: any) {
      onmessageHandler = fn;
    },
    addEventListener(type: string, fn: any) {
      listeners.push(fn);
    },
    removeEventListener(type: string, fn: any) {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    },
    terminate() {
      // noop
    }
  };
}

describe('Stockfish UCI AI Service Integration', () => {
  const sf = new StockfishService(createNodeStockfishWorker);

  it('Initializes Stockfish via UCI and establishes handshake', async () => {
    await sf.init();
    expect(sf.getTier()).toBe('Medium');
  });

  it('Maps all 7 difficulty tiers strictly per PRD §8.2', () => {
    const tiers: AIDifficultyTier[] = [
      'Beginner',
      'Easy',
      'Medium',
      'Hard',
      'Expert',
      'Master',
      'Ultimate'
    ];

    expect(tiers.length).toBe(7);

    for (const tier of tiers) {
      const cfg = sf.getTierConfig(tier);
      expect(cfg.tier).toBe(tier);
      expect(cfg.depth).toBeGreaterThanOrEqual(1);
      expect(cfg.movetimeMs).toBeGreaterThanOrEqual(100);
      expect(cfg.uciElo).toBeGreaterThanOrEqual(1320);
      expect(cfg.skillLevel).toBeGreaterThanOrEqual(0);
      expect(cfg.skillLevel).toBeLessThanOrEqual(20);
    }

    // Verify Beginner settings
    expect(AI_TIER_CONFIGS.Beginner.depth).toBe(1);
    expect(AI_TIER_CONFIGS.Beginner.movetimeMs).toBe(100);
    expect(AI_TIER_CONFIGS.Beginner.skillLevel).toBe(0);

    // Verify Ultimate settings
    expect(AI_TIER_CONFIGS.Ultimate.limitStrength).toBe(false);
    expect(AI_TIER_CONFIGS.Ultimate.skillLevel).toBe(20);
    expect(AI_TIER_CONFIGS.Ultimate.depth).toBe(14);
    expect(AI_TIER_CONFIGS.Ultimate.movetimeMs).toBe(4000);
  });

  it('Computes valid bestmove from starting position at Beginner tier', async () => {
    sf.setTier('Beginner');
    const result = await sf.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.uci).toBeTruthy();
    expect(result.uci.length).toBeGreaterThanOrEqual(4);
  });

  it('Solves mate-in-one puzzle accurately', async () => {
    // White Queen on h5, Bishop on c4, Black f7 square attacked (Scholar's mate: Qxf7#)
    const mateInOneFen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    const result = await sf.getBestMove(mateInOneFen, 'Medium');
    expect(result.uci).toBe('h5f7');
  });

  afterAll(() => {
    sf.terminate();
  });
});
