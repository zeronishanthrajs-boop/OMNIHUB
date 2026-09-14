import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChessGame } from '@cinematic-chess/chess-core';
import { PUZZLE_DATABASE } from '../src/puzzles/puzzleDatabase';
import { PuzzleManager } from '../src/puzzles/puzzleManager';
import { Square } from '@cinematic-chess/shared-types';

describe('Tactical Puzzles Database', () => {
  it('should contain all 8 curated tactical puzzles', () => {
    expect(PUZZLE_DATABASE.length).toBe(8);
  });

  it('every puzzle should load a valid FEN and legal move sequence', () => {
    for (const puzzle of PUZZLE_DATABASE) {
      const game = new ChessGame(puzzle.fen);
      expect(game.getState().board).toBeDefined();

      for (let i = 0; i < puzzle.moves.length; i++) {
        const uci = puzzle.moves[i];
        const event = game.playUci(uci);
        expect(event).not.toBeNull();
        expect(event?.uci).toBe(uci);
      }

      // If marked as mate-in-1, checkmate must be reached
      if (puzzle.theme === 'mate-in-1') {
        expect(game.getStatus().isCheckmate).toBe(true);
      }
    }
  });
});

describe('PuzzleManager State Machine', () => {
  let manager: PuzzleManager;

  beforeEach(() => {
    vi.useFakeTimers();
    try {
      localStorage.clear();
    } catch (e) {}
    manager = new PuzzleManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with the first puzzle and default state', () => {
    const state = manager.getState();
    expect(state.puzzleIndex).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.stepIndex).toBe(0);
    expect(state.hintSquare).toBeNull();
    expect(state.currentPuzzle.id).toBe('puz-01');
  });

  it('provides a hint pointing to the from-square of the solution move', () => {
    const hint = manager.requestHint();
    expect(hint).toBe('h5');
    expect(manager.getState().hintSquare).toBe('h5');
  });

  it('fails the puzzle on an incorrect move and resets streak', async () => {
    const success = await manager.playMove('e4' as Square, 'e5' as Square);
    expect(success).toBe(false);
    const state = manager.getState();
    expect(state.status).toBe('failed');
    expect(state.streak).toBe(0);
  });

  it('resets the puzzle when resetCurrentPuzzle is called', async () => {
    await manager.playMove('a2' as Square, 'a3' as Square);
    expect(manager.getState().status).toBe('failed');

    manager.resetCurrentPuzzle();
    const state = manager.getState();
    expect(state.status).toBe('playing');
    expect(state.stepIndex).toBe(0);
    expect(state.hintSquare).toBeNull();
  });

  it('successfully solves a mate-in-1 puzzle and updates rating/streak', async () => {
    const initialRating = manager.getState().userRating;
    const initialStreak = manager.getState().streak;

    const success = await manager.playMove('h5' as Square, 'f7' as Square);
    expect(success).toBe(true);

    const state = manager.getState();
    expect(state.status).toBe('solved');
    expect(state.streak).toBe(initialStreak + 1);
    expect(state.userRating).toBe(initialRating + 15);
    expect(state.lastEvent).not.toBeNull();
    expect(state.lastEvent?.isCheckmate).toBe(true);
  });

  it('handles multi-move puzzle with auto-reply (Royal Knight Fork)', async () => {
    for (let i = 0; i < 4; i++) {
      manager.nextPuzzle();
    }
    const state = manager.getState();
    expect(state.currentPuzzle.id).toBe('puz-05');
    expect(state.currentPuzzle.moves).toEqual(['d5c7', 'e8d8', 'c7a8']);

    const move1 = await manager.playMove('d5' as Square, 'c7' as Square);
    expect(move1).toBe(true);
    expect(manager.getState().status).toBe('opponent_thinking');

    await vi.advanceTimersByTimeAsync(500);

    expect(manager.getState().status).toBe('playing');
    expect(manager.getState().stepIndex).toBe(2);

    const move2 = await manager.playMove('c7' as Square, 'a8' as Square);
    expect(move2).toBe(true);
    expect(manager.getState().status).toBe('solved');
  });
});
