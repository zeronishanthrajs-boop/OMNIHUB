import React, { useEffect, useRef } from 'react';
import { ActiveAnimationState } from './animationManager';
import { PieceSymbol, Square } from '@cinematic-chess/shared-types';
import { globalParticleEngine } from './particleEngine';

interface BattleEffectsProps {
  animation: ActiveAnimationState | null;
  onSkip?: () => void;
  boardOrientation: 'white' | 'black';
}

function squareToPercentage(sq: Square, orientation: 'white' | 'black'): { x: number; y: number } {
  const file = sq.charCodeAt(0) - 97; // 0..7 (a..h)
  const rank = parseInt(sq[1], 10) - 1; // 0..7 (1..8)

  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;

  // Center of square in percentage
  const x = (col + 0.5) * 12.5;
  const y = (row + 0.5) * 12.5;

  return { x, y };
}

export const BattleEffectsOverlay: React.FC<BattleEffectsProps> = ({
  animation,
  onSkip,
  boardOrientation
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      globalParticleEngine.setCanvas(canvas);
    }
    return () => {
      globalParticleEngine.clear();
    };
  }, []);

  // Trigger particle burst on capture or checkmate
  useEffect(() => {
    if (!animation) {
      burstTriggeredRef.current = null;
      return;
    }

    const eventKey = `${animation.event.uci}_${animation.event.type}_${animation.progress > 0.3}`;
    if (burstTriggeredRef.current === eventKey) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (animation.isCaptureSequence && animation.targetSquare && animation.progress >= 0.2) {
      burstTriggeredRef.current = eventKey;
      const { x, y } = squareToPercentage(animation.targetSquare, boardOrientation);
      const pxX = (x / 100) * canvas.width;
      const pxY = (y / 100) * canvas.height;
      globalParticleEngine.spawnCaptureBurst(pxX, pxY, animation.attackerPiece);
    } else if (animation.isCheckmateSequence && animation.progress >= 0.2) {
      burstTriggeredRef.current = eventKey;
      globalParticleEngine.spawnVictoryEmbers(canvas.width, canvas.height);
    }
  }, [animation, boardOrientation]);

  if (!animation) {
    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30 w-full h-full"
      />
    );
  }

  const {
    isCheckSequence,
    isCheckmateSequence,
    isPromotionSequence,
    isCaptureSequence,
    attackerPiece,
    progress,
    checkRay,
    kingSquare
  } = animation;

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-40 overflow-hidden"
      onClick={onSkip}
    >
      {/* Particle Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30 w-full h-full"
      />

      {/* Check Threat Laser Ray */}
      {checkRay && !isCheckmateSequence && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="1" />
            </linearGradient>
            <filter id="laserGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {(() => {
            const start = squareToPercentage(checkRay.from, boardOrientation);
            const end = squareToPercentage(checkRay.to, boardOrientation);
            return (
              <g filter="url(#laserGlow)">
                {/* Outer pulsing threat line */}
                <line
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke="url(#laserGrad)"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                />
                {/* Inner bright laser core */}
                <line
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* King Danger Target Ring */}
                <circle
                  cx={`${end.x}%`}
                  cy={`${end.y}%`}
                  r="5%"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  className="animate-ping"
                  style={{ transformOrigin: `${end.x}% ${end.y}%` }}
                />
              </g>
            );
          })()}
        </svg>
      )}

      {/* 1. Checkmate Cinematic Overlay (Tier C) */}
      {isCheckmateSequence && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 backdrop-blur-sm animate-fadeIn z-50">
          {/* Radial Spotlight vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.85)_80%)]" />

          {/* Surrounding Army Battle Auras */}
          <div className="absolute inset-0 pointer-events-none">
            {animation.surroundingAttackers.map((sq) => {
              const pos = squareToPercentage(sq, boardOrientation);
              return (
                <div
                  key={sq}
                  className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 border-amber-400 bg-amber-500/20 animate-ping"
                  style={{
                    top: `${pos.y}%`,
                    left: `${pos.x}%`,
                    animationDuration: '1.4s'
                  }}
                />
              );
            })}
          </div>

          {/* Checkmate Dramatic Typography */}
          <div className="relative z-10 text-center transform transition-all scale-105">
            <div className="text-xs uppercase tracking-[0.4em] text-amber-400 font-bold mb-2 animate-pulse">
              Decisive Battle Victory
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-[0_8px_25px_rgba(234,179,8,0.7)] tracking-widest uppercase">
              Checkmate
            </h1>
            <div className="mt-4 text-sm text-amber-200/90 font-mono tracking-widest">
              {animation.event.color === 'w' ? 'WHITE FORCES PREVAIL' : 'BLACK FORCES PREVAIL'}
            </div>
          </div>

          {/* Tap to skip prompt */}
          <div className="absolute bottom-6 text-xs text-amber-300/60 uppercase tracking-widest">
            Tap anywhere to continue
          </div>
        </div>
      )}

      {/* 2. Tactical Check Sequence Overlay (Tier B) */}
      {isCheckSequence && !isCheckmateSequence && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
          {/* Crimson screen edge flash */}
          <div className="absolute inset-0 ring-8 ring-inset ring-red-500/50 animate-pulse" />
          <div className="px-6 py-2 bg-gradient-to-r from-red-600/95 to-rose-700/95 border border-red-400 rounded-full shadow-[0_0_35px_rgba(239,68,68,0.9)] transform -translate-y-12 animate-bounce">
            <span className="text-white font-extrabold tracking-widest text-lg uppercase drop-shadow-md">
              Check!
            </span>
          </div>
        </div>
      )}

      {/* 3. Promotion Sequence Overlay (Tier B) */}
      {isPromotionSequence && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
          <div className="w-24 h-24 rounded-full border-4 border-cyan-400 bg-cyan-500/30 animate-spin" />
          <div className="absolute text-cyan-300 font-bold tracking-widest text-sm uppercase animate-pulse">
            Pawn Transfigured
          </div>
        </div>
      )}

      {/* 4. Per-Piece Capture Strike VFX (Tier A & B) */}
      {isCaptureSequence && (
        <CaptureStrikeVFX attackerPiece={attackerPiece} progress={progress} />
      )}
    </div>
  );
};

