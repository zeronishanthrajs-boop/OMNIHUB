import React from 'react';
import { AnimationLevel, PlayerSettings } from '@cinematic-chess/shared-types';
import { X, Volume2, VolumeX, Clapperboard, Monitor, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  settings: PlayerSettings;
  onUpdate: (newSettings: Partial<PlayerSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose
}) => {
  const levels: { level: AnimationLevel; title: string; desc: string }[] = [
    {
      level: 'Off',
      title: 'Off',
      desc: '0ms instant snap moves. Zero animations for maximum competitive speed.'
    },
    {
      level: 'Minimal',
      title: 'Minimal',
      desc: 'Micro moves only (~200ms). Checks & mates collapse to a 150ms quick flash.'
    },
    {
      level: 'Normal',
      title: 'Normal',
      desc: 'Balanced. Tactical sequence (~900ms) with condensed checkmate sequence.'
    },
    {
      level: 'Cinematic',
      title: 'Cinematic',
      desc: 'Full cinematic battle experience (~3.4s) with army surrounding checkmate.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-100">
              Settings & Customization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Animation Level Section */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
              <Clapperboard className="w-4 h-4" />
              Animation Level (§9.2)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {levels.map(({ level, title, desc }) => {
                const isSelected = settings.animationLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => onUpdate({ animationLevel: level })}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                        {title}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Design Section */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Sound Effects & Audio (§9)
            </label>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">
                  Master Sound FX
                </span>
                <button
                  onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.soundEnabled && (
                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Volume</span>
                    <span>{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => onUpdate({ soundVolume: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Board Orientation */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
              <Monitor className="w-4 h-4" />
              Board Orientation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['white', 'black', 'auto-flip'] as const).map((orient) => (
                <button
                  key={orient}
                  onClick={() => onUpdate({ boardOrientation: orient })}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                    settings.boardOrientation === orient
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {orient === 'white' ? 'White View' : orient === 'black' ? 'Black View' : 'Auto-Flip'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
