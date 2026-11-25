import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'

import type { EngineScore } from './engine'

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export const GLYPHS: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }

export const PIECE_NAMES: Record<string, string> = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }

/** '+0.34', '−1.20', '#3' or '#−2'. Always from White's point of view. */
export function formatScore(score?: EngineScore, turn: Color = 'w'): string {
  if (!score) return '0.00'
  if (score.type === 'mate') {
    const value = score.value
    if (value === 0) return '#'
    return `${value > 0 ? '#' : '#−'}${Math.abs(value)}`
  }
  // Stockfish reports from the side to move, so flip to White's perspective.
  const cp = turn === 'w' ? score.value : -score.value
  const pawns = cp / 100
  if (Math.abs(pawns) < 0.05) return '0.00'
  return `${pawns > 0 ? '+' : '−'}${Math.abs(pawns).toFixed(2)}`
}

/** White's share of the bar, 0 (Black winning) to 1 (White winning). */
export function evalShare(score?: EngineScore, turn: Color = 'w'): number {
  if (!score) return 0.5
  if (score.type === 'mate') {
    const value = turn === 'w' ? score.value : -score.value
    return value > 0 ? 1 : 0
  }
  const cp = turn === 'w' ? score.value : -score.value
  return 1 / (1 + Math.exp(-cp / 320))
}

/** Convert an engine principal variation to readable SAN moves. */
export function pvToSan(fen: string, pv: string[], limit = 10): string[] {
  const game = new Chess(fen)
  const out: string[] = []
  for (const uci of pv.slice(0, limit)) {
    try {
      const move = game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined,
      })
      out.push(move.san)
    } catch {
      break
    }
  }
  return out
}

/** Numbered SAN preview of a variation, e.g. "1. e4 e5 2. Nf3". */
export function formatVariation(fen: string, san: string[]): string {
  const turn = new Chess(fen).turn()
  let moveNumber = Number(fen.split(' ')[5] ?? 1)
  let whiteToMove = turn === 'w'
  const parts: string[] = []
  san.forEach((move, index) => {
    if (whiteToMove) {
      parts.push(`${moveNumber}.`)
    } else if (index === 0) {
      parts.push(`${moveNumber}...`)
    }
    parts.push(move)
    if (!whiteToMove) moveNumber += 1
    whiteToMove = !whiteToMove
  })
  return parts.join(' ')
}

export type GameStatus = {
  over: boolean
  headline: string
  detail: string
  /** Winner from White's perspective, null for a draw. */
  winner: Color | null
}

export function describeGame(game: Chess, options: { playerColor?: Color } = {}): GameStatus {
  const you = options.playerColor
  if (game.isCheckmate()) {
    const winner: Color = game.turn() === 'w' ? 'b' : 'w'
    const headline = !you ? 'Checkmate' : winner === you ? 'Checkmate — you win' : 'Checkmate — you lose'
    return { over: true, headline, detail: `${winner === 'w' ? 'White' : 'Black'} delivers mate.`, winner }
  }
  if (game.isStalemate()) return { over: true, headline: 'Stalemate', detail: 'No legal moves, but no check. Draw.', winner: null }
  if (game.isInsufficientMaterial()) return { over: true, headline: 'Draw', detail: 'Not enough material to mate.', winner: null }
  if (game.isThreefoldRepetition()) return { over: true, headline: 'Draw', detail: 'Threefold repetition.', winner: null }
  if (game.isDraw()) return { over: true, headline: 'Draw', detail: 'Fifty moves without a pawn move or capture.', winner: null }
  return { over: false, headline: game.turn() === 'w' ? 'White to move' : 'Black to move', detail: '', winner: null }
}

const START_COUNTS: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }

/** Path to the vector piece artwork (Cburnett set). */
export function pieceSrc(color: Color, type: string): string {
  return `${import.meta.env.BASE_URL}pieces/cburnett/${color}${type.toUpperCase()}.svg`
}

/** Pieces a colour has captured, biggest first. */
export function capturedBy(
  game: Chess,
  color: Color,
): { type: PieceSymbol; color: Color; count: number }[] {
  const counts: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 }
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell && cell.color !== color) counts[cell.type] += 1
    }
  }
  const order: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']
  const taken: Color = color === 'w' ? 'b' : 'w'
  return order
    .map((type) => ({ type, color: taken, count: Math.max(0, START_COUNTS[type] - counts[type]) }))
    .filter((entry) => entry.count > 0)
}

const MATERIAL_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Points of material `color` has on the board more than its opponent. */
export function materialDiff(game: Chess, color: Color): number {
  let mine = 0
  let theirs = 0
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell) continue
      const value = MATERIAL_VALUE[cell.type] ?? 0
      if (cell.color === color) mine += value
      else theirs += value
    }
  }
  return Math.max(0, mine - theirs)
}

/** e2e4 / e7e8q -> a move object for chess.js. */
export function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : undefined,
  }
}

export function squareName(fileIndex: number, rankIndex: number): Square {
  return `${FILES[fileIndex]}${rankIndex + 1}` as Square
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (ms < 20_000) {
    const tenths = Math.floor((Math.max(0, ms) % 1000) / 100)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
