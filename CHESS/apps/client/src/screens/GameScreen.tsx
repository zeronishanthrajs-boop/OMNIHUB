import React, { useState, useEffect } from 'react';
import {
  Square,
  Color,
  PieceSymbol,
  GameEvent,
  PlayerSettings
} from '@cinematic-chess/shared-types';
import { GameManager } from '../core-bridge/gameManager';
import { Board } from '../components/Board';
import { MoveList } from '../components/MoveList';
import { CapturedTray } from '../components/CapturedTray';
import { PromotionModal } from '../components/PromotionModal';
import { VictoryDefeatModal } from '../screens/VictoryDefeatModal';
import { SettingsModal } from '../screens/SettingsModal';
import { globalAnimationManager, ActiveAnimationState } from '../animation/animationManager';
import { globalSoundSystem } from '../animation/soundSystem';
import {
  RotateCcw,
  Undo2,
  Flag,
  Handshake,
  Repeat,
  Settings as SettingsIcon,
  Home,
  Bot,
  User,
  Sparkles
} from 'lucide-react';

interface GameScreenProps {
  manager: GameManager;
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onMainMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  manager,
  settings,
  onUpdateSettings,
  onMainMenu
}) => {
  const [boardState, setBoardState] = useState(manager.getGame().getState().clone());
  const [turn, setTurn] = useState<Color>(manager.getTurn());
  const [history, setHistory] = useState<GameEvent[]>(manager.getHistory());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [checkedKingSquare, setCheckedKingSquare] = useState<Square | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(manager.isThinking());
  const [currentAnimation, setCurrentAnimation] = useState<ActiveAnimationState | null>(null);

  // Modals
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [drawOfferedBy, setDrawOfferedBy] = useState<Color | null>(null);

  // Board Orientation
  const [orientation, setOrientation] = useState<'white' | 'black'>(
    settings.boardOrientation === 'black' ? 'black' : 'white'
  );

  // Sync Audio Settings
  useEffect(() => {
    globalSoundSystem.setEnabled(settings.soundEnabled);
    globalSoundSystem.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Sync Animation Level with manager
  useEffect(() => {
    manager.updateConfig({ animationLevel: settings.animationLevel });
  }, [settings.animationLevel, manager]);

  // Presentation Adapter setup
  useEffect(() => {
    manager.setPresentationHandler(async (event) => {
      await globalAnimationManager.playEvent(event, settings.animationLevel);
    });

    const unsubscribeAnimation = globalAnimationManager.onAnimationStateChange((anim) => {
      setCurrentAnimation(anim);
    });

    return () => {
      unsubscribeAnimation();
    };
  }, [manager, settings.animationLevel]);

  // Subscribe to Manager events and state changes
  useEffect(() => {
    const updateLocalState = () => {
      const state = manager.getGame().getState().clone();
      setBoardState(state);
      setTurn(manager.getTurn());
      setHistory([...manager.getHistory()]);
      setIsThinking(manager.isThinking());

      const status = manager.getStatus();
      if (status.isCheck) {
        setCheckedKingSquare(manager.getGame().getKingSquare(manager.getTurn()));
      } else {
        setCheckedKingSquare(null);
      }

      if (status.isGameOver) {
        // Show victory modal after brief animation settle
        setTimeout(() => setShowGameOverModal(true), 600);
      }

      // Auto-flip board in PvP mode if setting is enabled
      if (
        settings.boardOrientation === 'auto-flip' &&
        manager.getConfig().mode === 'pv-p'
      ) {
        setOrientation(manager.getTurn() === 'w' ? 'white' : 'black');
      }
    };

    const unsubscribeEvent = manager.onEvent((ev) => {
      if (ev.type === 'MOVE') {
        const from = ev.uci.slice(0, 2) as Square;
        const to = ev.uci.slice(2, 4) as Square;
        setLastMove({ from, to });
      } else if (ev.type === 'RESTART') {
        setLastMove(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        setShowGameOverModal(false);
      } else if (ev.type === 'DRAW_OFFER') {
        setDrawOfferedBy(ev.color);
      }
      updateLocalState();
    });

    const unsubscribeState = manager.onStateChange(() => {
      updateLocalState();
    });

    updateLocalState();

    return () => {
      unsubscribeEvent();
      unsubscribeState();
    };
  }, [manager, settings.boardOrientation]);

  // Handle Square Selection
  const handleSquareClick = async (sq: Square) => {
    if (manager.isBusy() && settings.animationLevel !== 'Off') return;
    if (manager.getStatus().isGameOver) return;

    // If a square is already selected
    if (selectedSquare) {
      if (selectedSquare === sq) {
        // Deselect
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if target is a legal move
      if (legalMoves.includes(sq)) {
        // Check if pawn promotion
        const movingPiece = boardState.getPieceAtSquare(selectedSquare);
        const targetRank = parseInt(sq[1], 10);
        const isPromotion =
          movingPiece?.type === 'P' &&
          ((movingPiece.color === 'w' && targetRank === 8) ||
            (movingPiece.color === 'b' && targetRank === 1));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: sq });
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        // Normal Move
        setSelectedSquare(null);
        setLegalMoves([]);
        await manager.playMove(selectedSquare, sq);
        return;
      }
    }

    // Select new square if it belongs to current player's piece
    const piece = boardState.getPieceAtSquare(sq);
    if (piece && piece.color === turn) {
      // In PvAI mode, verify human is moving their own color
      if (
        manager.getConfig().mode === 'pv-ai' &&
        piece.color !== manager.getConfig().playerColor
      ) {
        return;
      }
      setSelectedSquare(sq);
      const moves = manager.getGame().getLegalMovesForSquare(sq);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handlePieceDrop = async (from: Square, to: Square) => {
    if (manager.isBusy() && settings.animationLevel !== 'Off') return;

    const movingPiece = boardState.getPieceAtSquare(from);
    const targetRank = parseInt(to[1], 10);
    const isPromotion =
      movingPiece?.type === 'P' &&
      ((movingPiece.color === 'w' && targetRank === 8) ||
        (movingPiece.color === 'b' && targetRank === 1));

    if (isPromotion && manager.getGame().isLegalMove(from, to, 'Q')) {
      setPendingPromotion({ from, to });
      return;
    }

    setSelectedSquare(null);
    setLegalMoves([]);
    await manager.playMove(from, to);
  };

  const handlePromotionSelect = async (piece: PieceSymbol) => {
    if (pendingPromotion) {
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);
      await manager.playMove(from, to, piece);
    }
  };

  const handleFlip = () => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  };

  const status = manager.getStatus();
  const config = manager.getConfig();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Top Bar */}
      <header className="flex items-center justify-between py-2 px-3 bg-slate-900/80 border border-slate-800 rounded-2xl mb-3 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onMainMenu}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Main Menu"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
                {config.mode === 'pv-ai' ? `vs AI (${config.aiTier})` : 'Player vs Friend'}
              </span>
              {isThinking && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full animate-pulse border border-amber-500/40">
                  <Bot className="w-3 h-3 animate-spin" />
                  Calculating...
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Turn: {turn === 'w' ? 'White' : 'Black'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Draw Offer Notification Banner */}
      {drawOfferedBy && (
        <div className="w-full mb-3 p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-center justify-between animate-popIn">
          <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
            {drawOfferedBy === 'w' ? 'White' : 'Black'} offered a draw. Accept?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setDrawOfferedBy(null);
                await manager.acceptDraw();
              }}
              className="py-1 px-3 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-amber-400"
            >
              Accept
            </button>
            <button
              onClick={() => setDrawOfferedBy(null)}
              className="py-1 px-3 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold uppercase hover:bg-slate-700"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Main Play Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column / Main Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Captured Pieces (Opponent) */}
          <div className="w-full max-w-[620px] mb-2">
            <CapturedTray history={history} />
          </div>

          {/* Chess Board */}
          <Board
            state={boardState}
            orientation={orientation}
            legalMoves={legalMoves}
            selectedSquare={selectedSquare}
            lastMove={lastMove}
            checkedKingSquare={checkedKingSquare}
            currentAnimation={currentAnimation}
            isInteractive={!manager.isBusy() && !status.isGameOver}
            onSquareClick={handleSquareClick}
            onPieceDrop={handlePieceDrop}
            onAnimationSkip={() => globalAnimationManager.skip()}
          />

          {/* Control Actions Bar */}
          <div className="w-full max-w-[620px] grid grid-cols-5 gap-2 mt-3">
            <button
              onClick={() => manager.undo()}
              disabled={history.length === 0 || manager.isBusy() || status.isGameOver}
              className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Undo move"
            >
              <Undo2 className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Undo</span>
            </button>

            <button
              onClick={handleFlip}
              className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all"
              title="Flip Board View"
            >
              <Repeat className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Flip</span>
            </button>

            <button
              onClick={() => manager.offerDraw(turn)}
              disabled={manager.isBusy() || status.isGameOver}
              className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-all"
              title="Offer Draw"
            >
              <Handshake className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Draw</span>
            </button>

            <button
              onClick={() => manager.resign(turn)}
              disabled={manager.isBusy() || status.isGameOver}
              className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-rose-950/40 hover:border-rose-800 text-rose-400 disabled:opacity-30 transition-all"
              title="Resign"
            >
              <Flag className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Resign</span>
            </button>

            <button
              onClick={() => manager.startNewGame()}
              className="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-400 transition-all"
              title="Restart Game"
            >
              <RotateCcw className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Restart</span>
            </button>
          </div>
        </div>

        {/* Right Column / Move List & Analysis */}
        <div className="lg:col-span-4 h-[350px] lg:h-[620px] w-full flex flex-col">
          <MoveList
            history={history}
            currentMoveIndex={history.length - 1}
            onSelectMove={(idx) => {
              // View past move snapshot
            }}
          />
        </div>
      </div>

      {/* Promotion Picker Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={turn}
          onSelect={handlePromotionSelect}
        />
      )}

      {/* Victory / Defeat Modal */}
      {showGameOverModal && (
        <VictoryDefeatModal
          winner={status.winner}
          drawReason={status.drawReason}
          isCheckmate={status.isCheckmate}
          onRematch={async () => {
            setShowGameOverModal(false);
            await manager.startNewGame();
          }}
          onReview={() => setShowGameOverModal(false)}
          onMainMenu={onMainMenu}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdate={onUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
