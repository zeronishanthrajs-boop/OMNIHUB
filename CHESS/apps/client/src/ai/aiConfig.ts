import { AIDifficultyTier, AIDifficultyConfig } from '@cinematic-chess/shared-types';

export interface ExtendedAIConfig extends AIDifficultyConfig {
  skillLevel: number; // Stockfish Skill Level (0..20)
}

export const AI_TIER_CONFIGS: Record<AIDifficultyTier, ExtendedAIConfig> = {
  Beginner: {
    tier: 'Beginner',
    label: 'Beginner',
    description: 'Casual beginner level. Searches 1 ply with minimal calculation time.',
    uciElo: 1320,
    skillLevel: 0,
    limitStrength: true,
    depth: 1,
    movetimeMs: 100
  },
  Easy: {
    tier: 'Easy',
    label: 'Easy',
    description: 'Gentle club player. Calculates 2 plies ahead.',
    uciElo: 1400,
    skillLevel: 3,
    limitStrength: true,
    depth: 2,
    movetimeMs: 200
  },
  Medium: {
    tier: 'Medium',
    label: 'Medium',
    description: 'Solid intermediate player. Looks 4 plies deep.',
    uciElo: 1600,
    skillLevel: 6,
    limitStrength: true,
    depth: 4,
    movetimeMs: 400
  },
  Hard: {
    tier: 'Hard',
    label: 'Hard',
    description: 'Competitive tournament player. Calculates 6 plies deep.',
    uciElo: 1900,
    skillLevel: 10,
    limitStrength: true,
    depth: 6,
    movetimeMs: 800
  },
  Expert: {
    tier: 'Expert',
    label: 'Expert',
    description: 'Strong candidate master. 8 plies deep with deep tactical defense.',
    uciElo: 2200,
    skillLevel: 14,
    limitStrength: true,
    depth: 8,
    movetimeMs: 1500
  },
  Master: {
    tier: 'Master',
    label: 'Master',
    description: 'FIDE Master strength. 10 plies deep with extensive positional accuracy.',
    uciElo: 2500,
    skillLevel: 18,
    limitStrength: true,
    depth: 10,
    movetimeMs: 2500
  },
  Ultimate: {
    tier: 'Ultimate',
    label: 'Ultimate',
    description: 'Uncapped maximum Stockfish strength (Grandmaster+). Deepest lines reachable.',
    uciElo: 3190,
    skillLevel: 20,
    limitStrength: false,
    depth: 14,
    movetimeMs: 4000
  }
};
