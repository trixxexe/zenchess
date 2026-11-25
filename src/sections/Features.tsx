import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import type { ReactElement } from 'react'

import { Container } from '../components/Container'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { features } from '../content'
import { GUIDES } from '../content/guides'
import { LEVELS } from '../lib/levels'
import { cx } from '../lib/cx'

const visuals: Record<string, () => ReactElement> = {
  levels: LevelsVisual,
  analysis: AnalysisVisual,
  local: LocalVisual,
  guides: GuidesVisual,
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={features.eyebrow} title={features.title} description={features.description} />
        <div className="mt-14 grid auto-rows-[320px] grid-cols-1 gap-4 md:grid-cols-3">
          {features.items.map((item, i) => {
            const Visual = visuals[item.key]
            return (
              <Reveal key={item.key} delay={(i % 3) * 0.08} className={cx(item.span === 2 && 'md:col-span-2')}>
                <article className="depth group relative flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-glow transition-colors duration-300 hover:[--depth-edge:rgb(255_236_224/0.22)]">
                  <div className="relative flex-1 overflow-hidden">
                    <Visual />
                  </div>
                  {/* Fixed height so dividers line up across a row regardless of copy length. */}
                  <div className="relative h-[96px] border-t border-line px-6 pt-4">
                    <h3 className="text-[16px] font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-muted">{item.description}</p>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

const LEVEL = 12

function LevelsVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 p-6">
      <div className="depth relative rounded-[16px] bg-bg/50 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] text-muted">Engine strength</span>
          <span className="text-[13px] font-medium text-accent">Level {LEVEL} · 1600 Elo</span>
        </div>
        <div className="mt-4 flex h-14 items-end gap-1">
          {Array.from({ length: LEVELS.length }, (_, i) => (
            <motion.span
              key={i}
              initial={{ height: '12%', opacity: 0.35 }}
              whileInView={{ height: `${34 + i * 3.3}%`, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.025, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={cx('flex-1 rounded-[3px]', i < LEVEL ? 'bg-gradient-to-t from-accent/40 to-accent' : 'bg-white/10')}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] tabular-nums text-faint">
          <span>500 Elo</span>
          <span>3190 Elo</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {['Human-like play', 'No takebacks at 16+', 'Clocks included'].map((chip) => (
          <span key={chip} className="depth relative rounded-[9px] bg-white/[0.04] px-2.5 py-1 text-[11px] text-muted">
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function AnalysisVisual() {
  const lines = [
    { score: '+1.24', line: '18.Nxe5 fxe5 19.Qh5+', best: true },
    { score: '+0.41', line: '18.Bg5 Bxg5 19.Nxe5', best: false },
    { score: '+0.12', line: '18.d5 exd5 19.cxd5', best: false },
  ]
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6">
      <motion.ul
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-1.5"
      >
        {lines.map((l) => (
          <li
            key={l.line}
            className={cx(
              'depth relative flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[11px] tabular-nums',
              l.best ? 'bg-accent/[0.12] [--depth-edge:rgb(255_122_69/0.4)]' : 'bg-white/[0.03] [--depth-edge:var(--color-line)]',
            )}
          >
            <span className={cx('w-10 shrink-0 font-medium', l.best ? 'text-accent' : 'text-muted')}>{l.score}</span>
            <span className={cx('truncate', l.best ? 'text-fg' : 'text-muted')}>{l.line}</span>
          </li>
        ))}
      </motion.ul>
      <p className="mt-1 text-[11px] leading-snug text-faint">
        Lines in SAN, an evaluation bar, and an arrow on the board.
      </p>
    </div>
  )
}

function LocalVisual() {
  const rows = [
    { label: 'Engine', value: 'On your device' },
    { label: 'Account', value: 'Not required' },
    { label: 'Uploads', value: 'None' },
  ]
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.45 }}
          className="depth relative flex items-center gap-2 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[11px]"
        >
          <Check className="size-3.5 text-accent-2" />
          <span className="text-muted">{row.label}</span>
          <span className="ml-auto text-fg/85">{row.value}</span>
        </motion.div>
      ))}
    </div>
  )
}

function GuidesVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6">
      {GUIDES.slice(0, 3).map((guide, i) => (
        <motion.div
          key={guide.slug}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="depth relative flex items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-accent/15 text-[10px] font-semibold text-accent">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{guide.title}</span>
          <span className="shrink-0 text-[10px] tabular-nums text-faint">{guide.minutes} min</span>
        </motion.div>
      ))}
    </div>
  )
}
