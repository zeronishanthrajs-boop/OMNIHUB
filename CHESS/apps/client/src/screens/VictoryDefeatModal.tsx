import React from 'react';
import { Color, DrawReason } from '@cinematic-chess/shared-types';
import { Trophy, RotateCcw, Eye, Home } from 'lucide-react';

interface VictoryDefeatModalProps {
  winner?: Color | 'draw';
  drawReason?: DrawReason;
  isCheckmate?: boolean;
  onRematch: () => void;
  onReview: () => void;
  onMainMenu: () => void;
}

export const VictoryDefeatModal: React.FC<VictoryDefeatModalProps> = ({
  winner,
  drawReason,
  isCheckmate,
  onRematch,
  onReview,
  onMainMenu
}) => {
  const isDraw = winner === 'draw';
  const isWhiteWin = winner === 'w';

  let title = 'Game Concluded';
  if (isDraw) {
    title = 'Draw';
  } else if (isWhiteWin) {
    title = 'White Victory!';
  } else if (winner === 'b') {
    title = 'Black Victory!';
  }

  let subtitle = '';
  if (isCheckmate) {
    subtitle = 'Victory achieved by decisive Checkmate';
  } else if (drawReason === 'stalemate') {
    subtitle = 'Match ended in Stalemate';
  } else if (drawReason === 'threefold-repetition') {
    subtitle = 'Drawn by Threefold Repetition';
  } else if (drawReason === 'fifty-move-rule') {
    subtitle = 'Drawn by Fifty-Move Rule';
  } else if (drawReason === 'insufficient-material') {
    subtitle = 'Drawn due to Insufficient Material';
  } else if (drawReason === 'agreement') {
    subtitle = 'Drawn by mutual agreement';
  } else {
    subtitle = 'Opponent Resigned';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center">
        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mb-2">
          {title}
        </h2>
        <p className="text-xs text-slate-400 font-medium mb-8">
          {subtitle}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRematch}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg transition-transform transform hover:-translate-y-0.5"
          >
            <RotateCcw className="w-4 h-4" />
            Rematch
          </button>

          <button
            onClick={onReview}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Review Moves
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
