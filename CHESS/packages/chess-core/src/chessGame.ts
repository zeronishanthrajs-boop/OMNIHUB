import {
  Square,
  Color,
  PieceSymbol,
  GameEvent
} from '@cinematic-chess/shared-types';
import { BoardState, indexToSquare, squareToIndex, START_FEN, symbolToType } from './boardState';
import { InternalMove } from './types';
import { generateLegalMoves, isKingInCheck, makeMove, unmakeMove, isSquareAttacked, UndoState } from './moveGeneration';
import { moveToSan, moveToUci, uciToMove } from './notation';
import { evaluateGameStatus, GameStatus } from './rules';
import { createLifecycleEvent, createMoveGameEvent } from './gameEvents';

export interface HistoryRecord {
  stateBefore: BoardState;
  stateAfter: BoardState;
  move: InternalMove;
  undo: UndoState;
  event: GameEvent;
  positionKey: string;
}

export interface GameTermination {
  isTerminated: boolean;
  winner?: Color | 'draw';
  reason?: string;
}

export class ChessGame {
  private state: BoardState;
  private history: HistoryRecord[] = [];
  private redoStack: HistoryRecord[] = [];
  private positionHistory: string[] = [];
  private termination: GameTermination = { isTerminated: false };

  constructor(fen: string = START_FEN) {
    this.state = new BoardState(fen);
    this.positionHistory.push(this.state.getPositionKey());
  }

  getState(): BoardState {
    return this.state;
  }

  getFen(): string {
    return this.state.toFen();
  }

  getTurn(): Color {
    return this.state.turn;
  }

  getKingSquare(color: Color): Square {
    const sq = color === 'w' ? this.state.kingSquareW : this.state.kingSquareB;
    return indexToSquare(sq);
  }

  getStatus(): GameStatus {
    if (this.termination.isTerminated) {
      return {
        isGameOver: true,
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: this.termination.winner === 'draw',
        drawReason: this.termination.winner === 'draw' ? 'agreement' : undefined,
        winner: this.termination.winner
      };
    }
    return evaluateGameStatus(this.state, this.positionHistory);
  }

  getLegalMovesForSquare(square: Square): Square[] {
    const idx = squareToIndex(square);
    const legalMoves = generateLegalMoves(this.state);
    return legalMoves.filter((m) => m.from === idx).map((m) => indexToSquare(m.to));
  }

  getAllLegalMoves(): InternalMove[] {
    return generateLegalMoves(this.state);
  }

  getAllLegalUciMoves(): string[] {
    return generateLegalMoves(this.state).map((m) => moveToUci(m));
  }

  isLegalMove(from: Square, to: Square, promotion?: PieceSymbol): boolean {
    const fromIdx = squareToIndex(from);
    const toIdx = squareToIndex(to);
    const promoType = promotion ? symbolToType(promotion) : undefined;
    const legalMoves = generateLegalMoves(this.state);

    return legalMoves.some(
      (m) =>
        m.from === fromIdx &&
        m.to === toIdx &&
        (!promoType || m.promotion === promoType)
    );
  }

  playMove(
    from: Square,
    to: Square,
    promotion?: PieceSymbol
  ): GameEvent | null {
    const fromIdx = squareToIndex(from);
    const toIdx = squareToIndex(to);
    const promoType = promotion ? symbolToType(promotion) : undefined;

    const legalMoves = generateLegalMoves(this.state);
    const matchedMove = legalMoves.find((m) => {
      if (m.from !== fromIdx || m.to !== toIdx) return false;
      if (promoType) return m.promotion === promoType;
      // Default to Queen promotion if move is a promotion but none was explicitly chosen
      if (m.promotion && m.promotion !== 5) return false;
      return true;
    });

    if (!matchedMove) {
      return null;
    }

    return this.applyInternalMove(matchedMove);
  }

  playUci(uci: string): GameEvent | null {
    const move = uciToMove(this.state, uci);
    if (!move) return null;
    return this.applyInternalMove(move);
  }

  private applyInternalMove(move: InternalMove): GameEvent {
    const stateBefore = this.state.clone();
    const undo = makeMove(this.state, move);
    const stateAfter = this.state.clone();

    const currentKey = this.state.getPositionKey();
    this.positionHistory.push(currentKey);

    const event = createMoveGameEvent(stateBefore, stateAfter, move, this.positionHistory);

    this.history.push({
      stateBefore,
      stateAfter,
      move,
      undo,
      event,
      positionKey: currentKey
    });

    // Clear redo on new move
    this.redoStack = [];

    return event;
  }

  undo(): GameEvent | null {
    if (this.history.length === 0) return null;
    const lastRecord = this.history.pop()!;
    this.positionHistory.pop();
    this.redoStack.push(lastRecord);

    this.state = lastRecord.stateBefore.clone();

    return createLifecycleEvent('UNDO', this.state, {
      san: `undo ${lastRecord.event.san}`
    });
  }

  redo(): GameEvent | null {
    if (this.redoStack.length === 0) return null;
    const nextRecord = this.redoStack.pop()!;
    return this.applyInternalMove(nextRecord.move);
  }

  reset(fen: string = START_FEN): GameEvent {
    this.state = new BoardState(fen);
    this.history = [];
    this.redoStack = [];
    this.positionHistory = [this.state.getPositionKey()];
    this.termination = { isTerminated: false };
    return createLifecycleEvent('RESTART', this.state);
  }

  resign(color: Color): GameEvent {
    const winner: Color = color === 'w' ? 'b' : 'w';
    this.termination = { isTerminated: true, winner, reason: 'resignation' };
    return createLifecycleEvent('RESIGN', this.state, {
      isDraw: false,
      winner
    });
  }

  offerDraw(color: Color): GameEvent {
    return createLifecycleEvent('DRAW_OFFER', this.state, {
      color
    });
  }

  acceptDraw(): GameEvent {
    this.termination = { isTerminated: true, winner: 'draw', reason: 'agreement' };
    return createLifecycleEvent('DRAW_ACCEPT', this.state, {
      isDraw: true,
      drawReason: 'agreement',
      winner: 'draw'
    });
  }

  getHistory(): GameEvent[] {
    return this.history.map((h) => h.event);
  }

  exportPgn(): string {
    let pgn = '';
    for (let i = 0; i < this.history.length; i++) {
      const item = this.history[i];
      if (i % 2 === 0) {
        pgn += `${Math.floor(i / 2) + 1}. `;
      }
      pgn += `${item.event.san} `;
    }

    const status = this.getStatus();
    if (status.isCheckmate) {
      pgn += status.winner === 'w' ? '1-0' : '0-1';
    } else if (status.isDraw) {
      pgn += '1/2-1/2';
    } else {
      pgn += '*';
    }

    return pgn.trim();
  }
}
