import { Chess } from 'chess.js'

import { getEngine, type EngineScore } from './engine'
import { findOpening } from './openings'

/**
 * A chess.com-style game review: analyse every position once, then judge each
 * move by how much winning chance it gave away. Scores are kept in centipawns
 * from White's point of view for the graph, and converted to the mover's point
 * of view when judging a move.
 *
 * Opening-book moves are labelled "Book" and left out of accuracy, exactly as
 * chess.com does: replaying theory is not a decision worth scoring.
 */

export type MoveClass = 'book' | 'great' | 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export const CLASS_ORDER: MoveClass[] = [
  'book',
  'great',
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
]

export const CLASS_LABEL: Record<MoveClass, string> = {
  book: 'Book',
  great: 'Great',
  best: 'Best',
  excellent: 'Excellent',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
}

export const CLASS_COLOR: Record<MoveClass, string> = {
  book: '#c9a98a',
  great: '#5b9bff',
  best: '#ffb547',
  excellent: '#8fd694',
  good: '#a8c7b0',
  inaccuracy: '#ffd166',
  mistake: '#ff9a6b',
  blunder: '#ff4d6d',
}

/** The compact badge used beside each move, like chess.com's move icons. */
export const CLASS_GLYPH: Record<MoveClass, string> = {
  book: 'B',
  great: '!',
  best: '★',
  excellent: '✓',
  good: '✓',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
}

const MATE_CP = 100_000
const GREAT_GAP = 150

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
  /** The engine's best move in SAN, for the coach panel. */
  bestSan: string | null
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

type Evaluation = { cp: number; best: string | null; secondCp: number | null }

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

function classify(loss: number, isBest: boolean, gap: number, before: number): MoveClass {
  if (isBest) {
    // "Great" means the engine's best move was also the only move that held
    // the position — not merely a good move in an already winning game.
    return gap >= GREAT_GAP && Math.abs(before) < 500 ? 'great' : 'best'
  }
  if (loss < 25) return 'excellent'
  if (loss < 60) return 'good'
  if (loss < 130) return 'inaccuracy'
  if (loss < 300) return 'mistake'
  return 'blunder'
}

