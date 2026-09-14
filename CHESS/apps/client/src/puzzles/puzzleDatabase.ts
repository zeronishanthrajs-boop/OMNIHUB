import { Puzzle } from '@cinematic-chess/shared-types';

export const PUZZLE_DATABASE: Puzzle[] = [
  {
    id: 'puz-01',
    title: "Scholar's Finisher",
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    moves: ['h5f7'],
    rating: 800,
    theme: 'mate-in-1',
    description: 'White can deliver an immediate checkmate exploiting the vulnerable f7 square.',
    hint: 'Attack the f7 pawn directly with your Queen.'
  },
  {
    id: 'puz-02',
    title: 'Back-Rank Corridor',
    fen: '6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',
    moves: ['e2e8'],
    rating: 850,
    theme: 'back-rank',
    description: "The enemy king is trapped behind its own shield of pawns. Infiltrate the 8th rank!",
    hint: 'Move your Queen to the back rank.'
  },
  {
    id: 'puz-03',
    title: 'Arabian Net',
    fen: '7k/4R3/5N2/8/8/8/8/6K1 w - - 0 1',
    moves: ['e7h7'],
    rating: 1000,
    theme: 'mate-in-1',
    description: 'The Knight and Rook coordinate to trap the cornered King in an inescapable net.',
    hint: 'Check the king with your Rook on the h-file.'
  },
  {
    id: 'puz-04',
    title: 'The Pin & Snare',
    fen: '4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1',
    moves: ['e2e7'],
    rating: 950,
    theme: 'pin',
    description: 'Black’s Queen is pinned along the open e-file against the King. Strike!',
    hint: 'Capture the pinned Queen with your Rook.'
  },
  {
    id: 'puz-05',
    title: 'Royal Knight Fork',
    fen: 'r3k2r/pppb1ppp/2n5/1B1Np3/4P3/8/PPP2PPP/R3K2R w KQkq - 2 12',
    moves: ['d5c7', 'e8d8', 'c7a8'],
    rating: 1200,
    theme: 'fork',
    description: 'Leap into c7 with your Knight to deliver a simultaneous check on the King and fork the a8 Rook.',
    hint: 'Look for an aggressive jump on the c7 square.'
  },
  {
    id: 'puz-06',
    title: 'Anastasia’s Execution',
    fen: '7k/4N1pp/8/8/8/3B4/7R/6K1 w - - 0 1',
    moves: ['h2h7'],
    rating: 1150,
    theme: 'mate-in-1',
    description: 'White’s Bishop and Knight form an unbreakable barrier, allowing the Rook to deliver the fatal strike on h7.',
    hint: 'Strike the h7 pawn with your Rook, supported by the Bishop.'
  },
  {
    id: 'puz-07',
    title: 'Philidor’s Smothered Legacy',
    fen: '5rk1/5Npp/4Q3/8/8/8/8/4K3 w - - 0 1',
    moves: ['f7h6', 'g8h8', 'e6g8', 'f8g8', 'h6f7'],
    rating: 1500,
    theme: 'mate-in-2',
    description: 'A legendary master sequence: double check, Queen sacrifice, and smothered mate!',
    hint: 'First deliver a double check with your Knight, then sacrifice the Queen.'
  },
  {
    id: 'puz-08',
    title: 'Morphy’s Opera Masterpiece',
    fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1',
    moves: ['b3b8', 'd7b8', 'd1d8'],
    rating: 1650,
    theme: 'sacrifice',
    description: 'Paul Morphy’s immortal Queen sacrifice deflecting the defending knight to deliver back-rank checkmate.',
    hint: 'Sacrifice the Queen on the back rank to deflect the Knight.'
  }
];
