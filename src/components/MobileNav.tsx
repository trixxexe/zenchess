import { BookOpen, Gauge, House, Play, Search } from 'lucide-react'

import { useRoute } from '../lib/router'
import { cx } from '../lib/cx'

const items = [
  { key: 'home', label: 'Home', href: '#/', icon: House },
  { key: 'play', label: 'Play', href: '#/play', icon: Play },
  { key: 'analyse', label: 'Analyse', href: '#/analyse', icon: Search },
  { key: 'review', label: 'Review', href: '#/review', icon: Gauge },
  { key: 'learn', label: 'Learn', href: '#/learn', icon: BookOpen },
]

/** Bottom tab bar for phones; hidden from `md` upwards. */
export function MobileNav() {
  const route = useRoute()
  const current = route === '/' ? 'home' : route.split('/')[1]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ key, label, href, icon: Icon }) => {
          const active = current === key
          return (
            <li key={key}>
              <a
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-14 flex-col items-center justify-center gap-1 text-[10px] transition-colors',
                  active ? 'text-accent' : 'text-muted active:text-fg',
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
