import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Color, Move, PieceSymbol, Square } from 'chess.js'

import { FILES, pieceSrc } from '../lib/chess'
import { cx } from '../lib/cx'
import { useSettings } from '../lib/store'

type Cell = { square: Square; type: PieceSymbol; color: Color } | null
type Slide = { from: Square; to: Square }

/** chess.com's green board. */
const LIGHT = '#ebecd0'
const DARK = '#739552'
const LAST_MOVE = 'rgb(247 247 105 / 0.55)'
const SELECTED = 'rgb(247 247 105 / 0.78)'

export type BoardMove = { from: Square; to: Square; promotion?: PieceSymbol }

function Piece({ color, type }: { color: Color; type: PieceSymbol }) {
  return (
    <img
      src={pieceSrc(color, type)}
      alt=""
      draggable={false}
      className="pointer-events-none h-full w-full select-none"
    />
  )
}

export function ChessBoard({
  board,
  turn,
  moves,
  orientation = 'w',
  lastMove,
  inCheck,
  onMove,
  disabled = false,
  arrow,
  className,
}: {
  board: Cell[][]
  turn: Color
  moves: Move[]
  orientation?: Color
  lastMove?: { from: string; to: string } | null
  inCheck?: boolean
  onMove?: (move: BoardMove) => void
  disabled?: boolean
  arrow?: string | null
  className?: string
}) {
  const settings = useSettings()
  const ref = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [promotion, setPromotion] = useState<{ from: Square; to: Square; color: Color } | null>(null)
  const [drag, setDrag] = useState<{
    from: Square
    x: number
    y: number
    size: number
    active: boolean
    pointerId: number
  } | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])

  // Escape closes the promotion picker, like any other dialog.
  useEffect(() => {
    if (!promotion) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPromotion(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [promotion])

  const interactive = Boolean(onMove) && !disabled
  const cells = displayCells(board, orientation)

  const targets = new Set(selected ? moves.filter((m) => m.from === selected).map((m) => m.to) : [])

  function pieceAt(square: Square): Cell {
    const file = FILES.indexOf(square[0])
    const rank = Number(square[1]) - 1
    return board[7 - rank]?.[file] ?? null
  }

  /** Display grid coordinates (col/row, 0..7) for a square in this orientation. */
  function disp(square: string) {
    const file = FILES.indexOf(square[0])
    const rank = Number(square[1]) - 1
    return { col: orientation === 'w' ? file : 7 - file, row: orientation === 'w' ? 7 - rank : rank }
  }

  // Slide the piece that just moved, and the rook on castling.
  const seenRef = useRef<string>('')
  const primedRef = useRef(false)
  useEffect(() => {
    const signature = lastMove ? `${lastMove.from}${lastMove.to}` : ''
    if (!primedRef.current) {
      // The position a page opens on is not a move: never animate it.
      primedRef.current = true
      seenRef.current = signature
      return
    }
    if (signature === seenRef.current) return
    seenRef.current = signature
    if (!lastMove) {
      setSlides([])
      return
    }

    const next: Slide[] = [{ from: lastMove.from as Square, to: lastMove.to as Square }]
    if (pieceAt(lastMove.to as Square)?.type === 'k') {
      const fromFile = FILES.indexOf(lastMove.from[0])
      const toFile = FILES.indexOf(lastMove.to[0])
      if (Math.abs(fromFile - toFile) === 2) {
        const rank = lastMove.to[1]
        next.push({
          from: `${toFile === 6 ? 'h' : 'a'}${rank}` as Square,
          to: `${toFile === 6 ? 'f' : 'd'}${rank}` as Square,
        })
      }
    }
    setSlides(next)
    const id = window.setTimeout(() => setSlides([]), 220)
    return () => window.clearTimeout(id)
    // pieceAt is derived from `board`/`orientation`, both of which change with the move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove?.from, lastMove?.to])

  function squareFromPoint(clientX: number, clientY: number): Square | null {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return null
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null
    const col = Math.min(7, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 8)))
    const row = Math.min(7, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * 8)))
    const file = orientation === 'w' ? col : 7 - col
    const rank = orientation === 'w' ? row : 7 - row
    return `${FILES[file]}${8 - rank}` as Square
  }

  function attempt(from: Square, to: Square) {
    const candidates = moves.filter((m) => m.from === from && m.to === to)
    if (!candidates.length) return false
    if (candidates.some((m) => m.promotion)) {
      if (settings.autoQueen) {
        onMove?.({ from, to, promotion: 'q' })
        setSelected(null)
        return true
      }
      setPromotion({ from, to, color: pieceAt(from)?.color ?? turn })
      setSelected(null)
      return true
    }
    onMove?.({ from, to })
    setSelected(null)
    return true
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    const square = squareFromPoint(event.clientX, event.clientY)
    if (!square) return
    event.preventDefault()

    // Click-to-move: a second click on a legal destination plays the move.
    if (selected && selected !== square && targets.has(square)) {
      attempt(selected, square)
      return
    }

    const cell = pieceAt(square)
    if (cell && cell.color === turn) {
      if (selected === square) {
        setSelected(null)
        return
      }
      const rect = ref.current?.getBoundingClientRect()
      setSelected(square)
      setDrag({
        from: square,
        x: event.clientX,
        y: event.clientY,
        size: rect ? rect.width / 8 : 48,
        active: false,
        pointerId: event.pointerId,
      })
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Synthetic pointers have no capture; dragging still works without it.
      }
      return
    }

    setSelected(null)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return
    const active = drag.active || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4
    if (!active) return
    setDrag({ ...drag, x: event.clientX, y: event.clientY, active })
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag) return
    const square = squareFromPoint(event.clientX, event.clientY)
    const { from, active } = drag
    setDrag(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (active && square && square !== from) {
      if (!attempt(from, square)) setSelected(from)
    }
    // A press that never moved is a click: keep the piece selected so the
    // destination can be clicked next.
  }

  const arrowMove = arrow && arrow.length >= 4 ? { from: arrow.slice(0, 2), to: arrow.slice(2, 4) } : null
  const ghost = drag?.active ? pieceAt(drag.from) : null

  return (
    <div className={cx('[container-type:inline-size] relative w-full select-none', className)}>
      <div
        ref={ref}
        role="grid"
        aria-label={`Chess board, ${turn === 'w' ? 'White' : 'Black'} to move`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cx(
          'grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden shadow-[0_24px_50px_-24px_rgb(0_0_0/0.85)]',
          interactive ? '[touch-action:none]' : '[touch-action:manipulation]',
        )}
      >
        {cells.map(({ square, cell, dark, row, col }) => {
          const isSelected = selected === square
          const isTarget = targets.has(square)
          const isCapture = isTarget && Boolean(cell)
          const isLast = Boolean(lastMove && (lastMove.from === square || lastMove.to === square))
          const slide = settings.animation ? slides.find((entry) => entry.to === square) : undefined
          const slideVars = slide
            ? ({
                '--slide-x': `${(disp(slide.from).col - disp(slide.to).col) * 12.5}cqw`,
                '--slide-y': `${(disp(slide.from).row - disp(slide.to).row) * 12.5}cqw`,
              } as CSSProperties)
            : undefined
          return (
            <div
              key={square}
              data-square={square}
              role="gridcell"
              aria-label={square}
              className={cx('group relative', interactive && 'cursor-pointer')}
              style={{ background: dark ? DARK : LIGHT }}
            >
              {interactive && (
                <span aria-hidden className="pointer-events-none absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/[0.14]" />
              )}
              {isLast && <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: LAST_MOVE }} />}
              {isSelected && <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: SELECTED }} />}
              {settings.legalMoves && isTarget && !isCapture && (
                <span
                  aria-hidden
                  className="round pointer-events-none absolute left-1/2 top-1/2 size-[27%] -translate-x-1/2 -translate-y-1/2"
                  style={{ background: 'rgb(0 0 0 / 0.16)' }}
                />
              )}
              {settings.legalMoves && isTarget && isCapture && (
                <span
                  aria-hidden
                  className="round pointer-events-none absolute inset-[2%]"
                  style={{ border: '0.9cqw solid rgb(0 0 0 / 0.15)' }}
                />
              )}
              {inCheck && cell?.type === 'k' && cell.color === turn && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'radial-gradient(circle at 50% 52%, rgb(255 60 60 / 0.85) 12%, rgb(255 60 60 / 0.25) 46%, transparent 68%)' }}
                />
              )}

              {cell && !(drag?.active && drag.from === square) && (
                <span
                  aria-hidden
                  className={cx('pointer-events-none absolute inset-0', slide && 'piece-slide')}
                  style={slideVars}
                >
                  <Piece color={cell.color} type={cell.type} />
                </span>
              )}

              {settings.coordinates && row === 7 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-[1.5%] right-[3%] text-[2.1cqw] font-semibold leading-none"
                  style={{ color: dark ? LIGHT : DARK, opacity: 0.85 }}
                >
                  {square[0]}
                </span>
              )}
              {settings.coordinates && col === 0 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[3%] top-[2%] text-[2.1cqw] font-semibold leading-none"
                  style={{ color: dark ? LIGHT : DARK, opacity: 0.85 }}
                >
                  {square[1]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {arrowMove && <BoardArrow from={arrowMove.from} to={arrowMove.to} orientation={orientation} />}

      {ghost && drag && (
        <span
          aria-hidden
          className="pointer-events-none fixed z-50"
          style={{
            left: drag.x,
            top: drag.y,
            width: drag.size * 1.08,
            height: drag.size * 1.08,
            transform: 'translate(-50%, -50%)',
            filter: 'drop-shadow(0 6px 9px rgb(0 0 0 / 0.5))',
          }}
        >
          <Piece color={ghost.color} type={ghost.type} />
        </span>
      )}

      {promotion && (
        <div
          className="absolute inset-0 z-40 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setPromotion(null)}
        >
          <div
            role="dialog"
            aria-label="Choose a promotion piece"
            className="depth relative rounded-[16px] bg-surface p-3 shadow-glow"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 text-center text-[12px] text-muted">Promote to</p>
            <div className="flex gap-1">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((piece) => (
                <button
                  key={piece}
                  type="button"
                  onClick={() => {
                    onMove?.({ from: promotion.from, to: promotion.to, promotion: piece })
                    setPromotion(null)
                  }}
                  className="grid size-12 place-items-center rounded-[12px] bg-white/[0.06] p-1.5 transition-colors hover:bg-white/[0.14]"
                  aria-label={`Promote to ${piece}`}
                >
                  <Piece color={promotion.color} type={piece} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function displayCells(board: Cell[][], orientation: Color) {
  const out: { square: Square; cell: Cell; dark: boolean; row: number; col: number }[] = []
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const rank = orientation === 'w' ? 7 - row : row
      const file = orientation === 'w' ? col : 7 - col
      out.push({
        square: `${FILES[file]}${rank + 1}` as Square,
        cell: board[7 - rank]?.[file] ?? null,
        dark: (rank + file) % 2 === 0,
        row,
        col,
      })
    }
  }
  return out
}

/** Grid coordinates (0..8) for a square in the given orientation. */
function point(square: string, orientation: Color) {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1]) - 1
  const col = orientation === 'w' ? file : 7 - file
  const row = orientation === 'w' ? 7 - rank : rank
  return { x: col + 0.5, y: row + 0.5 }
}

function BoardArrow({ from, to, orientation }: { from: string; to: string; orientation: Color }) {
  const a = point(from, orientation)
  const b = point(to, orientation)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const start = { x: a.x + ux * 0.3, y: a.y + uy * 0.3 }
  const tip = { x: b.x - ux * 0.1, y: b.y - uy * 0.1 }
  const base = { x: tip.x - ux * 0.42, y: tip.y - uy * 0.42 }

  return (
    <svg aria-hidden viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 h-full w-full">
      <line x1={start.x} y1={start.y} x2={base.x} y2={base.y} stroke="rgb(21 120 27 / 0.85)" strokeWidth="0.19" strokeLinecap="round" />
      <polygon
        points={`${tip.x},${tip.y} ${base.x - uy * 0.24},${base.y + ux * 0.24} ${base.x + uy * 0.24},${base.y - ux * 0.24}`}
        fill="rgb(21 120 27 / 0.85)"
      />
    </svg>
  )
}
