import {
  Color,
  InternalMove,
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
  CASTLE_BQ
} from './types';
import { BoardState } from './boardState';

export interface UndoState {
  castlingRights: number;
  epSquare: number;
  halfmoveClock: number;
  fullmoveNumber: number;
  capturedPiece: number;
  capturedSquare: number;
  kingSquareW: number;
  kingSquareB: number;
}

const KNIGHT_DELTAS = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2]
];

const KING_DELTAS = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1]
];

const BISHOP_DIRS = [
  [1, 1], [1, -1], [-1, 1], [-1, -1]
];

const ROOK_DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1]
];

const QUEEN_DIRS = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1]
];

export function isSquareAttacked(state: BoardState, sq: number, attackerColor: Color): boolean {
  const board = state.board;
  const sqFile = sq & 7;
  const sqRank = sq >> 3;
  const attackerIsWhite = attackerColor === 'w';
  const attackerColorMask = attackerIsWhite ? COLOR_WHITE : COLOR_BLACK;

  // 1. Pawn attacks
  if (attackerIsWhite) {
    // White pawns attack diagonally upward (from rank - 1)
    if (sqRank > 0) {
      if (sqFile > 0) {
        const p = board[(sqRank - 1) * 8 + (sqFile - 1)];
        if (p === (PIECE_PAWN | COLOR_WHITE)) return true;
      }
      if (sqFile < 7) {
        const p = board[(sqRank - 1) * 8 + (sqFile + 1)];
        if (p === (PIECE_PAWN | COLOR_WHITE)) return true;
      }
    }
  } else {
    // Black pawns attack diagonally downward (from rank + 1)
    if (sqRank < 7) {
      if (sqFile > 0) {
        const p = board[(sqRank + 1) * 8 + (sqFile - 1)];
        if (p === (PIECE_PAWN | COLOR_BLACK)) return true;
      }
      if (sqFile < 7) {
        const p = board[(sqRank + 1) * 8 + (sqFile + 1)];
        if (p === (PIECE_PAWN | COLOR_BLACK)) return true;
      }
    }
  }

  // 2. Knight attacks
  for (let i = 0; i < 8; i++) {
    const f = sqFile + KNIGHT_DELTAS[i][0];
    const r = sqRank + KNIGHT_DELTAS[i][1];
    if (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const p = board[r * 8 + f];
      if (p === (PIECE_KNIGHT | attackerColorMask)) return true;
    }
  }

  // 3. King attacks
  for (let i = 0; i < 8; i++) {
    const f = sqFile + KING_DELTAS[i][0];
    const r = sqRank + KING_DELTAS[i][1];
    if (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const p = board[r * 8 + f];
      if (p === (PIECE_KING | attackerColorMask)) return true;
    }
  }

  // 4. Bishop/Queen attacks (diagonals)
  for (let d = 0; d < 4; d++) {
    const df = BISHOP_DIRS[d][0];
    const dr = BISHOP_DIRS[d][1];
    let cf = sqFile + df;
    let cr = sqRank + dr;
    while (cf >= 0 && cf < 8 && cr >= 0 && cr < 8) {
      const p = board[cr * 8 + cf];
      if (p !== PIECE_EMPTY) {
        const pColor = (p & COLOR_BLACK) !== 0 ? 'b' : 'w';
        if (pColor === attackerColor) {
          const type = p & 7;
          if (type === PIECE_BISHOP || type === PIECE_QUEEN) return true;
        }
        break; // blocked by piece
      }
      cf += df;
      cr += dr;
    }
  }

  // 5. Rook/Queen attacks (orthogonals)
  for (let d = 0; d < 4; d++) {
    const df = ROOK_DIRS[d][0];
    const dr = ROOK_DIRS[d][1];
    let cf = sqFile + df;
    let cr = sqRank + dr;
    while (cf >= 0 && cf < 8 && cr >= 0 && cr < 8) {
      const p = board[cr * 8 + cf];
      if (p !== PIECE_EMPTY) {
        const pColor = (p & COLOR_BLACK) !== 0 ? 'b' : 'w';
        if (pColor === attackerColor) {
          const type = p & 7;
          if (type === PIECE_ROOK || type === PIECE_QUEEN) return true;
        }
        break; // blocked by piece
      }
      cf += df;
      cr += dr;
    }
  }

  return false;
}

