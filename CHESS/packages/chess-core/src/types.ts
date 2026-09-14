import type {
  Square,
  Color,
  PieceSymbol,
  SpecialMoveType,
  MoveCapture,
  GameEvent,
  GameEventType,
  DrawReason
} from '@cinematic-chess/shared-types';

export {
  Square,
  Color,
  PieceSymbol,
  SpecialMoveType,
  MoveCapture,
  GameEvent,
  GameEventType,
  DrawReason
};

// Internal piece numeric representation
// Piece: bits 0..2 = type (1..6), bit 3 = color (0 = White, 8 = Black)
export const PIECE_EMPTY = 0;
export const PIECE_PAWN = 1;
export const PIECE_KNIGHT = 2;
export const PIECE_BISHOP = 3;
export const PIECE_ROOK = 4;
export const PIECE_QUEEN = 5;
export const PIECE_KING = 6;

export const COLOR_WHITE = 0;
export const COLOR_BLACK = 8;

export const CASTLE_WK = 1; // 0b0001
export const CASTLE_WQ = 2; // 0b0010
export const CASTLE_BK = 4; // 0b0100
export const CASTLE_BQ = 8; // 0b1000

export interface InternalMove {
  from: number; // 0..63
  to: number; // 0..63
  piece: number; // internal piece
  capturedPiece: number; // internal piece, 0 if none
  capturedSquare?: number; // for en passant: square of captured pawn
  promotion?: number; // internal piece type (2,3,4,5)
  special?: SpecialMoveType;
  san?: string;
}

export interface BoardStateSnapshot {
  board: Uint8Array; // 64 entries
  turn: Color;
  castlingRights: number; // 0..15 bitmask
  epSquare: number; // 0..63 or -1
  halfmoveClock: number;
  fullmoveNumber: number;
  kingSquareW: number;
  kingSquareB: number;
}
