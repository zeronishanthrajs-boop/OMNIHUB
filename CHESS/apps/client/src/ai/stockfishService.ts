import { AIDifficultyTier } from '@cinematic-chess/shared-types';
import { AI_TIER_CONFIGS, ExtendedAIConfig } from './aiConfig';

export interface BestMoveResult {
  uci: string;
  ponder?: string;
  depth?: number;
  evalCp?: number;
}

export interface WorkerLike {
  postMessage(message: any): void;
  onmessage?: ((e: any) => void) | null;
  terminate?(): void;
  addEventListener?(type: string, listener: (e: any) => void): void;
  removeEventListener?(type: string, listener: (e: any) => void): void;
}

export class StockfishService {
  private worker: WorkerLike | null = null;
  private isReady: boolean = false;
  private isSearching: boolean = false;
  private currentTier: AIDifficultyTier = 'Medium';
  private resolveBestMove: ((result: BestMoveResult) => void) | null = null;
  private rejectBestMove: ((err: Error) => void) | null = null;
  private searchTimeoutTimer: any = null;
  private messageListeners: ((msg: string) => void)[] = [];
  private workerFactory?: () => WorkerLike;

  constructor(workerFactory?: () => WorkerLike) {
    this.workerFactory = workerFactory;
  }

  async init(workerPath: string = '/stockfish.js'): Promise<void> {
    if (this.worker) return;

    if (this.workerFactory) {
      this.worker = this.workerFactory();
    } else if (typeof Worker !== 'undefined') {
      this.worker = new Worker(workerPath);
    } else {
      console.warn('Web Worker not supported in this environment.');
      return;
    }

    const worker = this.worker;
    if (!worker) return;

    const messageHandler = (e: { data: any }) => {
      const line = typeof e.data === 'string' ? e.data.trim() : '';
      this.handleEngineOutput(line);
    };

    if (worker.addEventListener) {
      worker.addEventListener('message', messageHandler);
    } else {
      worker.onmessage = messageHandler;
    }

    return new Promise((resolve) => {
      const onUciOk = (line: string) => {
        if (line === 'uciok') {
          this.removeMessageListener(onUciOk);
          this.isReady = true;
          this.configureTier(this.currentTier);
          resolve();
        }
      };
      this.addMessageListener(onUciOk);
      this.sendCommand('uci');
    });
  }

  setTier(tier: AIDifficultyTier): void {
    this.currentTier = tier;
    if (this.isReady) {
      this.configureTier(tier);
    }
  }

  getTier(): AIDifficultyTier {
    return this.currentTier;
  }

  getTierConfig(tier: AIDifficultyTier = this.currentTier): ExtendedAIConfig {
    return AI_TIER_CONFIGS[tier];
  }

  private configureTier(tier: AIDifficultyTier): void {
    const config = AI_TIER_CONFIGS[tier];
    // Modern Stockfish UCI_LimitStrength / UCI_Elo options
    this.sendCommand(`setoption name UCI_LimitStrength value ${config.limitStrength ? 'true' : 'false'}`);
    if (config.limitStrength) {
      this.sendCommand(`setoption name UCI_Elo value ${config.uciElo}`);
    }
    // Classic Stockfish Skill Level fallback (0 to 20)
    this.sendCommand(`setoption name Skill Level value ${config.skillLevel}`);
    this.sendCommand('isready');
  }

  async getBestMove(fen: string, tier: AIDifficultyTier = this.currentTier): Promise<BestMoveResult> {
    if (!this.worker) {
      await this.init();
    }

    if (this.isSearching) {
      this.stop();
    }

    const config = AI_TIER_CONFIGS[tier];
    this.configureTier(tier);

    return new Promise((resolve, reject) => {
      this.isSearching = true;
      this.resolveBestMove = resolve;
      this.rejectBestMove = reject;

      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${config.depth} movetime ${config.movetimeMs}`);

      // Safety timeout: movetime + 3000ms grace period
      const timeoutMs = config.movetimeMs + 3000;
      this.searchTimeoutTimer = setTimeout(() => {
        if (this.isSearching) {
          console.warn(`Stockfish search timed out after ${timeoutMs}ms, requesting stop.`);
          this.sendCommand('stop');
        }
      }, timeoutMs);
    });
  }

  stop(): void {
    if (this.isSearching) {
      this.sendCommand('stop');
    }
  }

  terminate(): void {
    if (this.worker) {
      if (this.worker.terminate) {
        this.worker.terminate();
      }
      this.worker = null;
      this.isReady = false;
      this.isSearching = false;
    }
  }

  private sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  private handleEngineOutput(line: string): void {
    for (const listener of [...this.messageListeners]) {
      listener(line);
    }

    if (line.startsWith('bestmove')) {
      if (this.searchTimeoutTimer) {
        clearTimeout(this.searchTimeoutTimer);
        this.searchTimeoutTimer = null;
      }

      this.isSearching = false;
      const parts = line.split(/\s+/);
      const uciMove = parts[1];
      const ponder = parts[2] === 'ponder' ? parts[3] : undefined;

      if (this.resolveBestMove) {
        const cb = this.resolveBestMove;
        this.resolveBestMove = null;
        this.rejectBestMove = null;
        cb({ uci: uciMove, ponder });
      }
    }
  }

  private addMessageListener(fn: (msg: string) => void): void {
    this.messageListeners.push(fn);
  }

  private removeMessageListener(fn: (msg: string) => void): void {
    this.messageListeners = this.messageListeners.filter((l) => l !== fn);
  }
}
