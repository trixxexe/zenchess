import { Chess, type Color, type Move } from 'chess.js'
import { ArrowLeftRight, Copy, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AppBar } from '../components/AppBar'
import { Button } from '../components/Button'
import { ChessBoard, type BoardMove } from '../components/ChessBoard'
import { Container } from '../components/Container'
import { evalShare, formatScore, formatVariation, pvToSan } from '../lib/chess'
import { getEngine, type EngineResult } from '../lib/engine'
import { findOpening } from '../lib/openings'
import { playSound } from '../lib/sound'
import { cx } from '../lib/cx'

type Position = {
  fen: string
  turn: Color
  legal: Move[]
  board: ReturnType<Chess['board']>
  history: Move[]
  lastMove: { from: string; to: string } | null
  inCheck: boolean
}

function snapshot(game: Chess): Position {
  const history = game.history({ verbose: true })
  return {
    fen: game.fen(),
    turn: game.turn(),
    legal: game.moves({ verbose: true }),
    board: game.board(),
    history,
    lastMove: history.length ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null,
    inCheck: game.isCheck(),
  }
}

export function Analyse() {
  const gameRef = useRef(new Chess())
  const [position, setPosition] = useState<Position>(() => snapshot(gameRef.current))
  const [orientation, setOrientation] = useState<Color>('w')
  const [depth, setDepth] = useState(14)
  const [multiPv, setMultiPv] = useState(2)
  const [result, setResult] = useState<EngineResult | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [engineState, setEngineState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [engineError, setEngineError] = useState('')
  const [loadText, setLoadText] = useState('')
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState('')
  const generation = useRef(0)

  useEffect(() => {
    let alive = true
    getEngine()
      .start()
      .then(() => alive && setEngineState('ready'))
      .catch((error: unknown) => {
        if (!alive) return
        setEngineState('error')
        setEngineError(error instanceof Error ? error.message : 'The engine failed to load.')
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 2000)
    return () => window.clearTimeout(id)
  }, [toast])

  // Analyse the current position, debounced so dragging does not spam the engine.
  useEffect(() => {
    if (engineState !== 'ready') return
    const token = ++generation.current
    setAnalysing(true)
    const id = window.setTimeout(() => {
      getEngine()
        .analyse(position.fen, { depth, multipv: multiPv })
        .then((next) => {
          if (token === generation.current) setResult(next)
        })
        .catch((error: unknown) => {
          if (token !== generation.current) return
          setEngineState('error')
          setEngineError(error instanceof Error ? error.message : 'The engine stopped responding.')
        })
        .finally(() => {
          if (token === generation.current) setAnalysing(false)
        })
    }, 220)
    return () => window.clearTimeout(id)
  }, [depth, engineState, multiPv, position.fen])

  const applyMove = useCallback((move: BoardMove) => {
    const game = gameRef.current
    try {
      game.move(move)
    } catch {
      return
    }
    const history = game.history({ verbose: true })
    const last = history[history.length - 1]
    if (last) {
      const captured = last.flags.includes('c') || last.flags.includes('e')
      if (last.flags.includes('p')) playSound('promote')
      else if (captured) playSound('capture')
      else if (last.flags.includes('k') || last.flags.includes('q')) playSound('castle')
      else playSound('move')
      if (game.isCheck()) playSound('check')
    }
    setPosition(snapshot(game))
  }, [])

  function undo() {
    if (!gameRef.current.history().length) return
    gameRef.current.undo()
    setPosition(snapshot(gameRef.current))
  }

  function reset() {
    gameRef.current = new Chess()
    setPosition(snapshot(gameRef.current))
    setLoadText('')
    setLoadError('')
  }

  function load() {
    const text = loadText.trim()
    if (!text) return
    const game = new Chess()
    try {
      if (/\[[A-Za-z]+\s+"/.test(text) || /\d+\.\s*\S+/.test(text) && !/^[rnbqkRNBQK1-8/]+ [wb] /.test(text)) {
        game.loadPgn(text)
      } else {
        game.load(text)
      }
      gameRef.current = game
      setPosition(snapshot(game))
      setLoadError('')
      setToast('Position loaded')
    } catch {
      setLoadError('That is not a valid FEN or PGN.')
    }
  }

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      setToast(message)
    } catch {
      setToast('Copying is blocked in this browser.')
    }
  }

  const bestMove = result?.lines[0]?.pv?.[0] ?? result?.bestMove ?? null
  const share = evalShare(result?.lines[0]?.score, position.turn)
  const opening = useMemo(() => findOpening(position.history.map((move) => move.san)), [position.history])

  return (
    <div className="min-h-dvh pb-16">
      <AppBar current="analyse" />
      <Container className="pt-6 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="mx-auto flex w-full max-w-[600px] gap-3">
            <EvalBar share={share} orient={orientation} score={formatScore(result?.lines[0]?.score, position.turn)} />
            <div className="min-w-0 flex-1">
              <ChessBoard
                board={position.board}
                turn={position.turn}
                moves={position.legal}
                orientation={orientation}
                lastMove={position.lastMove}
                inCheck={position.inCheck}
                onMove={applyMove}
                arrow={bestMove}
              />
              <p className="mt-2 truncate px-0.5 text-[11px] text-faint">
                {opening?.name ?? 'Starting position'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!position.history.length}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2.5 text-[12px] text-muted transition-colors hover:text-fg disabled:pointer-events-none disabled:opacity-40"
                >
                  <RotateCcw className="size-3.5" /> Undo
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2.5 text-[12px] text-muted transition-colors hover:text-fg"
                >
                  <Trash2 className="size-3.5" /> Start position
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2.5 text-[12px] text-muted transition-colors hover:text-fg"
                >
                  <ArrowLeftRight className="size-3.5" /> Flip
                </button>
                <button
                  type="button"
                  onClick={() => copy(position.fen, 'FEN copied')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2.5 text-[12px] text-muted transition-colors hover:text-fg"
                >
                  <Copy className="size-3.5" /> FEN
                </button>
                <button
                  type="button"
                  onClick={() => copy(gameRef.current.pgn(), 'PGN copied')}
                  disabled={!position.history.length}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2.5 text-[12px] text-muted transition-colors hover:text-fg disabled:pointer-events-none disabled:opacity-40"
                >
                  <Copy className="size-3.5" /> PGN
                </button>
                {toast && <span className="text-[11px] text-accent-2">{toast}</span>}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-3">
            <section className="depth relative rounded-card bg-surface p-4 shadow-glow">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold">Engine</h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
                  {analysing && <Loader2 className="size-3 animate-spin" />}
                  {engineState === 'ready' ? (analysing ? `depth ${result?.depth ?? 0}+` : `depth ${result?.depth ?? 0}`) : engineState}
                </span>
              </div>

              <ol className="mt-3 flex flex-col gap-1.5">
                {(result?.lines ?? []).map((line) => (
                  <li
                    key={line.multipv}
                    className={cx(
                      'depth relative rounded-[10px] px-2.5 py-2 text-[12px]',
                      line.multipv === 1
                        ? 'bg-accent/[0.1] [--depth-edge:rgb(255_122_69/0.35)]'
                        : 'bg-white/[0.03] [--depth-edge:var(--color-line)]',
                    )}
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cx(
                          'shrink-0 font-medium tabular-nums',
                          line.multipv === 1 ? 'text-accent' : 'text-muted',
                        )}
                      >
                        {formatScore(line.score, position.turn)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-fg/85">
                        {formatVariation(position.fen, pvToSan(position.fen, line.pv, 8))}
                      </span>
                    </div>
                  </li>
                ))}
                {!result?.lines.length && (
                  <li className="rounded-[10px] bg-white/[0.03] px-2.5 py-3 text-[12px] text-faint">
                    {engineState === 'error' ? engineError : 'Waiting for the engine…'}
                  </li>
                )}
              </ol>

              <div className="mt-4 space-y-3">
                <label className="block text-[11px] text-faint" htmlFor="depth">
                  Depth <span className="tabular-nums text-muted">{depth}</span>
                </label>
                <input
                  id="depth"
                  type="range"
                  min={8}
                  max={20}
                  value={depth}
                  onChange={(event) => setDepth(Number(event.target.value))}
                  className="w-full accent-[#ff7a45]"
                />
                <label className="block text-[11px] text-faint" htmlFor="multipv">
                  Lines <span className="tabular-nums text-muted">{multiPv}</span>
                </label>
                <input
                  id="multipv"
                  type="range"
                  min={1}
                  max={3}
                  value={multiPv}
                  onChange={(event) => setMultiPv(Number(event.target.value))}
                  className="w-full accent-[#ff7a45]"
                />
              </div>
            </section>

            <section className="depth relative rounded-card bg-surface p-4 shadow-glow">
              <h2 className="text-[13px] font-semibold">Load a position</h2>
              <textarea
                value={loadText}
                onChange={(event) => {
                  setLoadText(event.target.value)
                  setLoadError('')
                }}
                rows={3}
                spellCheck={false}
                placeholder="Paste a FEN or PGN…"
                className="mt-2 w-full resize-none rounded-[10px] bg-white/[0.04] p-2.5 text-[12px] text-fg placeholder:text-faint outline-none focus:[box-shadow:inset_0_0_0_1px_rgb(255_122_69/0.6)]"
              />
              {loadError && <p className="mt-1 text-[11px] text-accent-3">{loadError}</p>}
              <Button variant="secondary" className="mt-2 h-9 w-full text-[12px]" onClick={load}>
                Load position
              </Button>
            </section>

            <section className="depth relative flex min-h-[120px] flex-col rounded-card bg-surface p-4 shadow-glow">
              <h2 className="text-[13px] font-semibold">Moves</h2>
              {position.history.length === 0 ? (
                <p className="mt-4 text-[12px] text-faint">Move a piece to begin.</p>
              ) : (
                <ol className="mt-2 grid max-h-[200px] grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto text-[12px] tabular-nums">
                  {position.history.map((move, index) => (
                    <li key={`${move.from}${move.to}${index}`} className={cx('truncate', index % 2 === 0 ? 'text-fg/85' : 'text-muted')}>
                      {index % 2 === 0 && <span className="mr-1 text-faint">{Math.floor(index / 2) + 1}.</span>}
                      {move.san}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </Container>
    </div>
  )
}

function EvalBar({ share, orient, score }: { share: number; orient: Color; score: string }) {
  const whiteShare = orient === 'w' ? share : 1 - share
  return (
    <div className="hidden w-6 shrink-0 flex-col items-center gap-1 sm:flex">
      <div className="relative w-3 flex-1 overflow-hidden rounded-[6px] bg-[#1b1411]">
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#cbb49c] to-[#fdf6ec] transition-[height] duration-300"
          style={{ height: `${whiteShare * 100}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-faint">{score}</span>
    </div>
  )
}
