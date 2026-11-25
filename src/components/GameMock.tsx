import { motion } from 'motion/react'
import { Clock, SlidersHorizontal } from 'lucide-react'

import { Board } from './Board'
import { LogoMark } from './Logo'
import { cx } from '../lib/cx'

export function Monogram({ initials, hue, className }: { initials: string; hue: number; className?: string }) {
  return (
    <span
      className={cx('round grid size-6 shrink-0 place-items-center text-[10px] font-semibold text-white', className)}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${hue + 40} 70% 48%))`,
      }}
    >
      {initials}
    </span>
  )
}

// Ruy Lopez, after 5...Be7. Static so the mock looks like a real game.
export const gamePosition = [
  'r.bqk..r',
  'ppppbppp',
  'p....n..',
  '....p...',
  'B...P...',
  '.....N..',
  'PPPP.PPP',
  'RNBQ.RK.',
]

const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7']

const level = 7
const totalLevels = 15

export function GameMock() {
  return (
    <div className="depth relative flex aspect-[16/11] w-full flex-col overflow-hidden rounded-window bg-surface text-left shadow-glow sm:aspect-[16/9]">
      {/* Title bar */}
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line px-3">
        <LogoMark className="size-6 rounded-[8px]" />
        <span className="text-[12px] font-semibold">ZenChess</span>
        <span className="hidden text-[11px] text-faint sm:inline">Stockfish 17 · NNUE</span>
        <div className="ml-auto flex items-center gap-1 text-[11px]">
          <span className="rounded-[7px] bg-white/[0.08] px-2 py-1 text-fg">Play</span>
          <span className="px-2 py-1 text-muted">Analyse</span>
          <span className="hidden px-2 py-1 text-muted sm:inline">Library</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[1fr_216px]">
        {/* Board */}
        <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 p-3 sm:p-4">
          <PlayerRow name="Stockfish 17" detail={`Level ${level} · 1500`} clock="5:00" engine />
          <Board position={gamePosition} highlight={['a7', 'a6']} className="max-w-[380px]" />
          <PlayerRow name="You" detail="White to move" clock="4:52" />
        </div>

        {/* Engine panel */}
        <div className="hidden flex-col gap-3 border-l border-line bg-bg/40 p-3 sm:flex">
          <div className="depth relative rounded-[12px] bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <SlidersHorizontal className="size-3" />
              Engine level
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-[15px] font-semibold">Level {level}</span>
              <span className="text-[11px] text-accent">1500 Elo</span>
            </div>
            <div className="mt-2 flex gap-[3px]">
              {Array.from({ length: totalLevels }, (_, i) => (
                <span
                  key={i}
                  className={cx('h-3 flex-1 rounded-[2px]', i < level ? 'bg-accent' : 'bg-white/10')}
                />
              ))}
            </div>
          </div>

          <div className="depth relative rounded-[12px] bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Evaluation</span>
              <span className="tabular-nums text-accent-2">+0.32</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-[#1b1411]">
              <div className="h-full w-[56%] rounded-[3px] bg-gradient-to-r from-[#fdf6ec] to-[#e6cdb4]" />
            </div>
            <ul className="mt-2.5 flex flex-col gap-1.5 text-[11px] tabular-nums">
              {[
                ['+0.32', '6.Re1 b5 7.Bb3 d6'],
                ['+0.28', '6.d3 O-O 7.c3 d5'],
              ].map(([score, line], i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.12, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <span className={cx('w-9 shrink-0', i === 0 ? 'text-accent-2' : 'text-muted')}>{score}</span>
                  <span className="truncate text-fg/80">{line}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="depth relative flex min-h-0 flex-1 flex-col rounded-[12px] bg-white/[0.03] p-2.5">
            <p className="text-[11px] text-muted">Moves</p>
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] tabular-nums">
              {moves.map((move, i) => (
                <motion.span
                  key={`${move}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.06 }}
                  className={cx(
                    'rounded-[4px] px-1',
                    i % 2 === 0 ? 'text-fg/85' : 'text-muted',
                    i === moves.length - 1 && 'bg-accent/15 text-accent',
                  )}
                >
                  {i % 2 === 0 && <span className="mr-1 text-faint">{i / 2 + 1}.</span>}
                  {move}
                </motion.span>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-1.5 rounded-[8px] bg-white/[0.04] px-2 py-1.5 text-[10px] text-muted">
              <Clock className="size-3 text-accent" />
              Blitz 5+0 · rated
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayerRow({
  name,
  detail,
  clock,
  engine = false,
}: {
  name: string
  detail: string
  clock: string
  engine?: boolean
}) {
  return (
    <div className="flex w-full max-w-[380px] items-center gap-2">
      {engine ? (
        <LogoMark className="size-6 rounded-[8px]" />
      ) : (
        <Monogram initials="RT" hue={28} className="size-6 text-[9px]" />
      )}
      <span className="truncate text-[11px] font-medium">{name}</span>
      <span className="hidden truncate text-[10px] text-faint sm:inline">{detail}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1 rounded-[7px] bg-white/[0.06] px-1.5 py-0.5 text-[11px] tabular-nums">
        <Clock className="size-3 text-muted" />
        {clock}
      </span>
    </div>
  )
}
