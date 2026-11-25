import { Container } from './Container'
import { Logo } from './Logo'
import { SettingsButton } from './SettingsDialog'
import { cx } from '../lib/cx'

const links = [
  { label: 'Play', href: '#/play', key: 'play' },
  { label: 'Analyse', href: '#/analyse', key: 'analyse' },
  { label: 'Review', href: '#/review', key: 'review' },
  { label: 'Learn', href: '#/learn', key: 'learn' },
]

export function AppBar({ current }: { current?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <Container className="flex h-14 items-center gap-2">
        <Logo className="text-[15px]" />
        <nav className="ml-1 hidden items-center gap-0.5 sm:flex md:ml-3">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              aria-current={current === link.key ? 'page' : undefined}
              className={cx(
                'inline-flex h-8 items-center rounded-[10px] px-2.5 text-[13px] transition-colors',
                current === link.key ? 'bg-white/[0.07] text-fg' : 'text-muted hover:bg-white/[0.05] hover:text-fg',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <SettingsButton />
          <a
            href="#/support"
            className="inline-flex h-8 items-center rounded-[10px] px-2.5 text-[13px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
          >
            Support
          </a>
        </div>
      </Container>
    </header>
  )
}
