import { ArrowLeft, ArrowRight } from 'lucide-react'

import { AppBar } from '../components/AppBar'
import { Button } from '../components/Button'
import { Container } from '../components/Container'
import { GUIDES, guideBySlug } from '../content/guides'

export function Learn() {
  return (
    <div className="min-h-dvh pb-20">
      <AppBar current="learn" />
      <Container className="pt-10 sm:pt-14">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-accent">Guides</p>
          <h1 className="mt-3 text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
            Learn the game, not the tricks
          </h1>
          <p className="mt-4 text-pretty text-[16px] leading-relaxed text-muted">
            Five short guides covering the ideas that actually decide club games: how the levels work, what to do in
            the opening, the tactics worth drilling, and the endgames you keep reaching.
          </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {GUIDES.map((guide, index) => (
            <li key={guide.slug}>
              <a
                href={`#/learn/${guide.slug}`}
                className="depth group relative flex h-full flex-col rounded-card bg-surface p-6 shadow-glow transition-colors hover:[--depth-edge:rgb(255_236_224/0.22)]"
              >
                <div className="flex items-center gap-2 text-[11px] text-faint">
                  <span className="tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <span aria-hidden>·</span>
                  <span>{guide.minutes} min read</span>
                  <span aria-hidden>·</span>
                  <span>{guide.level}</span>
                </div>
                <h2 className="mt-3 text-[18px] font-semibold tracking-tight">{guide.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{guide.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-accent">
                  Read
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="depth relative mt-10 flex flex-col items-start gap-4 rounded-card bg-surface p-6 shadow-glow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[16px] font-semibold">Reading is not playing.</p>
            <p className="mt-1 text-[14px] text-muted">Pick a level and try it against the engine.</p>
          </div>
          <Button href="#/play">
            Play now
            <ArrowRight />
          </Button>
        </div>
      </Container>
    </div>
  )
}

export function LearnArticle({ slug }: { slug: string }) {
  const guide = guideBySlug(slug)
  if (!guide) {
    return (
      <div className="min-h-dvh">
        <AppBar current="learn" />
        <Container className="pt-16">
          <h1 className="text-[28px] font-semibold">That guide does not exist.</h1>
          <Button href="#/learn" variant="secondary" className="mt-6">
            All guides
          </Button>
        </Container>
      </div>
    )
  }

  const index = GUIDES.findIndex((entry) => entry.slug === guide.slug)
  const next = GUIDES[index + 1]

  return (
    <div className="min-h-dvh pb-20">
      <AppBar current="learn" />
      <Container className="max-w-[720px] pt-8 sm:pt-12">
        <a
          href="#/learn"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-3.5" />
          All guides
        </a>

        <p className="mt-8 text-[12px] text-faint">
          {guide.minutes} min read · {guide.level}
        </p>
        <h1 className="mt-2 text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[42px]">
          {guide.title}
        </h1>
        <p className="mt-4 text-pretty text-[17px] leading-relaxed text-muted">{guide.description}</p>

        <article className="mt-10 flex flex-col gap-8">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[19px] font-semibold tracking-tight">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-[16px] leading-[1.75] text-fg/85">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-4 flex flex-col gap-2 border-l border-line pl-4">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="text-[15px] leading-relaxed text-muted">
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button href="#/play">Play a game</Button>
          {next ? (
            <a
              href={`#/learn/${next.slug}`}
              className="group inline-flex flex-col text-right text-[13px] text-muted transition-colors hover:text-fg"
            >
              <span className="text-[11px] text-faint">Next</span>
              <span className="inline-flex items-center gap-1.5">
                {next.title}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ) : (
            <a href="#/learn" className="text-[13px] text-muted transition-colors hover:text-fg">
              Back to all guides
            </a>
          )}
        </div>
      </Container>
    </div>
  )
}
