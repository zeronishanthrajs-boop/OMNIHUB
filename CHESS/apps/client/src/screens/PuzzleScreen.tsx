import React, { useState, useEffect } from 'react';
import { Square, PieceSymbol, PlayerSettings, GameEvent } from '@cinematic-chess/shared-types';
import { PuzzleManager, PuzzleState } from '../puzzles/puzzleManager';
import { Board } from '../components/Board';
import { PromotionModal } from '../components/PromotionModal';
import { globalAnimationManager, ActiveAnimationState } from '../animation/animationManager';
import { globalSoundSystem } from '../animation/soundSystem';
import {
  ArrowLeft,
  Lightbulb,
  RotateCcw,
  SkipForward,
  Trophy,
  Flame,
  Star,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';

interface PuzzleScreenProps {
  settings: PlayerSettings;
  onMainMenu: () => void;
}

export const PuzzleScreen: React.FC<PuzzleScreenProps> = ({
  settings,
  onMainMenu
}) => {
  const [manager] = useState<PuzzleManager>(() => new PuzzleManager());
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(manager.getState());
  const [boardState, setBoardState] = useState(manager.getGame().getState().clone());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<ActiveAnimationState | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [showHintText, setShowHintText] = useState<boolean>(false);

  // Sync Audio Settings
  useEffect(() => {
    globalSoundSystem.setEnabled(settings.soundEnabled);
    globalSoundSystem.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Wire Presentation Handler
  useEffect(() => {
    manager.setPresentationHandler(async (event: GameEvent) => {
      await globalAnimationManager.playEvent(event, settings.animationLevel);
    });

    const unsubscribeAnim = globalAnimationManager.onAnimationStateChange((anim) => {
      setCurrentAnimation(anim);
    });

    return () => {
      unsubscribeAnim();
    };
  }, [manager, settings.animationLevel]);

  // Subscribe to Puzzle State Changes
  useEffect(() => {
    const unsubscribe = manager.onStateChange((state) => {
      setPuzzleState({ ...state });
      setBoardState(manager.getGame().getState().clone());

      if (state.lastEvent && state.lastEvent.uci) {
        const from = state.lastEvent.uci.slice(0, 2) as Square;
        const to = state.lastEvent.uci.slice(2, 4) as Square;
        setLastMove({ from, to });
      } else {
        setLastMove(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [manager]);

  const handleSquareClick = async (sq: Square) => {
    if (puzzleState.status !== 'playing') return;

    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (legalMoves.includes(sq)) {
        // Check promotion
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

        setSelectedSquare(null);
        setLegalMoves([]);
        await manager.playMove(selectedSquare, sq);
        return;
      }
    }

    const piece = boardState.getPieceAtSquare(sq);
    if (piece && piece.color === boardState.turn) {
      setSelectedSquare(sq);
      const moves = manager.getGame().getLegalMovesForSquare(sq);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handlePieceDrop = async (from: Square, to: Square) => {
    if (puzzleState.status !== 'playing') return;

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

  const { currentPuzzle, status, userRating, streak, hintSquare } = puzzleState;
  const boardOrientation = boardState.turn === 'b' && puzzleState.stepIndex === 0 ? 'black' : 'white';

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 p-3 sm:p-5 max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 px-3 bg-slate-900/80 border border-slate-800 rounded-2xl mb-4 shadow-md">
        <button
          onClick={onMainMenu}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {userRating} ELO
          </div>

          <div className="flex items-center gap-1 text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            {streak} Streak
          </div>
        </div>
      </header>

      {/* Puzzle Info Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/70 border border-slate-800 rounded-2xl mb-4 gap-2 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest font-mono text-amber-400">
              Puzzle {puzzleState.puzzleIndex + 1} of {puzzleState.totalPuzzles}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {currentPuzzle.theme}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {currentPuzzle.rating} ELO
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
            {currentPuzzle.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {boardState.turn === 'w' ? 'White to move and win' : 'Black to move and win'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={() => {
              manager.requestHint();
              setShowHintText(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
            title="Reveal hint"
          >
            <Lightbulb className="w-4 h-4" />
            Hint
          </button>

          <button
            onClick={() => {
              manager.resetCurrentPuzzle();
              setShowHintText(false);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
            title="Restart puzzle"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={() => {
              manager.nextPuzzle();
              setShowHintText(false);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
            title="Skip to next puzzle"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </button>
        </div>
      </div>

      {/* Text Hint Box */}
      {showHintText && (
        <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2 animate-popIn">
          <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span><strong>Hint:</strong> {currentPuzzle.hint}</span>
        </div>
      )}

      {/* Main Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          <Board
            state={boardState}
            orientation={boardOrientation}
            legalMoves={legalMoves}
            selectedSquare={selectedSquare}
            lastMove={lastMove}
            checkedKingSquare={null}
            currentAnimation={currentAnimation}
            isInteractive={status === 'playing'}
            onSquareClick={handleSquareClick}
            onPieceDrop={handlePieceDrop}
            onAnimationSkip={() => globalAnimationManager.skip()}
          />

          {/* Hint Square Aura Highlight */}
          {hintSquare && (
            <div
              className="absolute pointer-events-none border-4 border-amber-400 rounded-lg animate-ping"
              style={{
                width: '12.5%',
                height: '12.5%',
                left: `${(hintSquare.charCodeAt(0) - 97) * 12.5}%`,
                top: `${(8 - parseInt(hintSquare[1], 10)) * 12.5}%`
              }}
            />
          )}
        </div>
      </div>

      {/* Feedback Toast for Incorrect Move */}
      {status === 'failed' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 py-3 px-5 bg-rose-950/90 border border-rose-600 rounded-2xl shadow-2xl animate-bounce z-50">
          <XCircle className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-bold text-rose-100 uppercase tracking-wider">
            Not the best move. Try a different tactic!
          </span>
          <button
            onClick={() => manager.resetCurrentPuzzle()}
            className="py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold uppercase"
          >
            Retry
          </button>
        </div>
      )}

      {/* Puzzle Solved Modal */}
      {status === 'solved' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_20px_60px_rgba(245,158,11,0.4)]">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mb-1">
              Puzzle Solved!
            </h3>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Rating +15 ({userRating})
            </div>

            <p className="text-xs text-slate-300 mb-6 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-left">
              {currentPuzzle.description}
            </p>

            <button
              onClick={() => {
                manager.nextPuzzle();
                setShowHintText(false);
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              Next Challenge
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pawn Promotion Picker */}
      {pendingPromotion && (
        <PromotionModal
          color={boardState.turn}
          onSelect={handlePromotionSelect}
        />
      )}
    </div>
  );
};
