import { Container } from '../components/Container'
import type { ReactElement } from 'react'
import { Reveal } from '../components/Reveal'
import { standards } from '../content'

// Minimal geometric marks for the open chess stack the app is built on.
const marks: Record<string, ReactElement> = {
  Stockfish: <path d="M12 4c-3 2-5 5-5 8s2 6 5 8c3-2 5-5 5-8s-2-6-5-8zM7 12h10" />,
  NNUE: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  Syzygy: <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M3 12c3-6 15-6 18 0" />,
  UCI: <path d="M9 4v6M15 4v6M7 10h10v3a5 5 0 0 1-10 0zM12 18v3" />,
  PGN: <path d="M6 4h8l4 4v12H6zM14 4v4h4M9 12h6M9 16h4" />,
  FEN: <path d="M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16" />,
  Chess960: <path d="M4 18h16M6 18V9l3 3 3-6 3 6 3-3v9" />,
  WASM: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 3v18M4 7.5l8 4.5 8-4.5" />,
}

export function LogoCloud() {
  const doubled = [...standards, ...standards]
  return (
    <section className="py-12">
      <Container>
        <Reveal>
          <p className="text-center text-[13px] text-faint">Built on the open chess stack</p>
        </Reveal>
        <div className="section-mask relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <ul className="flex w-max animate-marquee items-center gap-14 pr-14 hover:[animation-play-state:paused]">
            {doubled.map((name, i) => (
              <li key={`${name}-${i}`} className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight text-fg/45">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {marks[name]}
                </svg>
                {name}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
