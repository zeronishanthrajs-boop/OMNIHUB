import { describe, it, expect } from 'vitest';
import { ChessGame } from '../src/chessGame';
import { BoardState } from '../src/boardState';

describe('Chess Core - Rules and GameEvent Verification', () => {
  it("Scholar's Mate produces valid Checkmate GameEvent per §7.1", () => {
    const game = new ChessGame();
    // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
    game.playMove('e2', 'e4');
    game.playMove('e7', 'e5');
    game.playMove('d1', 'h5');
    game.playMove('b8', 'c6');
    game.playMove('f1', 'c4');
    game.playMove('g8', 'f6');
    const mateEvent = game.playMove('h5', 'f7');

    expect(mateEvent).not.toBeNull();
    expect(mateEvent?.type).toBe('MOVE');
    expect(mateEvent?.san).toBe('Qxf7#');
    expect(mateEvent?.uci).toBe('h5f7');
    expect(mateEvent?.piece).toBe('Q');
    expect(mateEvent?.color).toBe('w');
    expect(mateEvent?.capture).toEqual({ piece: 'P', square: 'f7' });
    expect(mateEvent?.isCheck).toBe(true);
    expect(mateEvent?.isCheckmate).toBe(true);
    expect(mateEvent?.isStalemate).toBe(false);
    expect(mateEvent?.isDraw).toBe(false);
    expect(mateEvent?.resultingLegalMoves).toBe(0);
    expect(mateEvent?.winner).toBe('w');
  });

  it('Castling emits correct special field and rook updates', () => {
    const game = new ChessGame();
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O
    game.playMove('e2', 'e4');
    game.playMove('e7', 'e5');
    game.playMove('g1', 'f3');
    game.playMove('b8', 'c6');
    game.playMove('f1', 'c4');
    game.playMove('f8', 'c5');
    const castleEvent = game.playMove('e1', 'g1');

    expect(castleEvent).not.toBeNull();
    expect(castleEvent?.san).toBe('O-O');
    expect(castleEvent?.special).toBe('castle-kingside');
    expect(game.getState().getPieceAtSquare('f1')?.type).toBe('R');
    expect(game.getState().getPieceAtSquare('g1')?.type).toBe('K');
    expect(game.getState().getPieceAtSquare('h1')).toBeNull();
  });

  it('En Passant emits correct special field and captures victim pawn', () => {
    const game = new ChessGame();
    // 1. e4 a6 2. e5 d5 3. exd6 (en passant)
    game.playMove('e2', 'e4');
    game.playMove('a7', 'a6');
    game.playMove('e4', 'e5');
    game.playMove('d7', 'd5');
    const epEvent = game.playMove('e5', 'd6');

    expect(epEvent).not.toBeNull();
    expect(epEvent?.special).toBe('en-passant');
    expect(epEvent?.capture?.piece).toBe('P');
    expect(epEvent?.capture?.square).toBe('d5');
    expect(game.getState().getPieceAtSquare('d5')).toBeNull();
    expect(game.getState().getPieceAtSquare('d6')?.type).toBe('P');
  });

  it('Promotion emits correct special field and promotedTo', () => {
    // White pawn on a7, black king on h8
    const game = new ChessGame('7k/P7/8/8/8/8/8/K7 w - - 0 1');
    const promoEvent = game.playMove('a7', 'a8', 'Q');

    expect(promoEvent).not.toBeNull();
    expect(promoEvent?.special).toBe('promotion');
    expect(promoEvent?.promotedTo).toBe('Q');
    expect(promoEvent?.san).toBe('a8=Q+');
    expect(game.getState().getPieceAtSquare('a8')?.type).toBe('Q');
  });

  it('Stalemate detection works correctly', () => {
    // 7k/5Q2/6K1/8/8/8/8/8 b - - 0 1 (Black king trapped with no legal moves, not in check)
    const game = new ChessGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    const status = game.getStatus();
    expect(status.isStalemate).toBe(true);
    expect(status.isDraw).toBe(true);
    expect(status.drawReason).toBe('stalemate');
  });

  it('Threefold repetition detection works correctly', () => {
    const game = new ChessGame();
    // Knights shuffle back and forth 3 times
    game.playMove('g1', 'f3'); game.playMove('g8', 'f6');
    game.playMove('f3', 'g1'); game.playMove('f6', 'g8'); // Repetition 1
    game.playMove('g1', 'f3'); game.playMove('g8', 'f6');
    game.playMove('f3', 'g1'); game.playMove('f6', 'g8'); // Repetition 2
    const status = game.getStatus();
    expect(status.isDraw).toBe(true);
    expect(status.drawReason).toBe('threefold-repetition');
  });

  it('Undo and Redo restore exact board state and history', () => {
    const game = new ChessGame();
    game.playMove('e2', 'e4');
    game.playMove('e7', 'e5');
    expect(game.getHistory().length).toBe(2);

    const undoEvent = game.undo();
    expect(undoEvent?.type).toBe('UNDO');
    expect(game.getTurn()).toBe('b');
    expect(game.getState().getPieceAtSquare('e5')).toBeNull();

    const redoEvent = game.redo();
    expect(redoEvent?.uci).toBe('e7e5');
    expect(game.getTurn()).toBe('w');
    expect(game.getState().getPieceAtSquare('e5')?.type).toBe('P');
  });
});
