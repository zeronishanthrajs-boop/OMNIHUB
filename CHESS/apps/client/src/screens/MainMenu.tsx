import React from 'react';
import { Swords, Users, Settings as SettingsIcon, BookOpen, Flame } from 'lucide-react';

interface MainMenuProps {
  onStartPvAI: () => void;
  onStartPvP: () => void;
  onStartPuzzles: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartPvAI,
  onStartPvP,
  onStartPuzzles,
  onOpenSettings,
  onOpenHowToPlay
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 text-center">
      {/* Title & Slogan */}
      <div className="mb-10 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs tracking-widest uppercase mb-4">
          <Swords className="w-3.5 h-3.5" />
          Tactical Battle Engine
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 drop-shadow-[0_4px_20px_rgba(245,158,11,0.4)]">
          CINEMATIC CHESS
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 font-light tracking-wide italic">
          "Chess that feels like a battle. Every move has a consequence."
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3.5 w-full max-w-xs sm:max-w-sm">
        <button
          onClick={onStartPvAI}
          className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.6)] transform hover:-translate-y-0.5 transition-all"
        >
          <Swords className="w-5 h-5" />
          Play vs AI Opponent
        </button>

        <button
          onClick={onStartPvP}
          className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold text-sm uppercase tracking-wider shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          <Users className="w-5 h-5" />
          Play vs Friend (Local)
        </button>

        <button
          onClick={onStartPuzzles}
          className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/70 hover:to-indigo-800/70 border border-purple-500/50 hover:border-purple-400 text-purple-200 font-bold text-sm uppercase tracking-wider shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          <Flame className="w-5 h-5 text-amber-400" />
          Tactical Puzzles
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center justify-center gap-3 w-full py-3 px-6 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-slate-200 font-semibold text-xs uppercase tracking-wider transition-all"
        >
          <SettingsIcon className="w-4 h-4" />
          Settings & Animations
        </button>

        <button
          onClick={onOpenHowToPlay}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-6 text-slate-500 hover:text-amber-300 text-xs uppercase tracking-widest font-semibold transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          How to Play & Rules
        </button>
      </div>
    </div>
  );
};
