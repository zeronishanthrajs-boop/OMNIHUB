import {
  Square,
  Color,
  PieceSymbol,
  PIECE_EMPTY,
  PIECE_PAWN,
  PIECE_KNIGHT,
  PIECE_BISHOP,
  PIECE_ROOK,
  PIECE_QUEEN,
  PIECE_KING,
  COLOR_WHITE,
  COLOR_BLACK,
  CASTLE_WK,
  CASTLE_WQ,
  CASTLE_BK,
  CASTLE_BQ,
  BoardStateSnapshot
} from './types';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function squareToIndex(square: Square): number {
  const file = square.charCodeAt(0) - 97; // 'a' = 97
  const rank = square.charCodeAt(1) - 49; // '1' = 49
  return rank * 8 + file;
}

export function indexToSquare(idx: number): Square {
  const file = idx & 7;
  const rank = idx >> 3;
  return `${FILES[file]}${rank + 1}` as Square;
}

export function charToPiece(char: string): number {
  const isUpper = char >= 'A' && char <= 'Z';
  const color = isUpper ? COLOR_WHITE : COLOR_BLACK;
  const upper = char.toUpperCase();
  let type = PIECE_EMPTY;
  switch (upper) {
    case 'P': type = PIECE_PAWN; break;
    case 'N': type = PIECE_KNIGHT; break;
    case 'B': type = PIECE_BISHOP; break;
    case 'R': type = PIECE_ROOK; break;
    case 'Q': type = PIECE_QUEEN; break;
    case 'K': type = PIECE_KING; break;
    default: return PIECE_EMPTY;
  }
  return type | color;
}

export function pieceToChar(piece: number): string {
  if (piece === PIECE_EMPTY) return '';
  const type = piece & 7;
  const isBlack = (piece & COLOR_BLACK) !== 0;
  let char = '';
  switch (type) {
    case PIECE_PAWN: char = 'p'; break;
    case PIECE_KNIGHT: char = 'n'; break;
    case PIECE_BISHOP: char = 'b'; break;
    case PIECE_ROOK: char = 'r'; break;
    case PIECE_QUEEN: char = 'q'; break;
    case PIECE_KING: char = 'k'; break;
    default: return '';
  }
  return isBlack ? char : char.toUpperCase();
}

export function pieceToSymbol(piece: number): PieceSymbol {
  const type = piece & 7;
  switch (type) {
    case PIECE_PAWN: return 'P';
    case PIECE_KNIGHT: return 'N';
    case PIECE_BISHOP: return 'B';
    case PIECE_ROOK: return 'R';
    case PIECE_QUEEN: return 'Q';
    case PIECE_KING: return 'K';
    default: return 'P';
  }
}

export function symbolToType(symbol: PieceSymbol): number {
  switch (symbol) {
    case 'P': return PIECE_PAWN;
    case 'N': return PIECE_KNIGHT;
    case 'B': return PIECE_BISHOP;
    case 'R': return PIECE_ROOK;
    case 'Q': return PIECE_QUEEN;
    case 'K': return PIECE_KING;
  }
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class BoardState {
  board: Uint8Array = new Uint8Array(64);
  turn: Color = 'w';
  castlingRights: number = 15; // 0b1111
  epSquare: number = -1;
  halfmoveClock: number = 0;
  fullmoveNumber: number = 1;
  kingSquareW: number = 4; // e1
  kingSquareB: number = 60; // e8

  constructor(fen: string = START_FEN) {
    this.loadFen(fen);
  }

  loadFen(fen: string): void {
    this.board.fill(PIECE_EMPTY);
    const parts = fen.trim().split(/\s+/);
    const piecePlacement = parts[0];
    const activeColor = parts[1] || 'w';
    const castling = parts[2] || '-';
    const ep = parts[3] || '-';
    const halfmove = parts[4] || '0';
    const fullmove = parts[5] || '1';

    let rank = 7;
    let file = 0;
    for (const char of piecePlacement) {
      if (char === '/') {
        rank--;
        file = 0;
      } else if (char >= '1' && char <= '8') {
        file += parseInt(char, 10);
      } else {
        const sq = rank * 8 + file;
        const piece = charToPiece(char);
        this.board[sq] = piece;
        if (piece === (PIECE_KING | COLOR_WHITE)) {
          this.kingSquareW = sq;
        } else if (piece === (PIECE_KING | COLOR_BLACK)) {
          this.kingSquareB = sq;
        }
        file++;
      }
    }

    this.turn = activeColor === 'b' ? 'b' : 'w';

    this.castlingRights = 0;
    if (castling.includes('K')) this.castlingRights |= CASTLE_WK;
    if (castling.includes('Q')) this.castlingRights |= CASTLE_WQ;
    if (castling.includes('k')) this.castlingRights |= CASTLE_BK;
    if (castling.includes('q')) this.castlingRights |= CASTLE_BQ;

    this.epSquare = ep !== '-' ? squareToIndex(ep as Square) : -1;
    this.halfmoveClock = parseInt(halfmove, 10) || 0;
    this.fullmoveNumber = parseInt(fullmove, 10) || 1;
  }

  toFen(): string {
    let fen = '';
    for (let r = 7; r >= 0; r--) {
      let emptyCount = 0;
      for (let f = 0; f < 8; f++) {
        const sq = r * 8 + f;
        const piece = this.board[sq];
        if (piece === PIECE_EMPTY) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }
          fen += pieceToChar(piece);
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount.toString();
      }
      if (r > 0) fen += '/';
    }

    fen += ` ${this.turn} `;

    let castling = '';
    if (this.castlingRights & CASTLE_WK) castling += 'K';
    if (this.castlingRights & CASTLE_WQ) castling += 'Q';
    if (this.castlingRights & CASTLE_BK) castling += 'k';
    if (this.castlingRights & CASTLE_BQ) castling += 'q';
    fen += castling || '-';

    fen += ` ${this.epSquare !== -1 ? indexToSquare(this.epSquare) : '-'} `;
    fen += `${this.halfmoveClock} ${this.fullmoveNumber}`;

    return fen;
  }

  // Key for repetition tracking (piece placement, turn, castling rights, valid en-passant)
  getPositionKey(): string {
    let placement = '';
    for (let i = 0; i < 64; i++) {
      placement += this.board[i].toString(16);
    }
    return `${placement}_${this.turn}_${this.castlingRights}_${this.epSquare}`;
  }

  clone(): BoardState {
    const next = new BoardState(START_FEN);
    next.board.set(this.board);
    next.turn = this.turn;
    next.castlingRights = this.castlingRights;
    next.epSquare = this.epSquare;
    next.halfmoveClock = this.halfmoveClock;
    next.fullmoveNumber = this.fullmoveNumber;
    next.kingSquareW = this.kingSquareW;
    next.kingSquareB = this.kingSquareB;
    return next;
  }

  getPiece(sq: number): { type: PieceSymbol; color: Color } | null {
    const piece = this.board[sq];
    if (piece === PIECE_EMPTY) return null;
    return {
      type: pieceToSymbol(piece),
      color: (piece & COLOR_BLACK) !== 0 ? 'b' : 'w'
    };
  }

  getPieceAtSquare(square: Square): { type: PieceSymbol; color: Color } | null {
    return this.getPiece(squareToIndex(square));
  }
}