export function isKingInCheck(state: BoardState, color: Color): boolean {
  const kingSq = color === 'w' ? state.kingSquareW : state.kingSquareB;
  const enemyColor: Color = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(state, kingSq, enemyColor);
}

export function makeMove(state: BoardState, move: InternalMove): UndoState {
  const undo: UndoState = {
    castlingRights: state.castlingRights,
    epSquare: state.epSquare,
    halfmoveClock: state.halfmoveClock,
    fullmoveNumber: state.fullmoveNumber,
    capturedPiece: move.capturedPiece,
    capturedSquare: move.capturedSquare ?? move.to,
    kingSquareW: state.kingSquareW,
    kingSquareB: state.kingSquareB
  };

  const board = state.board;
  const isWhite = state.turn === 'w';

  // Clear piece from source
  board[move.from] = PIECE_EMPTY;

  // Handle capture removal
  if (move.special === 'en-passant') {
    const capSq = move.capturedSquare!;
    board[capSq] = PIECE_EMPTY;
  }

  // Place piece at destination
  let finalPiece = move.piece;
  if (move.promotion) {
    const colorMask = isWhite ? COLOR_WHITE : COLOR_BLACK;
    finalPiece = move.promotion | colorMask;
  }
  board[move.to] = finalPiece;

  // Handle castling rook movement
  if (move.special === 'castle-kingside') {
    if (isWhite) {
      board[7] = PIECE_EMPTY; // h1
      board[5] = PIECE_ROOK | COLOR_WHITE; // f1
    } else {
      board[63] = PIECE_EMPTY; // h8
      board[61] = PIECE_ROOK | COLOR_BLACK; // f8
    }
  } else if (move.special === 'castle-queenside') {
    if (isWhite) {
      board[0] = PIECE_EMPTY; // a1
      board[3] = PIECE_ROOK | COLOR_WHITE; // d1
    } else {
      board[56] = PIECE_EMPTY; // a8
      board[59] = PIECE_ROOK | COLOR_BLACK; // d8
    }
  }

  // Update king positions
  const pieceType = move.piece & 7;
  if (pieceType === PIECE_KING) {
    if (isWhite) {
      state.kingSquareW = move.to;
      state.castlingRights &= ~(CASTLE_WK | CASTLE_WQ);
    } else {
      state.kingSquareB = move.to;
      state.castlingRights &= ~(CASTLE_BK | CASTLE_BQ);
    }
  }

  // Update castling rights if rook moved
  if (move.from === 0) state.castlingRights &= ~CASTLE_WQ;
  else if (move.from === 7) state.castlingRights &= ~CASTLE_WK;
  else if (move.from === 56) state.castlingRights &= ~CASTLE_BQ;
  else if (move.from === 63) state.castlingRights &= ~CASTLE_BK;

  // Update castling rights if rook was captured
  if (move.to === 0) state.castlingRights &= ~CASTLE_WQ;
  else if (move.to === 7) state.castlingRights &= ~CASTLE_WK;
  else if (move.to === 56) state.castlingRights &= ~CASTLE_BQ;
  else if (move.to === 63) state.castlingRights &= ~CASTLE_BK;

  // Update en passant square
  if (pieceType === PIECE_PAWN && Math.abs(move.to - move.from) === 16) {
    state.epSquare = (move.from + move.to) >> 1;
  } else {
    state.epSquare = -1;
  }

  // Update halfmove clock
  if (pieceType === PIECE_PAWN || move.capturedPiece !== PIECE_EMPTY) {
    state.halfmoveClock = 0;
  } else {
    state.halfmoveClock++;
  }

  // Update fullmove number and turn
  if (!isWhite) {
    state.fullmoveNumber++;
    state.turn = 'w';
  } else {
    state.turn = 'b';
  }

  return undo;
}

