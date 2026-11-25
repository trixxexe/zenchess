import { Settings2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { cx } from '../lib/cx'
import { updateSettings, useSettings, type Settings } from '../lib/store'

const OPTIONS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'sound', label: 'Sound', hint: 'Move, capture, check and result sounds.' },
  { key: 'animation', label: 'Piece animation', hint: 'Slide pieces to their new square.' },
  { key: 'coordinates', label: 'Board coordinates', hint: 'Files and ranks in the corner squares.' },
  { key: 'legalMoves', label: 'Legal move dots', hint: 'Show where the selected piece can go.' },
  { key: 'autoQueen', label: 'Auto-promote to queen', hint: 'Skip the promotion picker.' },
]

/** A settings cog for the app bar; the choices are remembered on this device. */
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const settings = useSettings()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        onClick={() => setOpen(true)}
        className="grid size-8 place-items-center rounded-[10px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
      >
        <Settings2 className="size-4" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
              className="depth relative w-full max-w-[360px] rounded-card bg-surface p-5 shadow-glow"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold">Settings</h2>
                  <p className="mt-0.5 text-[11px] text-faint">Saved on this device. No account needed.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close settings"
                  onClick={() => setOpen(false)}
                  className="grid size-7 shrink-0 place-items-center rounded-[8px] text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-1">
                {OPTIONS.map((option) => {
                  const value = settings[option.key]
                  return (
                    <button
                      key={option.key}
                      type="button"
                      role="switch"
                      aria-checked={value}
                      onClick={() => updateSettings({ [option.key]: !value })}
                      className="flex items-center gap-3 rounded-[10px] px-1.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium">{option.label}</span>
                        <span className="block text-[11px] leading-snug text-faint">{option.hint}</span>
                      </span>
                      <span
                        className={cx(
                          'round relative h-6 w-10 shrink-0 transition-colors',
                          value ? 'bg-accent' : 'bg-white/[0.12]',
                        )}
                      >
                        <span
                          className={cx(
                            'round absolute top-0.5 size-5 bg-white transition-[left] duration-150',
                            value ? 'left-[18px]' : 'left-0.5',
                          )}
                        />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
