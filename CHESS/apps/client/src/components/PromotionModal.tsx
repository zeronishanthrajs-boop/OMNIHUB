import React from 'react';
import { PieceSymbol, Color } from '@cinematic-chess/shared-types';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  color: Color;
  onSelect: (piece: PieceSymbol) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect }) => {
  const pieces: PieceSymbol[] = ['Q', 'R', 'B', 'N'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-sm w-full mx-4 text-center">
        <h3 className="text-lg font-bold text-amber-300 uppercase tracking-widest mb-1">
          Promote Pawn
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Choose a piece for transfiguration
        </p>

        <div className="grid grid-cols-4 gap-3">
          {pieces.map((p) => (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 transition-all transform hover:scale-105 group"
            >
              <div className="w-12 h-12 mb-2 group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                <ChessPiece type={p} color={color} />
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300">
                {p === 'Q' ? 'Queen' : p === 'R' ? 'Rook' : p === 'B' ? 'Bishop' : 'Knight'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
