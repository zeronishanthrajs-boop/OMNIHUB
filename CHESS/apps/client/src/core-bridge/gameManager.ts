import {
  Square,
  Color,
  PieceSymbol,
  GameEvent,
  GameMode,
  AIDifficultyTier,
  AnimationLevel
} from '@cinematic-chess/shared-types';
import { ChessGame } from '@cinematic-chess/chess-core';
import { StockfishService } from '../ai/stockfishService';

export type GameEventListener = (event: GameEvent) => void | Promise<void>;
export type StateChangeListener = (manager: GameManager) => void;

export interface GameManagerConfig {
  mode: GameMode;
  aiTier: AIDifficultyTier;
  playerColor: Color; // For PvAI: Color the human plays
  animationLevel: AnimationLevel;
  autoFlipBoard: boolean;
}

export const DEFAULT_CONFIG: GameManagerConfig = {
  mode: 'pv-ai',
  aiTier: 'Medium',
  playerColor: 'w',
  animationLevel: 'Normal',
  autoFlipBoard: false
};

export class GameManager {
  private game: ChessGame;
  private aiService: StockfishService;
  private config: GameManagerConfig;
  private isAIThinking: boolean = false;
  private isAnimating: boolean = false;
  private aiThinkingPromise: Promise<void> | null = null;
  private presentationHandler: ((event: GameEvent) => Promise<void>) | null = null;
  private eventListeners: GameEventListener[] = [];
  private stateListeners: StateChangeListener[] = [];

  constructor(
    config: Partial<GameManagerConfig> = {},
    aiService?: StockfishService,
    game?: ChessGame
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.game = game || new ChessGame();
    this.aiService = aiService || new StockfishService();
  }

  async waitForAI(): Promise<void> {
    if (this.aiThinkingPromise) {
      await this.aiThinkingPromise;
    }
  }

