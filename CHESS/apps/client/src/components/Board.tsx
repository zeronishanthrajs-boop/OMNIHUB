import React, { useState } from 'react';
import { Square, Color, PieceSymbol } from '@cinematic-chess/shared-types';
import { BoardState, indexToSquare, squareToIndex } from '@cinematic-chess/chess-core';
import { ChessPiece } from './ChessPiece';
import { BattleEffectsOverlay } from '../animation/battleEffects';
import { ActiveAnimationState } from '../animation/animationManager';

interface BoardProps {
  state: BoardState;
  orientation: 'white' | 'black';
  legalMoves: Square[];
  selectedSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
  checkedKingSquare: Square | null;
  currentAnimation: ActiveAnimationState | null;
  isInteractive: boolean;
  onSquareClick: (square: Square) => void;
  onPieceDrop?: (from: Square, to: Square) => void;
  onAnimationSkip?: () => void;
}

export const Board: React.FC<BoardProps> = ({
  state,
  orientation,
  legalMoves,
  selectedSquare,
  lastMove,
  checkedKingSquare,
  currentAnimation,
  isInteractive,
  onSquareClick,
  onPieceDrop,
  onAnimationSkip
}) => {
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const files = orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  const handleDragStart = (sq: Square, e: React.DragEvent) => {
    if (!isInteractive) return;
    setDraggedSquare(sq);
    e.dataTransfer.setData('text/plain', sq);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (sq: Square, e: React.DragEvent) => {
    e.preventDefault();
    const fromSq = (e.dataTransfer.getData('text/plain') || draggedSquare) as Square | null;
    setDraggedSquare(null);
    if (fromSq && fromSq !== sq && onPieceDrop) {
      onPieceDrop(fromSq, sq);
    }
  };

  // Screen shake transform calculation
  let shakeStyle: React.CSSProperties = {};
  if (currentAnimation && currentAnimation.shakeIntensity > 0 && currentAnimation.progress < 0.6) {
    const intensity = currentAnimation.shakeIntensity;
    const factor = 1 - currentAnimation.progress / 0.6;
    const ox = Math.sin(currentAnimation.progress * 30) * intensity * 2.5 * factor;
    const oy = Math.cos(currentAnimation.progress * 25) * intensity * 2.5 * factor;
    shakeStyle = { transform: `translate3d(${ox}px, ${oy}px, 0)` };
  }

  // Check if moving piece is actively in flight
  const isMovingPieceInFlight =
    currentAnimation &&
    currentAnimation.sourceSquare &&
    currentAnimation.targetSquare &&
    currentAnimation.progress < 0.95;

  return (
    <div
      style={shakeStyle}
      className="relative aspect-square w-full max-w-[620px] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-slate-700/60 overflow-hidden select-none bg-slate-900 transition-transform duration-75"
    >
      {/* 8x8 Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank) =>
          files.map((file) => {
            const sq = `${file}${rank}` as Square;
            const sqIdx = squareToIndex(sq);
            const piece = state.getPiece(sqIdx);

            const fileIdx = file.charCodeAt(0) - 97;
            const rankIdx = rank - 1;
            const isDark = (fileIdx + rankIdx) % 2 === 0;

            const isSelected = selectedSquare === sq;
            const isLegalTarget = legalMoves.includes(sq);
            const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isCheckedKing = checkedKingSquare === sq;

            // Hide arriving piece on target square until flight completes
            const hidePieceDuringFlight =
              isMovingPieceInFlight && sq === currentAnimation?.targetSquare;

            // Square styling
            let bgClasses = isDark
              ? 'bg-slate-700 hover:bg-slate-600/80 text-slate-400'
              : 'bg-slate-200 hover:bg-white/90 text-slate-600';

            if (isLastMoveSquare) {
              bgClasses = isDark ? 'bg-amber-800/60 text-amber-200' : 'bg-amber-200 text-amber-800';
            }
            if (isSelected) {
              bgClasses = 'bg-yellow-400/80 text-black';
            }
            if (isCheckedKing) {
              bgClasses = 'bg-rose-600/90 text-white animate-pulse';
            }

            return (
              <div
                key={sq}
                className={`relative flex items-center justify-center transition-colors duration-150 cursor-pointer ${bgClasses}`}
                onClick={() => onSquareClick(sq)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(sq, e)}
              >
                {/* Coordinates labels */}
                {file === files[0] && (
                  <span className="absolute top-1 left-1 text-[10px] font-bold opacity-60 leading-none">
                    {rank}
                  </span>
                )}
                {rank === ranks[7] && (
                  <span className="absolute bottom-1 right-1 text-[10px] font-bold opacity-60 leading-none">
                    {file}
                  </span>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    {piece ? (
                      // Capture ring
                      <div className="w-full h-full border-4 border-amber-400/80 rounded-sm animate-pulse" />
                    ) : (
                      // Empty square move dot
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-900/40 border border-amber-300/80 shadow-md" />
                    )}
                  </div>
                )}

                {/* Piece on board */}
                {piece && !hidePieceDuringFlight && (
                  <div
                    draggable={isInteractive && piece.color === state.turn}
                    onDragStart={(e) => handleDragStart(sq, e)}
                    className="w-[82%] h-[82%] flex items-center justify-center cursor-grab active:cursor-grabbing"
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Actively Gliding / Leaping Moving Piece */}
      {isMovingPieceInFlight && (() => {
        const fromSq = currentAnimation!.sourceSquare!;
        const toSq = currentAnimation!.targetSquare!;

        const fromFile = fromSq.charCodeAt(0) - 97;
        const fromRank = parseInt(fromSq[1], 10) - 1;
        const toFile = toSq.charCodeAt(0) - 97;
        const toRank = parseInt(toSq[1], 10) - 1;

        const fromCol = orientation === 'white' ? fromFile : 7 - fromFile;
        const fromRow = orientation === 'white' ? 7 - fromRank : fromRank;
        const toCol = orientation === 'white' ? toFile : 7 - toFile;
        const toRow = orientation === 'white' ? 7 - toRank : toRank;

        const p = currentAnimation!.progress;
        // Cubic easing for smooth arrival
        const eased = 1 - Math.pow(1 - p, 3);

        const currentX = (fromCol + (toCol - fromCol) * eased) * 12.5;
        const currentY = (fromRow + (toRow - fromRow) * eased) * 12.5;

        // Knight Parabolic 3D Leap Arc
        let leapY = 0;
        let scale = 1;
        if (currentAnimation!.attackerPiece === 'N') {
          leapY = Math.sin(p * Math.PI) * -36;
          scale = 1 + Math.sin(p * Math.PI) * 0.2;
        }

        return (
          <div
            className="absolute w-[12.5%] h-[12.5%] pointer-events-none z-30 flex items-center justify-center"
            style={{
              left: `${currentX}%`,
              top: `${currentY}%`,
              transform: `translate3d(0, ${leapY}px, 0) scale(${scale})`
            }}
          >
            <div className="w-[82%] h-[82%] drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
              <ChessPiece
                type={currentAnimation!.attackerPiece}
                color={currentAnimation!.event.color}
                isMoving={true}
              />
            </div>
          </div>
        );
      })()}

      {/* Battle Effects, Particles, and Cinematics Overlay */}
      <BattleEffectsOverlay
        animation={currentAnimation}
        onSkip={onAnimationSkip}
        boardOrientation={orientation}
      />
    </div>
  );
};
