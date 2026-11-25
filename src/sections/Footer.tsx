import { Container } from '../components/Container'
import { Logo } from '../components/Logo'
import { footer, support } from '../content'
import { issuesUrl, repoUrl } from '../lib/repo'

function resolve(href: string): { href: string; external: boolean } {
  if (href === '__repo__') return { href: repoUrl(), external: true }
  if (href === '__issues__') return { href: issuesUrl(), external: true }
  if (href === '__discord__') return { href: support.discord.invite, external: true }
  return { href, external: false }
}

export function Footer() {
  return (
    <footer className="pb-10 pt-20">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-12">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">{footer.blurb}</p>
            <p className="mt-3 text-[13px] text-faint">{footer.madeBy}</p>
            <a
              href={support.discord.invite}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[13px] text-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-fg"
            >
              Discord: {support.discord.username}
            </a>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] font-medium text-fg">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => {
                  const target = resolve(link.href)
                  return (
                    <li key={link.label}>
                      <a
                        href={target.href}
                        {...(target.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="text-[14px] text-muted transition-colors hover:text-fg"
                      >
                        {link.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col-reverse items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-[13px] text-faint">{footer.legal}</p>
            <p className="mt-1 text-[12px] text-faint">
              Engine: Stockfish 19, GPLv3, compiled to WebAssembly by{' '}
              <a
                href="https://github.com/nmrugg/stockfish.js"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line-strong underline-offset-2 transition-colors hover:text-muted"
              >
                stockfish.js
              </a>
              . Runs locally in your browser.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-faint">
            <span>Free forever</span>
            <span aria-hidden>·</span>
            <span>No accounts</span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