  getConfig(): GameManagerConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GameManagerConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.aiTier) {
      this.aiService.setTier(updates.aiTier);
    }
    this.notifyStateChange();
  }

  getGame(): ChessGame {
    return this.game;
  }

  getTurn(): Color {
    return this.game.getTurn();
  }

  getFen(): string {
    return this.game.getFen();
  }

  getStatus() {
    return this.game.getStatus();
  }

  getHistory(): GameEvent[] {
    return this.game.getHistory();
  }

  isThinking(): boolean {
    return this.isAIThinking;
  }

  isBusy(): boolean {
    return this.isAnimating || this.isAIThinking;
  }

  setPresentationHandler(handler: (event: GameEvent) => Promise<void>): void {
    this.presentationHandler = handler;
  }

  onEvent(listener: GameEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notifyStateChange(): void {
    for (const listener of this.stateListeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }

  private async dispatchGameEvent(event: GameEvent): Promise<void> {
    // 1. Notify external event listeners
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Event listener error:', err);
      }
    }

    // 2. Play Presentation animation with robust error isolation
    if (this.presentationHandler && this.config.animationLevel !== 'Off') {
      this.isAnimating = true;
      try {
        await this.presentationHandler(event);
      } catch (err) {
        // Strict PRD Requirement: Presentation failure must NEVER corrupt or block game state!
        console.error('Presentation layer animation error, falling back to instant sync:', err);
      } finally {
        this.isAnimating = false;
      }
    }

    this.notifyStateChange();

    // 3. If game is over, stop
    if (event.isCheckmate || event.isDraw || this.getStatus().isGameOver) {
      return;
    }

    // 4. Trigger AI if appropriate
    this.triggerAITurnIfApplicable();
  }

  async startNewGame(fen?: string): Promise<GameEvent> {
    this.aiService.stop();
    this.isAIThinking = false;
    this.isAnimating = false;

    const event = this.game.reset(fen);
    await this.dispatchGameEvent(event);
    return event;
  }

  async playMove(from: Square, to: Square, promotion?: PieceSymbol): Promise<GameEvent | null> {
    // Reject inputs while animation or AI is actively processing
    if (this.isBusy() && this.config.animationLevel !== 'Off') {
      return null;
    }

    // Reject move if game is already over
    if (this.getStatus().isGameOver) {
      return null;
    }

    // Validate legality through Chess Core
    const event = this.game.playMove(from, to, promotion);
    if (!event) {
      // Illegal move rejected silently, no state change or event emitted
      return null;
    }

    await this.dispatchGameEvent(event);
    return event;
  }

  async playUci(uci: string): Promise<GameEvent | null> {
    if (this.isBusy() && this.config.animationLevel !== 'Off') {
      return null;
    }
    if (this.getStatus().isGameOver) {
      return null;
    }

    const event = this.game.playUci(uci);
    if (!event) return null;

    await this.dispatchGameEvent(event);
    return event;
  }

  private triggerAITurnIfApplicable(): void {
    if (this.config.mode !== 'pv-ai') return;
    if (this.getStatus().isGameOver) return;

    const currentTurn = this.game.getTurn();
    const isAITurn = currentTurn !== this.config.playerColor;

    if (isAITurn && !this.isAIThinking) {
      this.isAIThinking = true;
      this.notifyStateChange();

      this.aiThinkingPromise = (async () => {
        try {
          const fen = this.game.getFen();
          const bestMoveResult = await this.aiService.getBestMove(fen, this.config.aiTier);

          this.isAIThinking = false;

          if (bestMoveResult && bestMoveResult.uci) {
            const aiEvent = this.game.playUci(bestMoveResult.uci);
            if (aiEvent) {
              await this.dispatchGameEvent(aiEvent);
            } else {
              this.fallbackPlayFirstLegalMove();
            }
          }
        } catch (err) {
          console.error('AI calculation failed:', err);
          this.isAIThinking = false;
          this.fallbackPlayFirstLegalMove();
        } finally {
          this.isAIThinking = false;
          this.aiThinkingPromise = null;
        }
      })();
    }
  }

  private fallbackPlayFirstLegalMove(): void {
    const legalMoves = this.game.getAllLegalMoves();
    if (legalMoves.length > 0) {
      const fallbackEvent = this.game.playMove(
        // @ts-ignore
        this.game.getState().indexToSquare ? this.game.getState().indexToSquare(legalMoves[0].from) : 'e2',
        // @ts-ignore
        this.game.getState().indexToSquare ? this.game.getState().indexToSquare(legalMoves[0].to) : 'e4'
      );
      if (fallbackEvent) {
        this.dispatchGameEvent(fallbackEvent);
      }
    }
  }

  async undo(): Promise<GameEvent | null> {
    if (this.isBusy()) return null;

    if (this.config.mode === 'pv-ai') {
      // In PvAI mode, undoing one move means rolling back both AI move and Player move
      this.game.undo();
      const userUndo = this.game.undo();
      if (userUndo) {
        await this.dispatchGameEvent(userUndo);
        return userUndo;
      }
    } else {
      const event = this.game.undo();
      if (event) {
        await this.dispatchGameEvent(event);
        return event;
      }
    }
    return null;
  }

  async redo(): Promise<GameEvent | null> {
    if (this.isBusy()) return null;
    const event = this.game.redo();
    if (event) {
      await this.dispatchGameEvent(event);
      return event;
    }
    return null;
  }

  async resign(color: Color): Promise<GameEvent> {
    const event = this.game.resign(color);
    await this.dispatchGameEvent(event);
    return event;
  }

  async offerDraw(color: Color): Promise<GameEvent> {
    const event = this.game.offerDraw(color);
    await this.dispatchGameEvent(event);
    return event;
  }

  async acceptDraw(): Promise<GameEvent> {
    const event = this.game.acceptDraw();
    await this.dispatchGameEvent(event);
    return event;
  }
}
