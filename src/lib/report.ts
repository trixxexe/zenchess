/**
 * The chess.com-style game report, computed entirely from a ReviewResult:
 * opening name and book depth, accuracy per phase, best-move percentage, the
 * turning point, and whether (and until when) the player was winning.
 */

import { Chess, type Color } from 'chess.js'

import { findOpening, type OpeningInfo } from './openings'
import type { MoveClass, ReviewResult } from './review'

export type Phase = 'opening' | 'middlegame' | 'endgame'

export const PHASE_LABEL: Record<Phase, string> = {
  opening: 'Opening',
  middlegame: 'Middlegame',
  endgame: 'Endgame',
}

const PHASE_ORDER: Phase[] = ['opening', 'middlegame', 'endgame']
const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const CLASS_ORDER: MoveClass[] = ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder']

export type TurnPoint = {
  ply: number
  moveNumber: number
  san: string
  bestSan: string | null
  cpLoss: number
  color: Color
}

export type GameReport = {
  player: Color
  opening: OpeningInfo | null
  phases: { phase: Phase; you: number | null; opponent: number | null }[]
  bestPct: { you: number; opponent: number }
  legend: { key: MoveClass; you: number; opponent: number }[]
  turnPoint: TurnPoint | null
  winningUntil: { ply: number; moveNumber: number } | null
}

function materialTotal(fen: string): number {
  const game = new Chess(fen)
  let total = 0
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell || cell.type === 'p' || cell.type === 'k') continue
      total += VALUES[cell.type] ?? 0
    }
  }
  return total
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

export function buildReport(review: ReviewResult, player: Color): GameReport {
  const opponent: Color = player === 'w' ? 'b' : 'w'
  const opening = findOpening(review.moves.map((move) => move.san))

  // Phase per move: the first ten moves are the opening, then the endgame
  // begins once the heavy pieces are gone and never goes back.
  let endgame = false
  const phases = review.moves.map((move, index) => {
    if (!endgame && materialTotal(move.fenBefore) <= 13) endgame = true
    const phase: Phase = index < 20 ? 'opening' : endgame ? 'endgame' : 'middlegame'
    return phase
  })

  const sums: Record<Phase, { you: number; youCount: number; opponent: number; opponentCount: number }> = {
    opening: { you: 0, youCount: 0, opponent: 0, opponentCount: 0 },
    middlegame: { you: 0, youCount: 0, opponent: 0, opponentCount: 0 },
    endgame: { you: 0, youCount: 0, opponent: 0, opponentCount: 0 },
  }

  review.moves.forEach((move, index) => {
    const bucket = sums[phases[index]]
    if (move.color === player) {
      bucket.you += move.accuracy
      bucket.youCount += 1
    } else {
      bucket.opponent += move.accuracy
      bucket.opponentCount += 1
    }
  })

  const totalYou = review.moves.filter((move) => move.color === player).length
  const totalOpponent = review.moves.length - totalYou
  const countsYou = review.counts[player]
  const countsOpponent = review.counts[opponent]

  let turnPoint: TurnPoint | null = null
  for (const move of review.moves) {
    if (!turnPoint || move.cpLoss > turnPoint.cpLoss) {
      turnPoint = {
        ply: move.ply,
        moveNumber: Math.ceil(move.ply / 2),
        san: move.san,
        bestSan: uciToSan(move.fenBefore, move.bestMove),
        cpLoss: move.cpLoss,
        color: move.color,
      }
    }
  }
  // A "turn point" of a few centipawns is just noise.
  if (turnPoint && turnPoint.cpLoss < 50) turnPoint = null

  // The last stretch where the player was clearly winning and then let it go.
  const evalFor = (cp: number) => (player === 'w' ? cp : -cp)
  let winningUntil: { ply: number; moveNumber: number } | null = null
  for (let index = 0; index < review.graph.length; index += 1) {
    if (evalFor(review.graph[index]) < 200) continue
    for (let later = index + 1; later < review.graph.length; later += 1) {
      if (evalFor(review.graph[later]) >= 50) continue
      winningUntil = { ply: later, moveNumber: Math.max(1, Math.ceil(later / 2)) }
      break
    }
  }

  return {
    player,
    opening,
    phases: PHASE_ORDER.map((phase) => {
      const bucket = sums[phase]
      return {
        phase,
        you: bucket.youCount ? bucket.you / bucket.youCount : null,
        opponent: bucket.opponentCount ? bucket.opponent / bucket.opponentCount : null,
      }
    }),
    bestPct: {
      you: totalYou ? (countsYou.best / totalYou) * 100 : 0,
      opponent: totalOpponent ? (countsOpponent.best / totalOpponent) * 100 : 0,
    },
    legend: CLASS_ORDER.map((key) => ({ key, you: countsYou[key], opponent: countsOpponent[key] })),
    turnPoint,
    winningUntil,
  }
}
