import {
  GameEvent,
  GameEventType,
  Color,
  PieceSymbol,
  MoveCapture,
  SpecialMoveType,
  DrawReason,
  Square
} from '@cinematic-chess/shared-types';
import { InternalMove, PIECE_EMPTY } from './types';
import { BoardState, indexToSquare, pieceToSymbol } from './boardState';
import { moveToSan, moveToUci } from './notation';
import { evaluateGameStatus } from './rules';
import { generateLegalMoves } from './moveGeneration';

export function createMoveGameEvent(
  stateBefore: BoardState,
  stateAfter: BoardState,
  move: InternalMove,
  positionHistory: string[]
): GameEvent {
  const san = moveToSan(stateBefore, move);
  const uci = moveToUci(move);
  const piece = pieceToSymbol(move.piece);
  const color = stateBefore.turn;

  let capture: MoveCapture | null = null;
  if (move.capturedPiece !== PIECE_EMPTY) {
    const capSq = move.capturedSquare !== undefined ? move.capturedSquare : move.to;
    capture = {
      piece: pieceToSymbol(move.capturedPiece),
      square: indexToSquare(capSq)
    };
  }

  const special: SpecialMoveType | null = move.special ?? null;
  let promotedTo: PieceSymbol | undefined = undefined;
  if (move.promotion) {
    promotedTo = pieceToSymbol(move.promotion);
  }

  const status = evaluateGameStatus(stateAfter, positionHistory);
  const resultingLegalMoves = generateLegalMoves(stateAfter).length;

  return Object.freeze({
    type: 'MOVE' as GameEventType,
    moveNumber: stateBefore.fullmoveNumber,
    san,
    uci,
    piece,
    color,
    capture,
    special,
    ...(promotedTo ? { promotedTo } : {}),
    isCheck: status.isCheck,
    isCheckmate: status.isCheckmate,
    isStalemate: status.isStalemate,
    isDraw: status.isDraw,
    ...(status.drawReason ? { drawReason: status.drawReason } : {}),
    ...(status.winner ? { winner: status.winner } : {}),
    fenBefore: stateBefore.toFen(),
    fenAfter: stateAfter.toFen(),
    resultingLegalMoves
  });
}

export function createLifecycleEvent(
  type: Exclude<GameEventType, 'MOVE'>,
  state: BoardState,
  extras?: Partial<GameEvent>
): GameEvent {
  const legalMoves = generateLegalMoves(state).length;
  const fen = state.toFen();

  return Object.freeze({
    type,
    moveNumber: state.fullmoveNumber,
    san: '',
    uci: '',
    piece: 'K',
    color: state.turn,
    capture: null,
    special: null,
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    fenBefore: fen,
    fenAfter: fen,
    resultingLegalMoves: legalMoves,
    ...extras
  });
}