function emptyCounts(): Record<MoveClass, number> {
  return { book: 0, great: 0, best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
}

function uciToSan(fen: string, uci: string | null): string | null {
  if (!uci || uci.length < 4) return null
  try {
    const game = new Chess(fen)
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    })
    return move.san
  } catch {
    return null
  }
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

  const sans = history.map((move) => move.san)
  const bookPlies = findOpening(sans)?.bookPlies ?? 0

  const engine = getEngine()
  const depth = options.depth ?? 12
  const evaluations: Evaluation[] = []

  for (let index = 0; index < positions.length; index += 1) {
    if (options.cancelled?.()) throw new ReviewCancelled()
    const fen = positions[index]
    const probe = new Chess(fen)
    const stm = fen.split(' ')[1] === 'w' ? 1 : -1

    if (probe.isCheckmate()) {
      // The side to move is mated.
      evaluations.push({ cp: -MATE_CP * stm, best: null, secondCp: null })
    } else if (probe.isGameOver()) {
      evaluations.push({ cp: 0, best: null, secondCp: null })
    } else {
      // Two lines: the second one is how we tell a "Best" move from a "Great"
      // one (the only move that keeps the position).
      const result = await engine.analyse(fen, { depth, multipv: 2 })
      const best = result.bestMove ?? result.lines[0]?.pv?.[0] ?? null
      const first = cpFromScore(result.lines[0]?.score)
      const second = result.lines[1]?.score
      evaluations.push({
        cp: first * stm,
        best,
        secondCp: second ? cpFromScore(second) * stm : null,
      })
    }

    options.onProgress?.({ done: index + 1, total: positions.length })
  }

  const counts = { w: emptyCounts(), b: emptyCounts() }
  const sums = { w: 0, b: 0 }
  const counted = { w: 0, b: 0 }
  const allSums = { w: 0, b: 0 }
  const allCounted = { w: 0, b: 0 }

  const moves: ReviewedMove[] = history.map((move, index) => {
    const sign = move.color === 'w' ? 1 : -1
    const before = evaluations[index].cp * sign
    const after = evaluations[index + 1].cp * sign
    const loss = Math.max(0, before - after)
    const uci = `${move.from}${move.to}${move.promotion ?? ''}`
    const isBest = evaluations[index].best === uci
    const second = evaluations[index].secondCp
    const gap = second === null ? 0 : before - second * sign
    const isBook = index < bookPlies
    const classification = isBook ? 'book' : classify(loss, isBest, gap, before)
    const accuracy = isBook ? 100 : accuracyFromLoss(before, after)

    counts[move.color][classification] += 1
    allSums[move.color] += accuracy
    allCounted[move.color] += 1
    if (!isBook) {
      sums[move.color] += accuracy
      counted[move.color] += 1
    }

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
      bestSan: uciToSan(positions[index], evaluations[index].best),
      evalBefore: evaluations[index].cp,
      evalAfter: evaluations[index + 1].cp,
    }
  })

  const accuracyFor = (color: 'w' | 'b') =>
    counted[color] ? sums[color] / counted[color] : allCounted[color] ? allSums[color] / allCounted[color] : 0

  return {
    startFen,
    moves,
    accuracy: { w: accuracyFor('w'), b: accuracyFor('b') },
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

export type CoachNote = {
  detail: string
  bestSan: string | null
  bestEval: string | null
}

function keeps(subject: string) {
  return subject === 'You' ? 'keep' : 'keeps'
}

function mateIn(cp: number) {
  return Math.max(1, Math.ceil((MATE_CP - Math.abs(cp)) / 2))
}

function positionSentence(cp: number, subject: string): string {
  if (cp > MATE_CP - 1000) return `Forced mate in ${mateIn(cp)}.`
  if (cp > 300) return `${subject} ${keeps(subject)} a winning position.`
  if (cp > 100) return `${subject} ${keeps(subject)} a clear advantage.`
  if (cp > -50) return 'The position stays balanced.'
  if (cp > -300) return `${subject} ${subject === 'You' ? 'are' : 'is'} under pressure.`
  return `${subject} ${subject === 'You' ? 'are' : 'is'} losing.`
}

/**
 * The plain-English line chess.com puts under each move. It always says what
 * the engine preferred, so a graded move is also a lesson.
 */
export function coachNote(move: ReviewedMove, options: { isYou: boolean; openingName?: string | null }): CoachNote {
  const sign = move.color === 'w' ? 1 : -1
  const before = move.evalBefore * sign
  const after = move.evalAfter * sign
  const subject = options.isYou ? 'You' : move.color === 'w' ? 'White' : 'Black'
  const pawns = (move.cpLoss / 100).toFixed(1)
  const bestSan = move.bestSan
  const bestEval = bestSan ? formatEval(move.evalBefore) : null
  const hadMate = before > MATE_CP - 1000
  const hasMate = after > MATE_CP - 1000
  const allowsMate = after < -(MATE_CP - 1000)

  if (move.classification === 'book') {
    return {
      detail: options.openingName
        ? `Still in the book — this is theory from the ${options.openingName}.`
        : 'A known opening move — still in the book.',
      bestSan,
      bestEval,
    }
  }

  let detail: string
  if (move.classification === 'great') {
    detail = `The best move by a wide margin. ${positionSentence(after, subject)}`
  } else if (move.classification === 'best') {
    detail = `The engine's first choice. ${positionSentence(after, subject)}`
  } else if (move.classification === 'excellent') {
    detail = `Very close to the best move${bestSan ? ` (${bestSan})` : ''}. ${positionSentence(after, subject)}`
  } else if (move.classification === 'good') {
    detail = `A reasonable move${bestSan ? `, though ${bestSan} was more testing` : ''}. ${positionSentence(after, subject)}`
  } else if (move.classification === 'inaccuracy') {
    detail = `${bestSan ? `${bestSan} was stronger. ` : ''}This gives up ${pawns} pawns of winning chances.`
  } else if (move.classification === 'mistake') {
    detail = `${bestSan ? `${bestSan} was the move. ` : ''}This drops ${pawns} pawns.`
    if (allowsMate) detail += ' It allows a forced mate.'
    else if (hadMate) detail += ' A forced mate was on the board.'
  } else {
    const cause = allowsMate
      ? 'This allows a forced mate.'
      : hadMate
        ? 'This throws away a forced mate.'
        : before >= 400 && after <= -400
          ? 'This turns a winning position into a losing one.'
          : `This drops ${pawns} pawns.`
    detail = `${bestSan ? `${bestSan} would have kept it at ${formatEval(move.evalBefore)}. ` : ''}${cause}`
  }

  if (
    (move.classification === 'excellent' || move.classification === 'good' || move.classification === 'inaccuracy') &&
    before >= 200 &&
    after < 50
  ) {
    detail += ' This throws away a winning position.'
  }
  if (hadMate && !hasMate && move.classification === 'inaccuracy') {
    detail += ' A forced mate was on the board.'
  }

  return { detail, bestSan, bestEval }
}
