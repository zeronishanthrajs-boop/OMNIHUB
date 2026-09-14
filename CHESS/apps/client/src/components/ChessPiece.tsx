import React from 'react';
import { PieceSymbol, Color } from '@cinematic-chess/shared-types';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
  isMoving?: boolean;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  type,
  color,
  className = 'w-full h-full',
  isMoving = false
}) => {
  const isWhite = color === 'w';

  // Crisp SVG piece symbols with high-contrast outlines and gradients
  return (
    <div
      className={`relative select-none flex items-center justify-center transition-transform duration-150 ${
        isMoving ? 'scale-110 drop-shadow-2xl z-20' : 'hover:scale-105'
      } ${className}`}
    >
      <svg
        viewBox="0 0 45 45"
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
      >
        <g
          style={{
            fill: isWhite ? '#ffffff' : '#1e293b',
            fillOpacity: 1,
            fillRule: 'evenodd',
            stroke: isWhite ? '#0f172a' : '#f8fafc',
            strokeWidth: 1.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          }}
        >
          {type === 'P' && (
            <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" />
          )}

          {type === 'N' && (
            <path d="m 22,10 c 10.5,1 16.5,8 16,29 l -23,0 c 0,-9 10,-6.5 8,-21 m -4,5 c 3,4 6,2 6,2 m -10,3 c 2,3 4,1 4,1 m -4,4 c 1.5,2 3,1 3,1 m -5.5,-12.5 c 2,-3 5,-2 5,-2 c -1.5,-2.5 -5,-2 -5,-2 m -4.5,11 c 1,-1.5 2.5,-1 2.5,-1 c -1.5,-2 -4,-1.5 -4,-1.5 m 2.5,8.5 c 0.5,-1.5 1.5,-1 1.5,-1 c -1,-1.5 -3,-1 -3,-1" />
          )}

          {type === 'B' && (
            <g>
              <path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.97 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.03 -13.5,1 -1.35,0.49 -2.32,0.47 -3,-0.5 1.35,-1.46 3,-2 3,-2 z" />
              <path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z" />
              <path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z" />
              <path d="m 17.5,26 h 10 M 15,30 h 15 m -7.5,-14 v 5 m -3,-2.5 h 6" />
            </g>
          )}

          {type === 'R' && (
            <g>
              <path d="m 9,39 h 27 v -3 H 9 v 3 z m 3,-3 v -4 h 21 v 4 H 12 z m -1,-22 h 23 v 4 H 11 v -4 z m 1,4 v 14 h 21 V 18 H 12 z m -3,-7 h 4 v 4 H 9 v -4 z m 7,0 h 3 v 4 h -3 v -4 z m 6,0 h 3 v 4 h -3 v -4 z m 6,0 h 4 v 4 h -4 v -4 z" />
              <path d="m 14,29.5 h 17 M 14,16.5 h 17" />
            </g>
          )}

          {type === 'Q' && (
            <g>
              <path d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,11 -4,-15 -4.5,15 -4.5,-15 -4,15 -7,-11 2,12 z" />
              <path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1.5,2.5 -1.5,2.5 -1.5,1.5 0.5,2.5 0.5,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0.5,-2.5 0,0 -0.5,-1.5 -1.5,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z" />
              <circle cx="6" cy="12" r="2" />
              <circle cx="14" cy="9" r="2" />
              <circle cx="22.5" cy="8" r="2" />
              <circle cx="31" cy="9" r="2" />
              <circle cx="39" cy="12" r="2" />
            </g>
          )}

          {type === 'K' && (
            <g>
              <path d="m 22.5,11.63 v 6 M 20,13.5 h 5" />
              <path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 0,0 -1,-2.5 -3,-2.5 -2,0 -3,2.5 -3,2.5 -1.5,3 3,10.5 3,10.5" />
              <path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-4 -8,-4 -8,-4 -3.5,2.5 -6,2.5 -8,0 0,0 -4,0 -8,4 -3,6 6,10.5 6,10.5 v 7 z" />
              <path d="m 11.5,30 c 5.5,-2 15.5,-2 21,0 m -21,3.5 c 5.5,-2 15.5,-2 21,0 m -21,3.5 c 5.5,-2 15.5,-2 21,0" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
