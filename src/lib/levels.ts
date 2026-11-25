/**
 * Twenty playable strengths, from a first-week beginner to full Stockfish.
 *
 * Stockfish alone only has a usable Elo floor of about 1320, so the low levels
 * are built from three things together: a low UCI `Skill Level`, a shallow
 * search, and a chance of playing a random legal move. That last part is what
 * makes level 1 feel like a beginner rather than a throttled grandmaster.
 */

export type EngineLevel = {
  id: number
  elo: number
  band: string
  skill: number
  depth: number
  movetime: number
  /** Chance that the engine plays a random legal move instead of searching. */
  blunder: number
}

export const LEVELS: EngineLevel[] = [
  { id: 1, elo: 500, band: 'First steps', skill: 0, depth: 1, movetime: 60, blunder: 0.55 },
  { id: 2, elo: 600, band: 'First steps', skill: 0, depth: 1, movetime: 60, blunder: 0.45 },
  { id: 3, elo: 700, band: 'Beginner', skill: 1, depth: 2, movetime: 80, blunder: 0.4 },
  { id: 4, elo: 800, band: 'Beginner', skill: 2, depth: 2, movetime: 80, blunder: 0.32 },
  { id: 5, elo: 900, band: 'Beginner', skill: 3, depth: 2, movetime: 100, blunder: 0.28 },
  { id: 6, elo: 1000, band: 'Casual', skill: 4, depth: 3, movetime: 100, blunder: 0.22 },
  { id: 7, elo: 1100, band: 'Casual', skill: 5, depth: 3, movetime: 120, blunder: 0.18 },
  { id: 8, elo: 1200, band: 'Casual', skill: 6, depth: 3, movetime: 150, blunder: 0.14 },
  { id: 9, elo: 1300, band: 'Club', skill: 7, depth: 4, movetime: 150, blunder: 0.12 },
  { id: 10, elo: 1400, band: 'Club', skill: 8, depth: 4, movetime: 200, blunder: 0.1 },
  { id: 11, elo: 1500, band: 'Club', skill: 9, depth: 5, movetime: 200, blunder: 0.08 },
  { id: 12, elo: 1600, band: 'Club', skill: 10, depth: 5, movetime: 250, blunder: 0.06 },
  { id: 13, elo: 1750, band: 'Strong', skill: 11, depth: 6, movetime: 250, blunder: 0.05 },
  { id: 14, elo: 1900, band: 'Strong', skill: 12, depth: 6, movetime: 300, blunder: 0.04 },
  { id: 15, elo: 2050, band: 'Strong', skill: 13, depth: 8, movetime: 350, blunder: 0.03 },
  { id: 16, elo: 2200, band: 'Master', skill: 14, depth: 10, movetime: 400, blunder: 0.02 },
  { id: 17, elo: 2350, band: 'Master', skill: 15, depth: 12, movetime: 500, blunder: 0.015 },
  { id: 18, elo: 2500, band: 'Master', skill: 17, depth: 14, movetime: 700, blunder: 0.01 },
  { id: 19, elo: 2750, band: 'Full strength', skill: 19, depth: 16, movetime: 900, blunder: 0 },
  { id: 20, elo: 3190, band: 'Full strength', skill: 20, depth: 18, movetime: 1200, blunder: 0 },
]

export const LEVEL_COUNT = LEVELS.length
export const DEFAULT_LEVEL = 10

export function levelById(id: number): EngineLevel {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[DEFAULT_LEVEL]
}

/** Bands for the landing page, each covering a run of levels. */
export const LEVEL_BANDS = [
  {
    name: 'First steps',
    levels: '1–2',
    elo: '500–600',
    top: 2,
    description: 'Learns the board with you. Hangs pieces, misses forks and never punishes the same mistake twice.',
    note: 'For absolute beginners and children.',
  },
  {
    name: 'Beginner',
    levels: '3–5',
    elo: '700–900',
    top: 5,
    description: 'Takes the free piece and sees the obvious tactic, but still gives you room to build a plan.',
    note: 'Roughly a first-year player.',
  },
  {
    name: 'Casual',
    levels: '6–8',
    elo: '1000–1200',
    top: 8,
    description: 'Knows a few openings, punishes loose pieces, and starts to make you defend something.',
    note: 'Roughly a café player.',
  },
  {
    name: 'Club',
    levels: '9–12',
    elo: '1300–1600',
    top: 12,
    description: 'Real openings, correct exchanges and a clock that matters. Bluffing gets punished here.',
    note: 'Roughly a club player.',
  },
  {
    name: 'Strong',
    levels: '13–15',
    elo: '1750–2050',
    top: 15,
    description: 'Sharp tactics with long, patient plans. You will need an opening you actually trust.',
    note: 'Roughly a tournament player.',
  },
  {
    name: 'Master and above',
    levels: '16–20',
    elo: '2200–3190',
    top: 20,
    description: 'Positional pressure and endgame precision, up to uncapped Stockfish with NNUE evaluation.',
    note: 'The wall at the end of the ladder.',
  },
]

export type TimeControl = { id: string; label: string; minutes: number; increment: number }

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'none', label: 'No clock', minutes: 0, increment: 0 },
  { id: '1+0', label: 'Bullet 1+0', minutes: 1, increment: 0 },
  { id: '3+2', label: 'Blitz 3+2', minutes: 3, increment: 2 },
  { id: '5+0', label: 'Blitz 5+0', minutes: 5, increment: 0 },
  { id: '10+5', label: 'Rapid 10+5', minutes: 10, increment: 5 },
  { id: '15+10', label: 'Classical 15+10', minutes: 15, increment: 10 },
]
