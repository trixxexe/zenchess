import { ArrowRight } from 'lucide-react'

import { Aurora } from '../components/Aurora'
import { Button } from '../components/Button'
import { Container } from '../components/Container'
import { Reveal } from '../components/Reveal'
import { cta } from '../content'

export function Cta() {
  return (
    <section id="cta" className="scroll-mt-24 py-12">
      <Container>
        <Reveal>
          <div className="depth relative overflow-hidden rounded-[32px] bg-surface px-6 py-20 text-center shadow-glow sm:px-12 sm:py-28">
            <Aurora intensity={0.8} />
            <div aria-hidden className="grid-lines absolute inset-0" />
            <div aria-hidden className="noise pointer-events-none absolute inset-0" />
            <div className="relative mx-auto max-w-xl">
              <h2 className="text-balance text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
                {cta.title}
              </h2>
              <p className="mt-4 text-[16px] text-muted sm:text-[18px]">{cta.description}</p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" href={cta.primary.href}>
                  {cta.primary.label}
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="secondary" href={cta.secondary.href}>
                  {cta.secondary.label}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
