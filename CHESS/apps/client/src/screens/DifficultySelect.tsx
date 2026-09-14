import React, { useState } from 'react';
import { AIDifficultyTier, Color } from '@cinematic-chess/shared-types';
import { AI_TIER_CONFIGS } from '../ai/aiConfig';
import { ArrowLeft, Play, Shield, Zap, Skull, Crown } from 'lucide-react';

interface DifficultySelectProps {
  onStartMatch: (tier: AIDifficultyTier, playerColor: Color) => void;
  onBack: () => void;
}

export const DifficultySelect: React.FC<DifficultySelectProps> = ({
  onStartMatch,
  onBack
}) => {
  const [selectedTier, setSelectedTier] = useState<AIDifficultyTier>('Medium');
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>('w');

  const tiers: AIDifficultyTier[] = [
    'Beginner',
    'Easy',
    'Medium',
    'Hard',
    'Expert',
    'Master',
    'Ultimate'
  ];

  const handleStart = () => {
    let finalColor: Color = 'w';
    if (selectedColor === 'random') {
      finalColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      finalColor = selectedColor;
    }
    onStartMatch(selectedTier, finalColor);
  };

  const getTierIcon = (tier: AIDifficultyTier) => {
    switch (tier) {
      case 'Beginner':
      case 'Easy':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'Medium':
      case 'Hard':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Expert':
      case 'Master':
        return <Skull className="w-4 h-4 text-rose-400" />;
      case 'Ultimate':
        return <Crown className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-wider py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-200">
          Select AI Difficulty
        </h2>
        <div className="w-16" />
      </div>

      {/* Difficulty Ladder (7 tiers) */}
      <div className="flex flex-col gap-2.5 w-full mb-8">
        {tiers.map((t) => {
          const cfg = AI_TIER_CONFIGS[t];
          const isSelected = selectedTier === t;

          return (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
                  {getTierIcon(t)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                      {cfg.label}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      ~{cfg.uciElo} ELO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                    {cfg.description}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-400 hidden sm:block">
                <div>Depth: {cfg.depth} ply</div>
                <div>Time: {cfg.movetimeMs}ms</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Choose Color */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
          Play as:
        </span>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedColor('w')}
            className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
              selectedColor === 'w'
                ? 'bg-white text-slate-950 border-white shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            White
          </button>
          <button
            onClick={() => setSelectedColor('random')}
            className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
              selectedColor === 'random'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Random
          </button>
          <button
            onClick={() => setSelectedColor('b')}
            className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
              selectedColor === 'b'
                ? 'bg-slate-950 text-white border-slate-600 shadow-md ring-1 ring-white/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Black
          </button>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5 transition-all"
      >
        <Play className="w-5 h-5 fill-current" />
        Commence Battle ({selectedTier})
      </button>
    </div>
  );
};
