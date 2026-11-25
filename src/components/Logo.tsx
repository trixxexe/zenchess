import { cx } from '../lib/cx'
import { brand } from '../content'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'depth relative grid size-8 shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-surface-2 to-raised',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="url(#logo-g)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff9a6b" />
            <stop offset="1" stopColor="#ffc46b" />
          </linearGradient>
        </defs>
        {/* A chess king: crown, cross and base. */}
        <path d="M9.5 19.5V14L8.5 11.8l2.2-1.6L12 7l1.3 3.2 2.2 1.6L14.5 14v5.5" />
        <path d="M8 19.5h8" />
        <path d="M12 7V4.2" />
        <path d="M10.7 5.6h2.6" />
      </svg>
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#/" className={cx('inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-fg', className)}>
      <LogoMark />
      {brand.name}
    </a>
  )
}
