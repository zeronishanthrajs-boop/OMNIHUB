import {
  Square,
  InternalMove,
  PIECE_PAWN,
  PIECE_KNIGHT,
  PIECE_BISHOP,
  PIECE_ROOK,
  PIECE_QUEEN,
  PIECE_KING,
  PIECE_EMPTY
} from './types';
import { BoardState, indexToSquare, squareToIndex, FILES, pieceToSymbol } from './boardState';
import { generateLegalMoves, makeMove, unmakeMove, isKingInCheck } from './moveGeneration';

export function moveToUci(move: InternalMove): string {
  const fromStr = indexToSquare(move.from);
  const toStr = indexToSquare(move.to);
  let promoStr = '';
  if (move.promotion) {
    switch (move.promotion) {
      case PIECE_QUEEN: promoStr = 'q'; break;
      case PIECE_ROOK: promoStr = 'r'; break;
      case PIECE_BISHOP: promoStr = 'b'; break;
      case PIECE_KNIGHT: promoStr = 'n'; break;
    }
  }
  return `${fromStr}${toStr}${promoStr}`;
}

export function uciToMove(state: BoardState, uci: string): InternalMove | null {
  const legalMoves = generateLegalMoves(state);
  const cleanUci = uci.trim().toLowerCase();
  for (const move of legalMoves) {
    if (moveToUci(move) === cleanUci) {
      return move;
    }
  }
  return null;
}

export function moveToSan(state: BoardState, move: InternalMove): string {
  // Castling
  if (move.special === 'castle-kingside') {
    return checkSuffix(state, move, 'O-O');
  }
  if (move.special === 'castle-queenside') {
    return checkSuffix(state, move, 'O-O-O');
  }

  const pieceType = move.piece & 7;
  const isCapture = move.capturedPiece !== PIECE_EMPTY;
  const destSquare = indexToSquare(move.to);
  const fromSquare = indexToSquare(move.from);

  let san = '';

  if (pieceType === PIECE_PAWN) {
    if (isCapture) {
      san += `${fromSquare[0]}x${destSquare}`;
    } else {
      san += destSquare;
    }
    if (move.promotion) {
      san += `=${pieceToSymbol(move.promotion)}`;
    }
  } else {
    san += pieceToSymbol(move.piece);

    // Disambiguation: check other legal moves for same piece type to same target
    const legalMoves = generateLegalMoves(state);
    const candidates = legalMoves.filter(
      (m) =>
        m.from !== move.from &&
        m.to === move.to &&
        (m.piece & 7) === pieceType
    );

    if (candidates.length > 0) {
      const sameFile = candidates.some((m) => (m.from & 7) === (move.from & 7));
      const sameRank = candidates.some((m) => (m.from >> 3) === (move.from >> 3));

      if (!sameFile) {
        san += fromSquare[0]; // file letter
      } else if (!sameRank) {
        san += fromSquare[1]; // rank number
      } else {
        san += fromSquare; // both file and rank
      }
    }

    if (isCapture) {
      san += 'x';
    }
    san += destSquare;
  }

  return checkSuffix(state, move, san);
}

function checkSuffix(state: BoardState, move: InternalMove, baseSan: string): string {
  const undo = makeMove(state, move);
  const oppColor = state.turn;
  const inCheck = isKingInCheck(state, oppColor);
  let isMate = false;
  if (inCheck) {
    const oppMoves = generateLegalMoves(state);
    if (oppMoves.length === 0) {
      isMate = true;
    }
  }
  unmakeMove(state, move, undo);

  if (isMate) return `${baseSan}#`;
  if (inCheck) return `${baseSan}+`;
  return baseSan;
}
