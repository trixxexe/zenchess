import { Bug, Check, Copy, MessageCircle } from 'lucide-react'
import { useState } from 'react'

import { Container } from '../components/Container'
import { Reveal } from '../components/Reveal'
import { SectionHeading } from '../components/SectionHeading'
import { support } from '../content'
import { issuesUrl, repoUrl } from '../lib/repo'

export function Support() {
  const [copied, setCopied] = useState(false)

  async function copyUsername() {
    try {
      await navigator.clipboard.writeText(support.discord.username)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id="support" className="scroll-mt-24 border-t border-line py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={support.eyebrow} title={support.title} description={support.description} />

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Reveal>
            <article className="depth relative flex h-full flex-col rounded-card bg-surface p-6 shadow-glow">
              <span className="grid size-9 place-items-center rounded-[10px] bg-[#5865f2]/15 text-[#8f9dff]">
                <MessageCircle className="size-4" />
              </span>
              <h3 className="mt-3 text-[17px] font-semibold tracking-tight">Discord</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{support.discord.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={support.discord.invite}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#5865f2] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Join the server
                </a>
                <button
                  type="button"
                  onClick={copyUsername}
                  className="depth relative inline-flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-fg transition-colors hover:bg-white/[0.09]"
                >
                  {copied ? <Check className="size-3.5 text-accent-2" /> : <Copy className="size-3.5 text-muted" />}
                  {support.discord.username}
                </button>
              </div>
              <p className="mt-3 text-[12px] text-faint">Mention {support.discord.username} in the server for a reply.</p>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="depth relative flex h-full flex-col rounded-card bg-surface p-6 shadow-glow">
              <span className="grid size-9 place-items-center rounded-[10px] bg-white/[0.07] text-fg">
                <Bug className="size-4" />
              </span>
              <h3 className="mt-3 text-[17px] font-semibold tracking-tight">GitHub issues</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{support.github.description}</p>
              <a
                href={issuesUrl()}
                target="_blank"
                rel="noreferrer"
                className="depth relative mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-[12px] bg-white/[0.05] px-4 text-[13px] font-medium transition-colors hover:bg-white/[0.09]"
              >
                Open an issue
              </a>
              <p className="mt-3 truncate text-[12px] text-faint">{repoUrl()}</p>
            </article>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
