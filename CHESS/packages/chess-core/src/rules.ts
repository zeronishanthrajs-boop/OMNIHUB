import {
  Color,
  DrawReason,
  PIECE_EMPTY,
  PIECE_PAWN,
  PIECE_KNIGHT,
  PIECE_BISHOP,
  PIECE_ROOK,
  PIECE_QUEEN,
  PIECE_KING,
  COLOR_WHITE,
  COLOR_BLACK
} from './types';
import { BoardState } from './boardState';
import { generateLegalMoves, isKingInCheck } from './moveGeneration';

export interface GameStatus {
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  drawReason?: DrawReason;
  winner?: Color | 'draw';
}

export function isInsufficientMaterial(state: BoardState): boolean {
  const board = state.board;
  let whiteKnights = 0;
  let blackKnights = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  let whiteBishopColor: 'light' | 'dark' | null = null;
  let blackBishopColor: 'light' | 'dark' | null = null;

  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (p === PIECE_EMPTY) continue;
    const type = p & 7;
    const isBlack = (p & COLOR_BLACK) !== 0;

    // Pawns, rooks, queens immediately have sufficient mating material
    if (type === PIECE_PAWN || type === PIECE_ROOK || type === PIECE_QUEEN) {
      return false;
    }

    const file = sq & 7;
    const rank = sq >> 3;
    const isSquareLight = (file + rank) % 2 !== 0;

    if (type === PIECE_KNIGHT) {
      if (isBlack) blackKnights++;
      else whiteKnights++;
    } else if (type === PIECE_BISHOP) {
      if (isBlack) {
        blackBishops++;
        blackBishopColor = isSquareLight ? 'light' : 'dark';
      } else {
        whiteBishops++;
        whiteBishopColor = isSquareLight ? 'light' : 'dark';
      }
    }
  }

  const whiteMinors = whiteKnights + whiteBishops;
  const blackMinors = blackKnights + blackBishops;

  // King vs King
  if (whiteMinors === 0 && blackMinors === 0) {
    return true;
  }

  // King + single minor vs King
  if ((whiteMinors === 1 && blackMinors === 0) || (whiteMinors === 0 && blackMinors === 1)) {
    return true;
  }

  // King + Bishop vs King + Bishop on the same color square
  if (
    whiteBishops === 1 &&
    whiteKnights === 0 &&
    blackBishops === 1 &&
    blackKnights === 0 &&
    whiteBishopColor === blackBishopColor
  ) {
    return true;
  }

  return false;
}

export function evaluateGameStatus(
  state: BoardState,
  positionHistory: string[]
): GameStatus {
  const inCheck = isKingInCheck(state, state.turn);
  const legalMoves = generateLegalMoves(state);

  if (legalMoves.length === 0) {
    if (inCheck) {
      const winner: Color = state.turn === 'w' ? 'b' : 'w';
      return {
        isGameOver: true,
        isCheck: true,
        isCheckmate: true,
        isStalemate: false,
        isDraw: false,
        winner
      };
    } else {
      return {
        isGameOver: true,
        isCheck: false,
        isCheckmate: false,
        isStalemate: true,
        isDraw: true,
        drawReason: 'stalemate',
        winner: 'draw'
      };
    }
  }

  // 50-move rule (100 halfmoves)
  if (state.halfmoveClock >= 100) {
    return {
      isGameOver: true,
      isCheck: inCheck,
      isCheckmate: false,
      isStalemate: false,
      isDraw: true,
      drawReason: 'fifty-move-rule',
      winner: 'draw'
    };
  }

  // Threefold repetition
  const currentKey = state.getPositionKey();
  let repetitions = 0;
  for (let i = 0; i < positionHistory.length; i++) {
    if (positionHistory[i] === currentKey) {
      repetitions++;
    }
  }
  if (repetitions >= 3) {
    return {
      isGameOver: true,
      isCheck: inCheck,
      isCheckmate: false,
      isStalemate: false,
      isDraw: true,
      drawReason: 'threefold-repetition',
      winner: 'draw'
    };
  }

  // Insufficient material
  if (isInsufficientMaterial(state)) {
    return {
      isGameOver: true,
      isCheck: inCheck,
      isCheckmate: false,
      isStalemate: false,
      isDraw: true,
      drawReason: 'insufficient-material',
      winner: 'draw'
    };
  }

  return {
    isGameOver: false,
    isCheck: inCheck,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false
  };
}
