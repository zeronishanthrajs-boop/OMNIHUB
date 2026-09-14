import React from 'react';
import { X, Shield, Swords, Sparkles, BookOpen } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
              How to Play & Features
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h3 className="font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> 100% Legal FIDE Rules
            </h3>
            <p className="text-slate-400">
              Complete implementation of international chess rules: castling (both wings), en passant captures, pawn promotion to any piece, and all draw conditions (threefold repetition, 50-move rule, insufficient material, and stalemate).
            </p>
          </div>

          <div>
            <h3 className="font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" /> Stockfish UCI Intelligence
            </h3>
            <p className="text-slate-400">
              7 strictly calibrated AI tiers from Beginner (~1320 ELO) up to Grandmaster Ultimate (~3190+ ELO). Every move is derived through pure UCI search without hidden-info access.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 3-Tier Cinematic System
            </h3>
            <p className="text-slate-400">
              • <strong>Tier A (Micro):</strong> Fluid movement and piece-specific capture identities.<br />
              • <strong>Tier B (Tactical):</strong> Dynamic check pulses, queen strikes, and pawn transfigurations.<br />
              • <strong>Tier C (Cinematic):</strong> The battlefield checkmate sequence where allied forces surround the defeated King.
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400">
            <strong>Tip:</strong> Tap anywhere on the board during any cinematic sequence to skip directly to the next move. Adjust Animation Level in Settings at any time!
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
