import { pieceSrc } from '../lib/chess'
import { cx } from '../lib/cx'

// A decorative 8x8 board. Positions are rows from rank 8 down to rank 1,
// uppercase letters are white pieces, lowercase are black, '.' is empty.

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const LIGHT = '#c9b39c'
const DARK = '#6d5546'

/** e4 -> { x: 4.5, y: 3.5 } in an 8x8 grid with y growing downwards. */
function center(square: string) {
  const file = FILES.indexOf(square[0])
  const rank = Number(square[1])
  return { x: file + 0.5, y: 8 - rank + 0.5 }
}

export function Board({
  position,
  highlight = [],
  arrow,
  className,
}: {
  position: string[]
  highlight?: string[]
  arrow?: { from: string; to: string }
  className?: string
}) {
  return (
    <div className={cx('[container-type:inline-size] relative aspect-square w-full select-none', className)}>
      <div className="grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-[10px] shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)]">
        {position.flatMap((row, r) =>
          row.split('').map((char, c) => {
            const square = `${FILES[c]}${8 - r}`
            const isLight = (r + c) % 2 === 0
            const marked = highlight.includes(square)
            const white = char !== '.' && char === char.toUpperCase()
            return (
              <div
                key={square}
                className="relative grid place-items-center"
                style={{ background: isLight ? LIGHT : DARK }}
              >
                {marked && <span aria-hidden className="absolute inset-0 bg-accent/45" />}
                {char !== '.' && (
                  <img
                    src={pieceSrc(white ? 'w' : 'b', char.toLowerCase())}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="pointer-events-none relative h-full w-full select-none"
                  />
                )}
              </div>
            )
          }),
        )}
      </div>
      {arrow && <Arrow from={arrow.from} to={arrow.to} />}
    </div>
  )
}

function Arrow({ from, to }: { from: string; to: string }) {
  const a = center(from)
  const b = center(to)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len

  const start = { x: a.x + ux * 0.32, y: a.y + uy * 0.32 }
  const tip = { x: b.x - ux * 0.12, y: b.y - uy * 0.12 }
  const base = { x: tip.x - ux * 0.42, y: tip.y - uy * 0.42 }

  return (
    <svg aria-hidden viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 h-full w-full">
      <line
        x1={start.x}
        y1={start.y}
        x2={base.x}
        y2={base.y}
        stroke="rgb(255 122 69 / 0.9)"
        strokeWidth="0.17"
        strokeLinecap="round"
      />
      <polygon
        points={`${tip.x},${tip.y} ${base.x - uy * 0.22},${base.y + ux * 0.22} ${base.x + uy * 0.22},${base.y - ux * 0.22}`}
        fill="rgb(255 122 69 / 0.92)"
      />
    </svg>
  )
}
