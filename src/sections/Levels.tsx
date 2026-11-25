import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

import { Button } from '../components/Button'
import { Container } from '../components/Container'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { levels } from '../content'
import { LEVEL_BANDS, LEVEL_COUNT } from '../lib/levels'
import { cx } from '../lib/cx'

export function Levels() {
  return (
    <section id="levels" className="scroll-mt-24 border-t border-line py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={levels.eyebrow} title={levels.title} description={levels.description} />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_BANDS.map((band, i) => (
            <Reveal key={band.name} delay={(i % 3) * 0.08} className="h-full">
              <article className="depth relative flex h-full flex-col rounded-card bg-surface p-6 shadow-glow transition-colors duration-300 hover:[--depth-edge:rgb(255_236_224/0.22)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-semibold tracking-tight">{band.name}</h3>
                  <span className="shrink-0 text-[12px] tabular-nums text-accent">Level {band.levels}</span>
                </div>

                <div className="mt-4 flex items-end gap-[3px]" aria-hidden>
                  {Array.from({ length: LEVEL_COUNT }, (_, step) => (
                    <motion.span
                      key={step}
                      initial={{ opacity: 0.15 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 + step * 0.015, duration: 0.3 }}
                      className={cx('h-2.5 flex-1 rounded-[2px]', step < band.top ? 'bg-accent' : 'bg-white/[0.08]')}
                    />
                  ))}
                </div>

                <p className="mt-2 text-[13px] font-medium tabular-nums text-fg/80">{band.elo} Elo</p>
                <p className="mt-3 text-pretty text-[14px] leading-relaxed text-muted">{band.description}</p>
                <p className="mt-4 border-t border-line pt-3 text-[12px] text-faint">{band.note}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="mx-auto max-w-xl text-center text-[13px] leading-relaxed text-faint">
              Every level is a mix of search depth, engine skill and a chance of a human mistake — so 1200 plays like a
              1200 player, not like a throttled master.
            </p>
            <Button href="#/play" variant="secondary">
              Try the ladder
              <ArrowRight />
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
