import { describe, it, expect, vi } from 'vitest';
import { GameManager } from '../src/core-bridge/gameManager';
import { ChessGame } from '@cinematic-chess/chess-core';
import { StockfishService } from '../src/ai/stockfishService';

describe('GameManager - State and Event Orchestration', () => {
  it('Validates and accepts legal moves, emitting GameEvents conforming to §7.1', async () => {
    const manager = new GameManager({ mode: 'pv-p', animationLevel: 'Off' });
    const events: any[] = [];
    manager.onEvent((ev) => { events.push(ev); });

    const moveEvent = await manager.playMove('e2', 'e4');
    expect(moveEvent).not.toBeNull();
    expect(moveEvent?.san).toBe('e4');
    expect(moveEvent?.uci).toBe('e2e4');
    expect(moveEvent?.piece).toBe('P');
    expect(moveEvent?.color).toBe('w');
    expect(events.length).toBe(1);
    expect(manager.getTurn()).toBe('b');
  });

  it('Silently rejects illegal moves without state change or event emission', async () => {
    const manager = new GameManager({ mode: 'pv-p', animationLevel: 'Off' });
    const events: any[] = [];
    manager.onEvent((ev) => { events.push(ev); });

    // Illegal move: pawn e2 to e5 (cannot jump 3 squares)
    const illegalMove = await manager.playMove('e2', 'e5');
    expect(illegalMove).toBeNull();
    expect(events.length).toBe(0);
    expect(manager.getTurn()).toBe('w'); // Still White's turn
  });

  it('Is completely fault-tolerant against Presentation errors mid-animation', async () => {
    const manager = new GameManager({ mode: 'pv-p', animationLevel: 'Normal' });

    // Simulate broken presentation layer throwing a rendering error
    manager.setPresentationHandler(async () => {
      throw new Error('WebGL Context Lost / Texture render crash');
    });

    // Move must succeed, game state updated, no crash or hanging
    const event = await manager.playMove('e2', 'e4');
    expect(event).not.toBeNull();
    expect(manager.getTurn()).toBe('b');
    expect(manager.isBusy()).toBe(false);
  });

  it('Triggers AI response automatically on AI turn in PvAI mode', async () => {
    // Mock Stockfish service returning bestmove e7e5
    const mockAi = {
      setTier: vi.fn(),
      getTier: vi.fn().mockReturnValue('Medium'),
      getTierConfig: vi.fn(),
      init: vi.fn().mockResolvedValue(undefined),
      getBestMove: vi.fn().mockResolvedValue({ uci: 'e7e5' }),
      stop: vi.fn(),
      terminate: vi.fn()
    } as unknown as StockfishService;

    const manager = new GameManager(
      { mode: 'pv-ai', playerColor: 'w', animationLevel: 'Off' },
      mockAi
    );

    const receivedEvents: string[] = [];
    manager.onEvent((ev) => {
      if (ev.san) receivedEvents.push(ev.san);
    });

    // Human plays e4
    await manager.playMove('e2', 'e4');
    await manager.waitForAI();

    // AI should have been queried and played e5
    expect(mockAi.getBestMove).toHaveBeenCalled();
    expect(receivedEvents).toContain('e4');
    expect(receivedEvents).toContain('e5');
    expect(manager.getTurn()).toBe('w'); // Returned back to White
  });

  it('Handles resignation and draw agreement cleanly', async () => {
    const manager = new GameManager({ mode: 'pv-p', animationLevel: 'Off' });
    const resignEvent = await manager.resign('w');
    expect(resignEvent.type).toBe('RESIGN');
    expect(resignEvent.winner).toBe('b');
    expect(manager.getStatus().isGameOver).toBe(true);

    // Moves after game over are rejected
    const afterGameOver = await manager.playMove('e2', 'e4');
    expect(afterGameOver).toBeNull();
  });
});
