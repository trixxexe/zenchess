import { Check } from 'lucide-react'

import { Button } from '../components/Button'
import { Container } from '../components/Container'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { free } from '../content'

export function FreeForever() {
  return (
    <section id="free" className="scroll-mt-24 border-t border-line py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={free.eyebrow} title={free.title} description={free.description} />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {free.promises.map((promise, index) => (
            <Reveal key={promise.title} delay={index * 0.06} className="h-full">
              <article className="depth relative flex h-full flex-col rounded-card-sm bg-surface p-5 shadow-glow">
                <span className="grid size-7 place-items-center rounded-[9px] bg-accent/15 text-accent">
                  <Check className="size-3.5" />
                </span>
                <h3 className="mt-3 text-[15px] font-semibold tracking-tight">{promise.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{promise.description}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-8 flex justify-center">
            <Button href="#/play" size="lg">
              Start playing
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
