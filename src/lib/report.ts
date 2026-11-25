/**
 * The chess.com-style game report, computed entirely from a ReviewResult:
 * opening name and book depth, accuracy per phase, best-move percentage, the
 * turning point, key moments to jump to, and a plain-English verdict.
 */

import { Chess, type Color } from 'chess.js'

import { findOpening, type OpeningInfo } from './openings'
import { CLASS_ORDER, type MoveClass, type ReviewResult } from './review'

export type Phase = 'opening' | 'middlegame' | 'endgame'

export const PHASE_LABEL: Record<Phase, string> = {
  opening: 'Opening',
  middlegame: 'Middlegame',
  endgame: 'Endgame',
}

const PHASE_ORDER: Phase[] = ['opening', 'middlegame', 'endgame']
const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

export type TurnPoint = {
  ply: number
  moveNumber: number
  san: string
  bestSan: string | null
  cpLoss: number
  color: Color
}

export type KeyMoment = {
  ply: number
  moveNumber: number
  san: string
  bestSan: string | null
  classification: MoveClass
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
  headline: string
  headlineDetail: string
  keyMoments: KeyMoment[]
  bookExit: { ply: number; moveNumber: number } | null
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

  // The opening lasts a little past the book, then the middlegame, and the
  // endgame begins once the heavy pieces are gone and never goes back.
  const openingPlies = Math.min(24, Math.max(8, (opening?.bookPlies ?? 10) + 4))
  let endgame = false
  const phases = review.moves.map((move, index) => {
    if (!endgame && materialTotal(move.fenBefore) <= 13) endgame = true
    if (endgame) return 'endgame' as Phase
    return (index < openingPlies ? 'opening' : 'middlegame') as Phase
  })

  const sums: Record<Phase, { you: number; youCount: number; opponent: number; opponentCount: number }> = {
    opening: { you: 0, youCount: 0, opponent: 0, opponentCount: 0 },
    middlegame: { you: 0, youCount: 0, opponent: 0, opponentCount: 0 },
    endgame: { you: 0, youCount: 0, opponent: 0, opponentCount: 0 },
  }

  review.moves.forEach((move, index) => {
    if (move.classification === 'book') return
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
  const decisionsYou = Math.max(0, totalYou - countsYou.book)
  const decisionsOpponent = Math.max(0, totalOpponent - countsOpponent.book)

  let turnPoint: TurnPoint | null = null
  for (const move of review.moves) {
    if (move.classification === 'book') continue
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

  // Your mistakes, biggest first: the list to click through after the review.
  const keyMoments: KeyMoment[] = review.moves
    .filter(
      (move) =>
        move.color === player && (move.classification === 'blunder' || move.classification === 'mistake'),
    )
    .sort((a, b) => b.cpLoss - a.cpLoss)
    .slice(0, 4)
    .map((move) => ({
      ply: move.ply,
      moveNumber: Math.ceil(move.ply / 2),
      san: move.san,
      bestSan: move.bestSan,
      classification: move.classification,
      cpLoss: move.cpLoss,
      color: move.color,
    }))

  const diff = review.accuracy[player] - review.accuracy[opponent]
  let headline: string
  if (diff >= 8) headline = 'You outplayed your opponent'
  else if (diff >= 3) headline = 'You were the sharper player'
  else if (diff >= -3) headline = 'An evenly matched game'
  else if (diff >= -8) headline = 'Your opponent was a little sharper'
  else headline = 'Your opponent was more accurate'

  const errors: string[] = []
  if (countsYou.blunder) errors.push(`${countsYou.blunder} blunder${countsYou.blunder === 1 ? '' : 's'}`)
  if (countsYou.mistake) errors.push(`${countsYou.mistake} mistake${countsYou.mistake === 1 ? '' : 's'}`)
  if (countsYou.inaccuracy)
    errors.push(`${countsYou.inaccuracy} ${countsYou.inaccuracy === 1 ? 'inaccuracy' : 'inaccuracies'}`)
  const headlineDetail = errors.length
    ? `Your errors: ${errors.join(' and ')}.`
    : 'No mistakes or blunders — a clean game.'

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
      you: decisionsYou ? ((countsYou.best + countsYou.great) / decisionsYou) * 100 : 0,
      opponent: decisionsOpponent
        ? ((countsOpponent.best + countsOpponent.great) / decisionsOpponent) * 100
        : 0,
    },
    legend: CLASS_ORDER.map((key) => ({ key, you: countsYou[key], opponent: countsOpponent[key] })),
    turnPoint,
    winningUntil,
    headline,
    headlineDetail,
    keyMoments,
    bookExit: opening?.leftBookAtPly
      ? { ply: opening.leftBookAtPly, moveNumber: Math.ceil(opening.leftBookAtPly / 2) }
      : null,
  }
}
