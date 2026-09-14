import React from 'react';
import { PieceSymbol, Color, GameEvent } from '@cinematic-chess/shared-types';
import { ChessPiece } from './ChessPiece';

interface CapturedTrayProps {
  history: GameEvent[];
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 0
};

export const CapturedTray: React.FC<CapturedTrayProps> = ({ history }) => {
  const whiteCaptures: PieceSymbol[] = []; // Black pieces captured by White
  const blackCaptures: PieceSymbol[] = []; // White pieces captured by Black

  for (const ev of history) {
    if (ev.capture) {
      if (ev.color === 'w') {
        whiteCaptures.push(ev.capture.piece);
      } else {
        blackCaptures.push(ev.capture.piece);
      }
    }
  }

  // Calculate material difference
  const whiteScore = whiteCaptures.reduce((acc, p) => acc + PIECE_VALUES[p], 0);
  const blackScore = blackCaptures.reduce((acc, p) => acc + PIECE_VALUES[p], 0);
  const diff = whiteScore - blackScore;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top: Black side captures */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {blackCaptures.map((p, idx) => (
            <div key={idx} className="w-5 h-5 flex-shrink-0">
              <ChessPiece type={p} color="w" />
            </div>
          ))}
          {blackCaptures.length === 0 && (
            <span className="text-slate-600 italic text-[11px]">No captures</span>
          )}
        </div>
        {diff < 0 && (
          <span className="ml-2 font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800 text-[11px]">
            +{Math.abs(diff)}
          </span>
        )}
      </div>

      {/* Bottom: White side captures */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {whiteCaptures.map((p, idx) => (
            <div key={idx} className="w-5 h-5 flex-shrink-0">
              <ChessPiece type={p} color="b" />
            </div>
          ))}
          {whiteCaptures.length === 0 && (
            <span className="text-slate-600 italic text-[11px]">No captures</span>
          )}
        </div>
        {diff > 0 && (
          <span className="ml-2 font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800 text-[11px]">
            +{diff}
          </span>
        )}
      </div>
    </div>
  );
};
