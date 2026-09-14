import React, { useEffect, useRef } from 'react';
import { GameEvent } from '@cinematic-chess/shared-types';

interface MoveListProps {
  history: GameEvent[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
}

export const MoveList: React.FC<MoveListProps> = ({
  history,
  currentMoveIndex,
  onSelectMove
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (White, Black)
  const movePairs: { num: number; white?: GameEvent; black?: GameEvent }[] = [];
  for (let i = 0; i < history.length; i++) {
    const pairIndex = Math.floor(i / 2);
    if (!movePairs[pairIndex]) {
      movePairs[pairIndex] = { num: pairIndex + 1 };
    }
    if (i % 2 === 0) {
      movePairs[pairIndex].white = history[i];
    } else {
      movePairs[pairIndex].black = history[i];
    }
  }

  // Auto-scroll on new move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest font-bold text-slate-300">
          Move Record
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {history.length} ply
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm"
      >
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
            No moves yet. Make your first move!
          </div>
        ) : (
          movePairs.map((pair, pIdx) => {
            const whiteIdx = pIdx * 2;
            const blackIdx = pIdx * 2 + 1;

            const isWhiteActive = currentMoveIndex === whiteIdx;
            const isBlackActive = currentMoveIndex === blackIdx;

            return (
              <div
                key={pair.num}
                className="grid grid-cols-12 items-center py-1 px-2 rounded-md hover:bg-slate-800/50 text-xs"
              >
                {/* Move Number */}
                <span className="col-span-2 text-slate-500 font-semibold">
                  {pair.num}.
                </span>

                {/* White Move */}
                <button
                  onClick={() => onSelectMove(whiteIdx)}
                  className={`col-span-5 text-left px-2 py-0.5 rounded font-medium transition-colors ${
                    isWhiteActive
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {pair.white?.san || ''}
                </button>

                {/* Black Move */}
                {pair.black ? (
                  <button
                    onClick={() => onSelectMove(blackIdx)}
                    className={`col-span-5 text-left px-2 py-0.5 rounded font-medium transition-colors ${
                      isBlackActive
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {pair.black.san}
                  </button>
                ) : (
                  <span className="col-span-5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