export function unmakeMove(state: BoardState, move: InternalMove, undo: UndoState): void {
  const board = state.board;
  const prevTurn: Color = state.turn === 'w' ? 'b' : 'w';
  const isWhite = prevTurn === 'w';

  // Restore destination square
  if (move.special === 'en-passant') {
    board[move.to] = PIECE_EMPTY;
    board[undo.capturedSquare] = undo.capturedPiece;
  } else {
    board[move.to] = undo.capturedPiece;
  }

  // Restore origin square
  board[move.from] = move.piece;

  // Restore castling rook
  if (move.special === 'castle-kingside') {
    if (isWhite) {
      board[5] = PIECE_EMPTY; // f1
      board[7] = PIECE_ROOK | COLOR_WHITE; // h1
    } else {
      board[61] = PIECE_EMPTY; // f8
      board[63] = PIECE_ROOK | COLOR_BLACK; // h8
    }
  } else if (move.special === 'castle-queenside') {
    if (isWhite) {
      board[3] = PIECE_EMPTY; // d1
      board[0] = PIECE_ROOK | COLOR_WHITE; // a1
    } else {
      board[59] = PIECE_EMPTY; // d8
      board[56] = PIECE_ROOK | COLOR_BLACK; // a8
    }
  }

  // Restore state variables
  state.turn = prevTurn;
  state.castlingRights = undo.castlingRights;
  state.epSquare = undo.epSquare;
  state.halfmoveClock = undo.halfmoveClock;
  state.fullmoveNumber = undo.fullmoveNumber;
  state.kingSquareW = undo.kingSquareW;
  state.kingSquareB = undo.kingSquareB;
}

