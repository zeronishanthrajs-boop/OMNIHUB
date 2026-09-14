import { Puzzle, Square, PieceSymbol, GameEvent } from '@cinematic-chess/shared-types';
import { ChessGame } from '@cinematic-chess/chess-core';
import { PUZZLE_DATABASE } from './puzzleDatabase';

export type PuzzleStatus = 'playing' | 'opponent_thinking' | 'solved' | 'failed';

export interface PuzzleState {
  currentPuzzle: Puzzle;
  puzzleIndex: number;
  totalPuzzles: number;
  stepIndex: number;
  status: PuzzleStatus;
  userRating: number;
  streak: number;
  hintSquare: Square | null;
  lastEvent: GameEvent | null;
}

const PUZZLE_STORAGE_KEY = 'cinematic_chess_puzzles_v1';

export class PuzzleManager {
  private game: ChessGame;
  private puzzles: Puzzle[] = PUZZLE_DATABASE;
  private currentIndex: number = 0;
  private stepIndex: number = 0;
  private status: PuzzleStatus = 'playing';
  private userRating: number = 1000;
  private streak: number = 0;
  private hintSquare: Square | null = null;
  private lastEvent: GameEvent | null = null;
  private listeners: ((state: PuzzleState) => void)[] = [];
  private presentationHandler: ((event: GameEvent) => Promise<void>) | null = null;

  constructor() {
    this.loadPersistedData();
    this.game = new ChessGame(this.getCurrentPuzzle().fen);
  }

  private loadPersistedData() {
    try {
      const saved = localStorage.getItem(PUZZLE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.userRating = data.userRating || 1000;
        this.streak = data.streak || 0;
        this.currentIndex = data.currentIndex || 0;
        if (this.currentIndex >= this.puzzles.length) {
          this.currentIndex = 0;
        }
      }
    } catch (e) {}
  }

  private persistData() {
    try {
      localStorage.setItem(
        PUZZLE_STORAGE_KEY,
        JSON.stringify({
          userRating: this.userRating,
          streak: this.streak,
          currentIndex: this.currentIndex
        })
      );
    } catch (e) {}
  }

  setPresentationHandler(handler: (event: GameEvent) => Promise<void>) {
    this.presentationHandler = handler;
  }

  onStateChange(cb: (state: PuzzleState) => void): () => void {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const state = this.getState();
    for (const l of this.listeners) {
      l(state);
    }
  }

  getState(): PuzzleState {
    return {
      currentPuzzle: this.getCurrentPuzzle(),
      puzzleIndex: this.currentIndex,
      totalPuzzles: this.puzzles.length,
      stepIndex: this.stepIndex,
      status: this.status,
      userRating: this.userRating,
      streak: this.streak,
      hintSquare: this.hintSquare,
      lastEvent: this.lastEvent
    };
  }

  getCurrentPuzzle(): Puzzle {
    return this.puzzles[this.currentIndex];
  }

  getGame(): ChessGame {
    return this.game;
  }

  async playMove(from: Square, to: Square, promotion?: PieceSymbol): Promise<boolean> {
    if (this.status !== 'playing') return false;

    const puzzle = this.getCurrentPuzzle();
    const expectedUci = puzzle.moves[this.stepIndex];

    const promoChar = promotion ? promotion.toLowerCase() : '';
    const playedUci = `${from}${to}${promoChar}`;

    // Verify move matches expected solution step
    if (playedUci !== expectedUci && `${from}${to}` !== expectedUci) {
      // Incorrect move
      this.status = 'failed';
      this.streak = 0;
      this.persistData();
      this.notify();
      return false;
    }

    // Play move on ChessGame
    const event = this.game.playMove(from, to, promotion);
    if (!event) return false;

    this.lastEvent = event;
    this.hintSquare = null;

    if (this.presentationHandler) {
      await this.presentationHandler(event);
    }

    this.stepIndex++;

    // Check if entire puzzle is solved
    if (this.stepIndex >= puzzle.moves.length) {
      this.status = 'solved';
      this.streak++;
      this.userRating += 15;
      this.persistData();
      this.notify();
      return true;
    }

    // Intermediate step: auto-play opponent's forced response
    this.status = 'opponent_thinking';
    this.notify();

    setTimeout(async () => {
      await this.playOpponentResponse();
    }, 450);

    return true;
  }

  private async playOpponentResponse() {
    const puzzle = this.getCurrentPuzzle();
    const opponentUci = puzzle.moves[this.stepIndex];
    if (!opponentUci) return;

    const event = this.game.playUci(opponentUci);
    if (event) {
      this.lastEvent = event;
      if (this.presentationHandler) {
        await this.presentationHandler(event);
      }
      this.stepIndex++;
      this.status = 'playing';
      this.notify();
    }
  }

  resetCurrentPuzzle() {
    const puzzle = this.getCurrentPuzzle();
    this.game = new ChessGame(puzzle.fen);
    this.stepIndex = 0;
    this.status = 'playing';
    this.hintSquare = null;
    this.lastEvent = null;
    this.notify();
  }

  nextPuzzle() {
    this.currentIndex = (this.currentIndex + 1) % this.puzzles.length;
    this.persistData();
    this.resetCurrentPuzzle();
  }

  requestHint(): Square | null {
    const puzzle = this.getCurrentPuzzle();
    const nextMove = puzzle.moves[this.stepIndex];
    if (!nextMove) return null;

    const fromSq = nextMove.slice(0, 2) as Square;
    this.hintSquare = fromSq;
    this.notify();
    return fromSq;
  }
}
