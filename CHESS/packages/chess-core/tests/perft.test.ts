import { describe, it, expect } from 'vitest';
import { BoardState } from '../src/boardState';
import { perft } from '../src/moveGeneration';

describe('Chess Core - Standard Perft Validation Suite', () => {
  it('Position 1 - Initial Position (Depth 1 to 4)', () => {
    const state = new BoardState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(perft(state, 1)).toBe(20);
    expect(perft(state, 2)).toBe(400);
    expect(perft(state, 3)).toBe(8902);
    expect(perft(state, 4)).toBe(197281);
  });

  it('Position 2 - Kiwipete (Depth 1 to 3)', () => {
    const state = new BoardState('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(perft(state, 1)).toBe(48);
    expect(perft(state, 2)).toBe(2039);
    expect(perft(state, 3)).toBe(97862);
  });

  it('Position 3 - Endgame with En Passant & Pins (Depth 1 to 4)', () => {
    const state = new BoardState('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
    expect(perft(state, 1)).toBe(14);
    expect(perft(state, 2)).toBe(191);
    expect(perft(state, 3)).toBe(2812);
    expect(perft(state, 4)).toBe(43238);
  });

  it('Position 4 - Promotions & Castling Edge Cases (Depth 1 to 3)', () => {
    const state = new BoardState('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
    expect(perft(state, 1)).toBe(6);
    expect(perft(state, 2)).toBe(264);
    expect(perft(state, 3)).toBe(9467);
  });

  it('Position 5 - Promotion and check complications (Depth 1 to 3)', () => {
    const state = new BoardState('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');
    expect(perft(state, 1)).toBe(44);
    expect(perft(state, 2)).toBe(1486);
    expect(perft(state, 3)).toBe(62379);
  });

  it('Position 6 - Symmetrical Tactical Position (Depth 1 to 3)', () => {
    const state = new BoardState('r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10');
    expect(perft(state, 1)).toBe(46);
    expect(perft(state, 2)).toBe(2079);
    expect(perft(state, 3)).toBe(89890);
  });
});