export function generatePseudoLegalMoves(state: BoardState): InternalMove[] {
  const moves: InternalMove[] = [];
  const board = state.board;
  const isWhite = state.turn === 'w';
  const myColorMask = isWhite ? COLOR_WHITE : COLOR_BLACK;
  const enemyColor: Color = isWhite ? 'b' : 'w';

  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq];
    if (piece === PIECE_EMPTY) continue;
    const pieceColor = (piece & COLOR_BLACK) !== 0 ? 'b' : 'w';
    if (pieceColor !== state.turn) continue;

    const pieceType = piece & 7;
    const file = sq & 7;
    const rank = sq >> 3;

    if (pieceType === PIECE_PAWN) {
      if (isWhite) {
        // White Pawn forward moves
        const oneUp = sq + 8;
        if (board[oneUp] === PIECE_EMPTY) {
          if (rank === 6) {
            // Promotions on reaching rank 8
            moves.push({ from: sq, to: oneUp, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_QUEEN, special: 'promotion' });
            moves.push({ from: sq, to: oneUp, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_ROOK, special: 'promotion' });
            moves.push({ from: sq, to: oneUp, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_BISHOP, special: 'promotion' });
            moves.push({ from: sq, to: oneUp, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_KNIGHT, special: 'promotion' });
          } else {
            moves.push({ from: sq, to: oneUp, piece, capturedPiece: PIECE_EMPTY });
            if (rank === 1) {
              const twoUp = sq + 16;
              if (board[twoUp] === PIECE_EMPTY) {
                moves.push({ from: sq, to: twoUp, piece, capturedPiece: PIECE_EMPTY });
              }
            }
          }
        }
        // White Pawn captures
        if (file > 0) {
          const capSq = sq + 7;
          const target = board[capSq];
          if (target !== PIECE_EMPTY && (target & COLOR_BLACK) !== 0) {
            if (rank === 6) {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_QUEEN, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_ROOK, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_BISHOP, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_KNIGHT, special: 'promotion' });
            } else {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target });
            }
          } else if (capSq === state.epSquare) {
            moves.push({
              from: sq,
              to: capSq,
              piece,
              capturedPiece: PIECE_PAWN | COLOR_BLACK,
              capturedSquare: sq - 1, // d5 pawn on d-file
              special: 'en-passant'
            });
          }
        }
        if (file < 7) {
          const capSq = sq + 9;
          const target = board[capSq];
          if (target !== PIECE_EMPTY && (target & COLOR_BLACK) !== 0) {
            if (rank === 6) {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_QUEEN, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_ROOK, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_BISHOP, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_KNIGHT, special: 'promotion' });
            } else {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target });
            }
          } else if (capSq === state.epSquare) {
            moves.push({
              from: sq,
              to: capSq,
              piece,
              capturedPiece: PIECE_PAWN | COLOR_BLACK,
              capturedSquare: sq + 1, // f5 pawn on f-file
              special: 'en-passant'
            });
          }
        }
      } else {
        // Black Pawn forward moves
        const oneDown = sq - 8;
        if (board[oneDown] === PIECE_EMPTY) {
          if (rank === 1) {
            // Promotions on reaching rank 1
            moves.push({ from: sq, to: oneDown, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_QUEEN, special: 'promotion' });
            moves.push({ from: sq, to: oneDown, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_ROOK, special: 'promotion' });
            moves.push({ from: sq, to: oneDown, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_BISHOP, special: 'promotion' });
            moves.push({ from: sq, to: oneDown, piece, capturedPiece: PIECE_EMPTY, promotion: PIECE_KNIGHT, special: 'promotion' });
          } else {
            moves.push({ from: sq, to: oneDown, piece, capturedPiece: PIECE_EMPTY });
            if (rank === 6) {
              const twoDown = sq - 16;
              if (board[twoDown] === PIECE_EMPTY) {
                moves.push({ from: sq, to: twoDown, piece, capturedPiece: PIECE_EMPTY });
              }
            }
          }
        }
        // Black Pawn captures
        if (file > 0) {
          const capSq = sq - 9;
          const target = board[capSq];
          if (target !== PIECE_EMPTY && (target & COLOR_BLACK) === 0) {
            if (rank === 1) {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_QUEEN, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_ROOK, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_BISHOP, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_KNIGHT, special: 'promotion' });
            } else {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target });
            }
          } else if (capSq === state.epSquare) {
            moves.push({
              from: sq,
              to: capSq,
              piece,
              capturedPiece: PIECE_PAWN | COLOR_WHITE,
              capturedSquare: sq - 1, // d4 pawn on d-file
              special: 'en-passant'
            });
          }
        }
        if (file < 7) {
          const capSq = sq - 7;
          const target = board[capSq];
          if (target !== PIECE_EMPTY && (target & COLOR_BLACK) === 0) {
            if (rank === 1) {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_QUEEN, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_ROOK, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_BISHOP, special: 'promotion' });
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target, promotion: PIECE_KNIGHT, special: 'promotion' });
            } else {
              moves.push({ from: sq, to: capSq, piece, capturedPiece: target });
            }
          } else if (capSq === state.epSquare) {
            moves.push({
              from: sq,
              to: capSq,
              piece,
              capturedPiece: PIECE_PAWN | COLOR_WHITE,
              capturedSquare: sq + 1, // f4 pawn on f-file
              special: 'en-passant'
            });
          }
        }
      }
    } else if (pieceType === PIECE_KNIGHT) {
      for (let i = 0; i < 8; i++) {
        const nf = file + KNIGHT_DELTAS[i][0];
        const nr = rank + KNIGHT_DELTAS[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
          const to = nr * 8 + nf;
          const target = board[to];
          if (target === PIECE_EMPTY) {
            moves.push({ from: sq, to, piece, capturedPiece: PIECE_EMPTY });
          } else if (((target & COLOR_BLACK) !== 0) !== ((piece & COLOR_BLACK) !== 0)) {
            moves.push({ from: sq, to, piece, capturedPiece: target });
          }
        }
      }
    } else if (pieceType === PIECE_BISHOP || pieceType === PIECE_ROOK || pieceType === PIECE_QUEEN) {
      const dirs = pieceType === PIECE_BISHOP ? BISHOP_DIRS : pieceType === PIECE_ROOK ? ROOK_DIRS : QUEEN_DIRS;
      for (let d = 0; d < dirs.length; d++) {
        const df = dirs[d][0];
        const dr = dirs[d][1];
        let cf = file + df;
        let cr = rank + dr;
        while (cf >= 0 && cf < 8 && cr >= 0 && cr < 8) {
          const to = cr * 8 + cf;
          const target = board[to];
          if (target === PIECE_EMPTY) {
            moves.push({ from: sq, to, piece, capturedPiece: PIECE_EMPTY });
          } else {
            if (((target & COLOR_BLACK) !== 0) !== ((piece & COLOR_BLACK) !== 0)) {
              moves.push({ from: sq, to, piece, capturedPiece: target });
            }
            break;
          }
          cf += df;
          cr += dr;
        }
      }
    } else if (pieceType === PIECE_KING) {
      for (let i = 0; i < 8; i++) {
        const kf = file + KING_DELTAS[i][0];
        const kr = rank + KING_DELTAS[i][1];
        if (kf >= 0 && kf < 8 && kr >= 0 && kr < 8) {
          const to = kr * 8 + kf;
          const target = board[to];
          if (target === PIECE_EMPTY) {
            moves.push({ from: sq, to, piece, capturedPiece: PIECE_EMPTY });
          } else if (((target & COLOR_BLACK) !== 0) !== ((piece & COLOR_BLACK) !== 0)) {
            moves.push({ from: sq, to, piece, capturedPiece: target });
          }
        }
      }

      // Castling
      if (isWhite) {
        // White Kingside: e1 (4) -> g1 (6)
        if (
          (state.castlingRights & CASTLE_WK) &&
          sq === 4 &&
          board[5] === PIECE_EMPTY &&
          board[6] === PIECE_EMPTY &&
          board[7] === (PIECE_ROOK | COLOR_WHITE) &&
          !isSquareAttacked(state, 4, 'b') &&
          !isSquareAttacked(state, 5, 'b') &&
          !isSquareAttacked(state, 6, 'b')
        ) {
          moves.push({ from: 4, to: 6, piece, capturedPiece: PIECE_EMPTY, special: 'castle-kingside' });
        }
        // White Queenside: e1 (4) -> c1 (2)
        if (
          (state.castlingRights & CASTLE_WQ) &&
          sq === 4 &&
          board[1] === PIECE_EMPTY &&
          board[2] === PIECE_EMPTY &&
          board[3] === PIECE_EMPTY &&
          board[0] === (PIECE_ROOK | COLOR_WHITE) &&
          !isSquareAttacked(state, 4, 'b') &&
          !isSquareAttacked(state, 3, 'b') &&
          !isSquareAttacked(state, 2, 'b')
        ) {
          moves.push({ from: 4, to: 2, piece, capturedPiece: PIECE_EMPTY, special: 'castle-queenside' });
        }
      } else {
        // Black Kingside: e8 (60) -> g8 (62)
        if (
          (state.castlingRights & CASTLE_BK) &&
          sq === 60 &&
          board[61] === PIECE_EMPTY &&
          board[62] === PIECE_EMPTY &&
          board[63] === (PIECE_ROOK | COLOR_BLACK) &&
          !isSquareAttacked(state, 60, 'w') &&
          !isSquareAttacked(state, 61, 'w') &&
          !isSquareAttacked(state, 62, 'w')
        ) {
          moves.push({ from: 60, to: 62, piece, capturedPiece: PIECE_EMPTY, special: 'castle-kingside' });
        }
        // Black Queenside: e8 (60) -> c8 (58)
        if (
          (state.castlingRights & CASTLE_BQ) &&
          sq === 60 &&
          board[57] === PIECE_EMPTY &&
          board[58] === PIECE_EMPTY &&
          board[59] === PIECE_EMPTY &&
          board[56] === (PIECE_ROOK | COLOR_BLACK) &&
          !isSquareAttacked(state, 60, 'w') &&
          !isSquareAttacked(state, 59, 'w') &&
          !isSquareAttacked(state, 58, 'w')
        ) {
          moves.push({ from: 60, to: 58, piece, capturedPiece: PIECE_EMPTY, special: 'castle-queenside' });
        }
      }
    }
  }

  return moves;
}

export function generateLegalMoves(state: BoardState): InternalMove[] {
  const pseudoMoves = generatePseudoLegalMoves(state);
  const legalMoves: InternalMove[] = [];
  const movingColor = state.turn;

  for (let i = 0; i < pseudoMoves.length; i++) {
    const move = pseudoMoves[i];
    const undo = makeMove(state, move);
    const inCheck = isKingInCheck(state, movingColor);
    unmakeMove(state, move, undo);
    if (!inCheck) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

export function perft(state: BoardState, depth: number): number {
  if (depth === 0) return 1;
  const legalMoves = generateLegalMoves(state);
  if (depth === 1) return legalMoves.length;

  let nodes = 0;
  for (let i = 0; i < legalMoves.length; i++) {
    const undo = makeMove(state, legalMoves[i]);
    nodes += perft(state, depth - 1);
    unmakeMove(state, legalMoves[i], undo);
  }
  return nodes;
}