interface CaptureStrikeProps {
  attackerPiece: PieceSymbol;
  progress: number;
}

const CaptureStrikeVFX: React.FC<CaptureStrikeProps> = ({ attackerPiece, progress }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
      {attackerPiece === 'P' && (
        <div
          className="w-48 h-1.5 bg-amber-400 rotate-45 transform origin-center shadow-[0_0_15px_rgba(251,191,36,1)] transition-opacity duration-200"
          style={{ opacity: 1 - progress }}
        />
      )}

      {attackerPiece === 'N' && (
        <div
          className="w-32 h-32 rounded-full border-4 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.8)] transform scale-125 transition-transform"
          style={{ opacity: 1 - progress }}
        />
      )}

      {attackerPiece === 'B' && (
        <div
          className="w-56 h-2 bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 -rotate-45 shadow-[0_0_20px_rgba(168,85,247,0.9)]"
          style={{ opacity: 1 - progress }}
        />
      )}

      {attackerPiece === 'R' && (
        <div
          className="w-40 h-40 border-8 border-orange-500/80 bg-orange-600/20 shadow-[0_0_35px_rgba(249,115,22,0.9)] rounded-lg rotate-12"
          style={{ opacity: 1 - progress }}
        />
      )}

      {attackerPiece === 'Q' && (
        <div
          className="w-48 h-48 rounded-full border-4 border-yellow-300 bg-gradient-to-r from-amber-400/40 to-yellow-200/40 shadow-[0_0_40px_rgba(250,204,21,1)] animate-ping"
          style={{ opacity: 1 - progress }}
        />
      )}
    </div>
  );
};
