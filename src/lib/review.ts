import { Chess } from 'chess.js'

import { getEngine, type EngineScore } from './engine'

/**
 * A chess.com-style game review: analyse every position once, then judge each
 * move by how much winning chance it gave away. Scores are kept in centipawns
 * from White's point of view for the graph, and converted to the mover's point
 * of view when judging a move.
 */

export type MoveClass = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export const CLASS_LABEL: Record<MoveClass, string> = {
  best: 'Best',
  excellent: 'Excellent',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
}

export const CLASS_COLOR: Record<MoveClass, string> = {
  best: '#ffb547',
  excellent: '#8fd694',
  good: '#a8c7b0',
  inaccuracy: '#ffd166',
  mistake: '#ff9a6b',
  blunder: '#ff4d6d',
}

const MATE_CP = 100_000

export type ReviewedMove = {
  ply: number
  san: string
  from: string
  to: string
  color: 'w' | 'b'
  fenBefore: string
  fenAfter: string
  /** Centipawns given away, from the mover's point of view. */
  cpLoss: number
  /** Per-move accuracy, 0–100, from the mover's point of view. */
  accuracy: number
  classification: MoveClass
  bestMove: string | null
  /** Evaluation in centipawns, White's point of view. */
  evalBefore: number
  evalAfter: number
}

export type ReviewResult = {
  startFen: string
  moves: ReviewedMove[]
  accuracy: { w: number; b: number }
  counts: { w: Record<MoveClass, number>; b: Record<MoveClass, number> }
  /** One point per position, White's point of view, clamped for drawing. */
  graph: number[]
  /** Engine's best move for each position, as UCI. */
  bestMoves: (string | null)[]
}

export type ReviewProgress = { done: number; total: number }

export class ReviewCancelled extends Error {
  constructor() {
    super('Review cancelled')
    this.name = 'ReviewCancelled'
  }
}

function cpFromScore(score: EngineScore | undefined): number {
  if (!score) return 0
  if (score.type === 'mate') {
    return score.value > 0 ? MATE_CP - Math.abs(score.value) : -MATE_CP + Math.abs(score.value)
  }
  return score.value
}

/** Winning chances in percent, the curve lichess and chess.com both approximate. */
function winChances(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

function accuracyFromLoss(before: number, after: number): number {
  const loss = Math.max(0, winChances(before) - winChances(after))
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669))
}

function classify(loss: number, isBest: boolean): MoveClass {
  if (isBest) return 'best'
  if (loss < 25) return 'excellent'
  if (loss < 60) return 'good'
  if (loss < 130) return 'inaccuracy'
  if (loss < 300) return 'mistake'
  return 'blunder'
}

function emptyCounts(): Record<MoveClass, number> {
  return { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
}

export function reviewSummaryText(result: ReviewResult): string {
  const diff = result.accuracy.w - result.accuracy.b
  if (Math.abs(diff) < 1.5) return 'A level game.'
  return diff > 0 ? 'White was more accurate.' : 'Black was more accurate.'
}

export async function reviewGame(
  pgn: string,
  options: { depth?: number; onProgress?: (progress: ReviewProgress) => void; cancelled?: () => boolean } = {},
): Promise<ReviewResult> {
  const game = new Chess()
  try {
    game.loadPgn(pgn.trim())
  } catch {
    throw new Error('That PGN could not be read.')
  }
  const history = game.history({ verbose: true })
  if (history.length === 0) throw new Error('That PGN has no moves to review.')
  if (history.length > 200) throw new Error('That game is too long to review in the browser (200 moves max).')

  // Every position in the game, replayed from the start.
  const startFen = new Chess().fen()
  const positions: string[] = [startFen]
  const replay = new Chess()
  for (const move of history) {
    try {
      replay.move(move.san)
    } catch {
      throw new Error(`Move ${history.indexOf(move) + 1} (${move.san}) is not legal from the position before it.`)
    }
    positions.push(replay.fen())
  }

  const engine = getEngine()
  const depth = options.depth ?? 12
  const evaluations: { cp: number; best: string | null }[] = []

  for (let index = 0; index < positions.length; index += 1) {
    if (options.cancelled?.()) throw new ReviewCancelled()
    const fen = positions[index]
    const probe = new Chess(fen)
    const stm = fen.split(' ')[1] === 'w' ? 1 : -1

    if (probe.isCheckmate()) {
      // The side to move is mated.
      evaluations.push({ cp: -MATE_CP * stm, best: null })
    } else if (probe.isGameOver()) {
      evaluations.push({ cp: 0, best: null })
    } else {
      const result = await engine.analyse(fen, { depth })
      evaluations.push({ cp: cpFromScore(result.lines[0]?.score) * stm, best: result.bestMove })
    }

    options.onProgress?.({ done: index + 1, total: positions.length })
  }

  const counts = { w: emptyCounts(), b: emptyCounts() }
  const accuracySums = { w: 0, b: 0 }
  const accuracyCounts = { w: 0, b: 0 }

  const moves: ReviewedMove[] = history.map((move, index) => {
    const sign = move.color === 'w' ? 1 : -1
    const before = evaluations[index].cp * sign
    const after = evaluations[index + 1].cp * sign
    const loss = Math.max(0, before - after)
    const uci = `${move.from}${move.to}${move.promotion ?? ''}`
    const classification = classify(loss, evaluations[index].best === uci)
    const accuracy = accuracyFromLoss(before, after)

    counts[move.color][classification] += 1
    accuracySums[move.color] += accuracy
    accuracyCounts[move.color] += 1

    return {
      ply: index + 1,
      san: move.san,
      from: move.from,
      to: move.to,
      color: move.color,
      fenBefore: positions[index],
      fenAfter: positions[index + 1],
      cpLoss: loss,
      accuracy,
      classification,
      bestMove: evaluations[index].best,
      evalBefore: evaluations[index].cp,
      evalAfter: evaluations[index + 1].cp,
    }
  })

  return {
    startFen,
    moves,
    accuracy: {
      w: accuracyCounts.w ? accuracySums.w / accuracyCounts.w : 0,
      b: accuracyCounts.b ? accuracySums.b / accuracyCounts.b : 0,
    },
    counts,
    graph: evaluations.map((entry) => Math.max(-1200, Math.min(1200, entry.cp))),
    bestMoves: evaluations.map((entry) => entry.best),
  }
}

/** '+0.42', '−1.30', 'M3' — from White's point of view. */
export function formatEval(cp: number): string {
  if (Math.abs(cp) > MATE_CP - 1000) {
    const plies = Math.max(1, Math.round(MATE_CP - Math.abs(cp)))
    return `${cp > 0 ? '+' : '−'}M${plies}`
  }
  const pawns = cp / 100
  if (Math.abs(pawns) < 0.05) return '0.00'
  return `${pawns > 0 ? '+' : '−'}${Math.abs(pawns).toFixed(2)}`
}

export function accuracyGrade(accuracy: number): string {
  if (accuracy >= 95) return 'Flawless'
  if (accuracy >= 88) return 'Excellent'
  if (accuracy >= 78) return 'Good'
  if (accuracy >= 65) return 'Inaccurate'
  return 'Needs work'
}
