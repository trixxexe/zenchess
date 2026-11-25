/**
 * Board sounds, synthesised with the Web Audio API so there are no audio files
 * to download. One context is created lazily on the first sound; browsers keep
 * it suspended until a gesture, which every move is.
 */

import { getSettings } from './store'

export type SoundKind = 'move' | 'capture' | 'castle' | 'check' | 'promote' | 'win' | 'lose' | 'draw'

let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      context = new Ctor()
    } catch {
      return null
    }
  }
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined)
  }
  return context
}

type ToneOptions = {
  frequency: number
  to?: number
  duration: number
  delay?: number
  gain?: number
  type?: OscillatorType
}

function tone(ctx: AudioContext, { frequency, to, duration, delay = 0, gain = 0.16, type = 'triangle' }: ToneOptions) {
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** Play one board sound, honouring the saved sound setting. */
export function playSound(kind: SoundKind) {
  if (!getSettings().sound) return
  const ctx = audio()
  if (!ctx) return

  switch (kind) {
    case 'move':
      tone(ctx, { frequency: 300, to: 236, duration: 0.07, gain: 0.11 })
      break
    case 'capture':
      tone(ctx, { frequency: 190, to: 120, duration: 0.13, gain: 0.19, type: 'square' })
      tone(ctx, { frequency: 520, to: 340, duration: 0.06, gain: 0.06 })
      break
    case 'castle':
      tone(ctx, { frequency: 300, to: 250, duration: 0.06, gain: 0.1 })
      tone(ctx, { frequency: 340, to: 280, duration: 0.07, gain: 0.1, delay: 0.08 })
      break
    case 'check':
      tone(ctx, { frequency: 660, duration: 0.1, gain: 0.09, delay: 0.05, type: 'sine' })
      tone(ctx, { frequency: 880, duration: 0.13, gain: 0.08, delay: 0.15, type: 'sine' })
      break
    case 'promote':
      ;[523, 659, 784].forEach((frequency, index) =>
        tone(ctx, { frequency, duration: 0.14, gain: 0.1, delay: index * 0.07, type: 'sine' }),
      )
      break
    case 'win':
      ;[523, 659, 784, 1046].forEach((frequency, index) =>
        tone(ctx, { frequency, duration: 0.22, gain: 0.09, delay: index * 0.1, type: 'sine' }),
      )
      break
    case 'lose':
      ;[392, 330, 262].forEach((frequency, index) =>
        tone(ctx, { frequency, duration: 0.24, gain: 0.09, delay: index * 0.12, type: 'sine' }),
      )
      break
    case 'draw':
      tone(ctx, { frequency: 440, duration: 0.16, gain: 0.08, type: 'sine' })
      tone(ctx, { frequency: 440, duration: 0.18, gain: 0.08, delay: 0.18, type: 'sine' })
      break
  }
}
