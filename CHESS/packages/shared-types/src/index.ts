export type FileLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type RankNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Square = `${FileLetter}${RankNumber}`;

export type Color = 'w' | 'b';
export type PieceSymbol = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export type PieceTypeLower = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

export type SpecialMoveType = 'castle-kingside' | 'castle-queenside' | 'en-passant' | 'promotion';

export interface MoveCapture {
  piece: PieceSymbol;
  square: Square;
}

export type GameEventType =
  | 'MOVE'
  | 'GAME_START'
  | 'RESIGN'
  | 'DRAW_OFFER'
  | 'DRAW_ACCEPT'
  | 'RESTART'
  | 'UNDO';

export type DrawReason =
  | 'threefold-repetition'
  | 'fifty-move-rule'
  | 'insufficient-material'
  | 'agreement'
  | 'stalemate';

export interface GameEvent {
  type: GameEventType;
  moveNumber: number;
  san: string;
  uci: string;
  piece: PieceSymbol;
  color: Color;
  capture: MoveCapture | null;
  special: SpecialMoveType | null;
  promotedTo?: PieceSymbol;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  drawReason?: DrawReason;
  fenBefore: string;
  fenAfter: string;
  resultingLegalMoves: number;
  winner?: Color | 'draw';
}

export type AnimationLevel = 'Off' | 'Minimal' | 'Normal' | 'Cinematic';

export type AIDifficultyTier =
  | 'Beginner'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Expert'
  | 'Master'
  | 'Ultimate';

export interface AIDifficultyConfig {
  tier: AIDifficultyTier;
  label: string;
  description: string;
  uciElo: number;
  limitStrength: boolean;
  depth: number;
  movetimeMs: number;
}

export type GameMode = 'pv-ai' | 'pv-p';

export interface PlayerSettings {
  animationLevel: AnimationLevel;
  soundEnabled: boolean;
  soundVolume: number;
  boardOrientation: 'white' | 'black' | 'auto-flip';
  theme: string;
}

export type PuzzleTheme =
  | 'mate-in-1'
  | 'mate-in-2'
  | 'fork'
  | 'pin'
  | 'sacrifice'
  | 'back-rank'
  | 'deflection';

export interface Puzzle {
  id: string;
  title: string;
  fen: string;
  moves: string[]; // Solution UCI move sequence: ['h5f7'] or ['b6f2', 'g1h1', 'f2g1']
  rating: number; // 800..2200
  theme: PuzzleTheme;
  description: string;
  hint: string;
}

