import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { Board } from '../components/Board'
import { Container } from '../components/Container'
import { gamePosition, Monogram } from '../components/GameMock'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { showcase } from '../content'
import { GUIDES } from '../content/guides'
import { cx } from '../lib/cx'

export function Showcase() {
  const [active, setActive] = useState(showcase.tabs[0].key)
  return (
    <section className="border-t border-line py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={showcase.eyebrow} title={showcase.title} align="left" />
        <div className="mt-12 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
          <Reveal>
            <ul className="flex flex-col gap-1">
              {showcase.tabs.map((tab) => {
                const isActive = tab.key === active
                return (
                  <li key={tab.key}>
                    <button
                      type="button"
                      onClick={() => setActive(tab.key)}
                      aria-pressed={isActive}
                      className={cx(
                        'relative w-full rounded-card-sm px-5 py-4 text-left transition-colors',
                        isActive ? 'bg-surface' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="showcase-active"
                          className="depth absolute inset-0 rounded-card-sm"
                          transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                        />
                      )}
                      <span className={cx('relative block text-[16px] font-semibold', isActive ? 'text-fg' : 'text-muted')}>
                        {tab.title}
                      </span>
                      <span className="relative mt-1 block text-[14px] leading-relaxed text-muted">{tab.description}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <a
              href="#/play"
              className="mt-4 inline-flex items-center gap-1.5 px-1 text-[13px] text-accent transition-colors hover:text-accent-2"
            >
              Open the app
              <ArrowRight className="size-3.5" />
            </a>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="depth relative aspect-[16/10] overflow-hidden rounded-card bg-surface shadow-glow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.99 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 p-5 sm:p-7"
                >
                  {active === 'play' && <PlayPanel />}
                  {active === 'analyse' && <AnalysePanel />}
                  {active === 'learn' && <LearnPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7']

function PlayPanel() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-[1fr_150px]">
      <div className="flex min-h-0 items-center justify-center">
        <Board position={gamePosition} highlight={['a7', 'a6']} className="w-full max-w-[230px]" />
      </div>
      <div className="flex min-h-0 flex-col gap-2">
        <ClockCard name="Stockfish 17" detail="Level 7" time="5:00" engine />
        <ClockCard name="You" detail="White" time="4:52" />
        <div className="depth relative mt-auto flex min-h-0 flex-1 flex-col rounded-[12px] bg-bg/50 p-2.5">
          <p className="text-[10px] text-faint">Moves</p>
          <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] tabular-nums">
            {moves.map((move, i) => (
              <span key={`${move}-${i}`} className={cx(i % 2 === 0 ? 'text-fg/85' : 'text-muted', 'truncate')}>
                {i % 2 === 0 && <span className="mr-1 text-faint">{i / 2 + 1}.</span>}
                {move}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ClockCard({ name, detail, time, engine = false }: { name: string; detail: string; time: string; engine?: boolean }) {
  return (
    <div className="depth relative flex items-center gap-2 rounded-[12px] bg-white/[0.03] px-2.5 py-2">
      <Monogram initials={engine ? 'SF' : 'RT'} hue={engine ? 28 : 250} className="size-5 text-[9px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium">{name}</p>
        <p className="truncate text-[10px] text-faint">{detail}</p>
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-fg/90">{time}</span>
    </div>
  )
}

function AnalysePanel() {
  const points = [8, 12, 10, 18, 26, 22, 30, 24, 34, 40, 36, 32, 44, 48, 52, 60]
  const w = 400
  const h = 140
  const step = w / (points.length - 1)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * step},${h - (p / 70) * h}`).join(' ')
  const area = `${d} L${w},${h} L0,${h} Z`

  return (
    <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-[1fr_150px]">
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-2 text-muted">
            <span className="round size-2 bg-accent" /> Evaluation
          </span>
          <span className="tabular-nums text-accent-2">+0.32</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full flex-1" preserveAspectRatio="none">
          <defs>
            <linearGradient id="eval-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff7a45" stopOpacity="0.32" />
              <stop offset="1" stopColor="#ff7a45" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="rgba(255,255,255,0.06)" />
          ))}
          <path d={area} fill="url(#eval-area)" />
          <motion.path
            d={d}
            fill="none"
            stroke="#ff9a6b"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        </svg>
        <div className="flex gap-1">
          {moves.slice(0, 8).map((move, i) => (
            <span
              key={`${move}-${i}`}
              className={cx(
                'flex-1 rounded-[3px] py-0.5 text-center text-[9px] tabular-nums',
                i === 7 ? 'bg-accent/20 text-accent' : 'bg-white/[0.05] text-faint',
              )}
            >
              {move}
            </span>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 items-center justify-center">
        <Board position={gamePosition} arrow={{ from: 'f1', to: 'e1' }} className="w-full max-w-[150px]" />
      </div>
    </div>
  )
}

function LearnPanel() {
  return (
    <div className="flex h-full flex-col">
      <p className="text-[11px] text-faint">Guides</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {GUIDES.slice(0, 4).map((guide, i) => (
          <motion.li
            key={guide.slug}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="depth relative flex items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-accent/15 text-[10px] font-semibold text-accent">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{guide.title}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-faint">{guide.minutes} min</span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-auto text-[11px] leading-snug text-faint">
        Five guides on openings, tactics, endgames and practice — no account, no paywall.
      </p>
    </div>
  )
}
