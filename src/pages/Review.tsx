import { Chess, type Color } from 'chess.js'
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AppBar } from '../components/AppBar'
import { Button } from '../components/Button'
import { ChessBoard } from '../components/ChessBoard'
import { Container } from '../components/Container'
import { getEngine } from '../lib/engine'
import { buildReport, PHASE_LABEL } from '../lib/report'
import {
  CLASS_COLOR,
  CLASS_LABEL,
  ReviewCancelled,
  accuracyGrade,
  formatEval,
  reviewGame,
  reviewSummaryText,
  type MoveClass,
  type ReviewResult,
} from '../lib/review'
import { attachAccuracy, loadArchive, readLastGame } from '../lib/store'
import { cx } from '../lib/cx'

export function Review() {
  const [lastGame] = useState(readLastGame)
  const [pgn, setPgn] = useState(lastGame?.pgn ?? '')
  const [player, setPlayer] = useState<Color>(lastGame?.player ?? 'w')
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [review, setReview] = useState<ReviewResult | null>(null)
  const [ply, setPly] = useState(0)
  const [error, setError] = useState('')
  const [engineState, setEngineState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [archive, setArchive] = useState(() => loadArchive())
  const cancelled = useRef(false)
  const movesScrollRef = useRef<HTMLDivElement>(null)

  // Keep the move being looked at in view.
  useEffect(() => {
    const active = movesScrollRef.current?.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [ply])

  useEffect(() => {
    let alive = true
    getEngine()
      .start()
      .then(() => alive && setEngineState('ready'))
      .catch(() => alive && setEngineState('error'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (phase !== 'done' || !review) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setPly((value) => Math.max(0, value - 1))
      else if (event.key === 'ArrowRight') setPly((value) => Math.min(review.moves.length, value + 1))
      else if (event.key === 'Home') setPly(0)
      else if (event.key === 'End') setPly(review.moves.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, review])

  const currentFen = review ? (ply === 0 ? review.startFen : review.moves[ply - 1].fenAfter) : null

  const position = useMemo(() => {
    if (!currentFen) return null
    const game = new Chess(currentFen)
    return {
      board: game.board(),
      turn: game.turn(),
      legal: game.moves({ verbose: true }),
      inCheck: game.isCheck(),
    }
  }, [currentFen])

  const playedMove = review && ply > 0 ? review.moves[ply - 1] : null
  const report = useMemo(() => (review ? buildReport(review, player) : null), [review, player])

  async function start() {
    if (!pgn.trim()) {
      setError('Paste a PGN, or play a game first.')
      return
    }
    cancelled.current = false
    setPhase('running')
    setError('')
    setReview(null)
    setProgress({ done: 0, total: 0 })
    try {
      const result = await reviewGame(pgn, {
        depth: 12,
        onProgress: (next) => setProgress(next),
        cancelled: () => cancelled.current,
      })
      setReview(result)
      setPly(0)
      setPhase('done')
      setArchive(attachAccuracy(pgn, result.accuracy))
    } catch (caught) {
      if (caught instanceof ReviewCancelled) {
        setPhase('idle')
        return
      }
      setError(caught instanceof Error ? caught.message : 'The review failed.')
      setPhase('error')
    }
  }

  function reset() {
    cancelled.current = true
    setPhase('idle')
    setReview(null)
    setPly(0)
    setError('')
  }

  function pickRecent(entry: (typeof archive)[number]) {
    setPgn(entry.pgn)
    setPlayer(entry.player)
    setError('')
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-16">
      <AppBar current="review" />
      <Container className="pt-6 sm:pt-8">
        {phase !== 'done' && (
          <div className="mx-auto max-w-[720px]">
            <p className="text-[13px] font-medium text-accent">Game review</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.03em] sm:text-[38px]">
              See exactly where the game turned
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Every move is checked by Stockfish and graded, and both players get an accuracy score — the same shape as
              a chess.com review, computed on your own device.
            </p>

            <div className="depth relative mt-6 rounded-card bg-surface p-4 shadow-glow">
              <label htmlFor="pgn" className="text-[12px] text-faint">
                Paste a PGN
              </label>
              <textarea
                id="pgn"
                value={pgn}
                onChange={(event) => {
                  setPgn(event.target.value)
                  setError('')
                }}
                rows={6}
                spellCheck={false}
                placeholder={'[Event "Casual game"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 …'}
                className="mt-1.5 w-full resize-y rounded-[10px] bg-white/[0.04] p-3 font-mono text-[12px] leading-relaxed text-fg placeholder:text-faint outline-none focus:[box-shadow:inset_0_0_0_1px_rgb(255_122_69/0.6)]"
              />

              {phase === 'running' ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[12px] text-muted">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-3.5 animate-spin" />
                      Analysing position {progress.done} of {progress.total || '…'}
                    </span>
                    <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-faint hover:text-fg">
                      <X className="size-3.5" /> Cancel
                    </button>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-[3px] bg-white/[0.07]">
                    <div
                      className="h-full rounded-[3px] bg-accent transition-[width] duration-200"
                      style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button onClick={start} disabled={engineState === 'loading'}>
                    {engineState === 'loading' ? 'Loading engine…' : 'Review game'}
                  </Button>
                  <a href="#/play" className="text-[13px] text-muted transition-colors hover:text-fg">
                    Play a game first
                  </a>
                </div>
              )}

              {error && <p className="mt-2 text-[12px] text-accent-3">{error}</p>}
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                Reviews run at depth 12 on your device. A 40-move game takes about half a minute.
              </p>
            </div>

            {archive.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] text-faint">Recent games on this device</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {archive.slice(0, 5).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => pickRecent(entry)}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-[9px] px-2 py-1 text-[11px] transition-colors',
                        entry.pgn === pgn ? 'bg-white/[0.1] text-fg' : 'bg-white/[0.04] text-muted hover:text-fg',
                      )}
                    >
                      <span
                        className={cx(
                          'round size-1.5',
                          entry.result === 'win'
                            ? 'bg-[#8fd694]'
                            : entry.result === 'loss'
                              ? 'bg-accent-3'
                              : 'bg-faint',
                        )}
                      />
                      {entry.result === 'win' ? 'Win' : entry.result === 'loss' ? 'Loss' : 'Draw'} · level {entry.level} ·{' '}
                      {new Date(entry.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'done' && review && position && report && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="mx-auto w-full max-w-[600px]">
              <ChessBoard
                board={position.board}
                turn={position.turn}
                moves={position.legal}
                lastMove={playedMove ? { from: playedMove.from, to: playedMove.to } : null}
                inCheck={position.inCheck}
                arrow={ply < review.bestMoves.length ? review.bestMoves[ply] : null}
                className="mx-auto"
              />

              <div className="mt-2 flex items-baseline justify-between gap-3 px-0.5">
                <p className="truncate text-[11px] text-faint">
                  {report.opening?.name ?? 'Opening not recognised'}
                </p>
                {report.opening?.leftBookAtPly && (
                  <span className="shrink-0 text-[11px] text-faint">
                    Left the book on move {Math.ceil(report.opening.leftBookAtPly / 2)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <StepButton label="Start" onClick={() => setPly(0)} disabled={ply === 0}>
                    <ChevronsLeft className="size-4" />
                  </StepButton>
                  <StepButton label="Previous" onClick={() => setPly((value) => Math.max(0, value - 1))} disabled={ply === 0}>
                    <ChevronLeft className="size-4" />
                  </StepButton>
                  <StepButton
                    label="Next"
                    onClick={() => setPly((value) => Math.min(review.moves.length, value + 1))}
                    disabled={ply === review.moves.length}
                  >
                    <ChevronRight className="size-4" />
                  </StepButton>
                  <StepButton label="End" onClick={() => setPly(review.moves.length)} disabled={ply === review.moves.length}>
                    <ChevronsRight className="size-4" />
                  </StepButton>
                </div>

                {playedMove ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-[9px] px-2.5 py-1 text-[12px]"
                    style={{ background: `${CLASS_COLOR[playedMove.classification]}22`, color: CLASS_COLOR[playedMove.classification] }}
                  >
                    <span className="round size-1.5" style={{ background: CLASS_COLOR[playedMove.classification] }} />
                    {CLASS_LABEL[playedMove.classification]} · {playedMove.san}
                    {playedMove.cpLoss >= 25 && (
                      <span className="text-faint">−{(playedMove.cpLoss / 100).toFixed(2)}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[12px] text-faint">Start position</span>
                )}
              </div>
            </div>

            <aside className="flex flex-col gap-3">
              <section className="grid grid-cols-2 gap-2">
                <AccuracyCard title="White" value={review.accuracy.w} counts={review.counts.w} />
                <AccuracyCard title="Black" value={review.accuracy.b} counts={review.counts.b} />
              </section>

              <section className="depth relative rounded-card bg-surface p-3 shadow-glow">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-[12px] font-semibold">Game report</h2>
                  <span className="text-[11px] text-faint">You are {player === 'w' ? 'White' : 'Black'}</span>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-1 text-[10px] uppercase tracking-wide text-faint">
                  <span>Phase</span>
                  <span className="w-11 text-right">You</span>
                  <span className="w-11 text-right">Opp</span>
                </div>
                {report.phases.map((row) => (
                  <div
                    key={row.phase}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-1 py-[3px] text-[12px] tabular-nums"
                  >
                    <span className="text-muted">{PHASE_LABEL[row.phase]}</span>
                    <span className="w-11 text-right">{row.you === null ? '—' : `${row.you.toFixed(1)}%`}</span>
                    <span className="w-11 text-right text-muted">
                      {row.opponent === null ? '—' : `${row.opponent.toFixed(1)}%`}
                    </span>
                  </div>
                ))}

                <div className="mt-2 flex items-center justify-between rounded-[8px] bg-white/[0.04] px-2 py-1.5 text-[11px]">
                  <span className="text-muted">Best move played</span>
                  <span className="tabular-nums">
                    {report.bestPct.you.toFixed(0)}% · <span className="text-muted">{report.bestPct.opponent.toFixed(0)}%</span>
                  </span>
                </div>

                {report.turnPoint && (
                  <div className="mt-2 rounded-[10px] bg-accent/[0.08] px-2.5 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-accent">
                      Turning point · move {report.turnPoint.moveNumber}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-fg/90">
                      {report.turnPoint.san} gave up{' '}
                      {report.turnPoint.cpLoss >= 5000 ? 'a forced mate' : `${(report.turnPoint.cpLoss / 100).toFixed(1)} pawns`}
                      {report.turnPoint.bestSan ? ` — best was ${report.turnPoint.bestSan}` : ''}.
                    </p>
                  </div>
                )}

                {report.winningUntil && (
                  <p className="mt-2 px-1 text-[11px] text-muted">
                    You were winning until move {report.winningUntil.moveNumber}.
                  </p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-1">
                  {report.legend.map((item) => (
                    <span
                      key={item.key}
                      title={CLASS_LABEL[item.key]}
                      className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-1 text-[10px] tabular-nums"
                      style={{ background: `${CLASS_COLOR[item.key]}1a`, color: CLASS_COLOR[item.key] }}
                    >
                      <span className="round size-1" style={{ background: CLASS_COLOR[item.key] }} />
                      <span className="truncate">{CLASS_LABEL[item.key]}</span>
                      <span className="ml-auto">
                        {item.you}/{item.opponent}
                      </span>
                    </span>
                  ))}
                </div>
              </section>

              <section className="depth relative rounded-card bg-surface p-3 shadow-glow">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[12px] font-semibold">Evaluation</h2>
                  <span className="text-[11px] tabular-nums text-muted">
                    {formatEval(review.graph[Math.min(ply, review.graph.length - 1)] ?? 0)}
                  </span>
                </div>
                <EvalGraph
                  graph={review.graph}
                  ply={ply}
                  markerPly={report.turnPoint?.ply}
                  onSelect={setPly}
                />
              </section>

              <section className="depth relative flex min-h-[160px] flex-col rounded-card bg-surface p-3 shadow-glow">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[12px] font-semibold">Moves</h2>
                  <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-faint hover:text-fg">
                    <ArrowLeft className="size-3" /> New review
                  </button>
                </div>
                <div ref={movesScrollRef} className="mt-2 max-h-[300px] overflow-y-auto text-[12.5px] tabular-nums">
                  {Array.from({ length: Math.ceil(review.moves.length / 2) }, (_, row) => {
                    const white = review.moves[row * 2]
                    const black = review.moves[row * 2 + 1]
                    return (
                      <div key={row} className="flex items-stretch gap-0.5">
                        <span className="w-6 shrink-0 py-[3px] pr-1 text-right text-[10px] text-faint">{row + 1}.</span>
                        <ReviewMove move={white} active={ply === white?.ply} onSelect={setPly} />
                        <ReviewMove move={black} active={ply === black?.ply} onSelect={setPly} />
                      </div>
                    )
                  })}
                </div>
              </section>

              <p className="px-1 text-[11px] leading-relaxed text-faint">
                {reviewSummaryText(review)} Accuracy measures how much winning chance each move kept, not how many
                good moves you found.
              </p>
            </aside>
          </div>
        )}
      </Container>
    </div>
  )
}

function ReviewMove({
  move,
  active,
  onSelect,
}: {
  move?: ReviewResult['moves'][number]
  active: boolean
  onSelect: (ply: number) => void
}) {
  if (!move) return <span className="min-w-0 flex-1" />
  return (
    <button
      type="button"
      data-active={active}
      onClick={() => onSelect(move.ply)}
      className={cx(
        'flex min-w-0 flex-1 items-center gap-1.5 truncate rounded-[5px] px-1.5 py-[3px] text-left transition-colors',
        active ? 'bg-white/[0.12] font-medium text-fg' : 'text-fg/75 hover:bg-white/[0.05]',
      )}
    >
      <span className="round size-1.5 shrink-0" style={{ background: CLASS_COLOR[move.classification] }} />
      <span className="truncate">{move.san}</span>
    </button>
  )
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid size-9 place-items-center rounded-[10px] bg-white/[0.05] text-muted transition-colors hover:text-fg disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function AccuracyCard({
  title,
  value,
  counts,
}: {
  title: string
  value: number
  counts: Record<MoveClass, number>
}) {
  return (
    <div className="depth relative rounded-card bg-surface p-3 shadow-glow">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-muted">{title}</span>
        <span className="text-[10px] text-faint">{accuracyGrade(value)}</span>
      </div>
      <p className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value.toFixed(1)}
        <span className="text-[14px] text-muted">%</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(['blunder', 'mistake', 'inaccuracy'] as MoveClass[]).map((key) => (
          <span
            key={key}
            title={CLASS_LABEL[key]}
            className="inline-flex items-center gap-1 rounded-[5px] px-1 py-0.5 text-[10px] tabular-nums"
            style={{ background: `${CLASS_COLOR[key]}1f`, color: CLASS_COLOR[key] }}
          >
            <span className="round size-1" style={{ background: CLASS_COLOR[key] }} />
            {counts[key]}
          </span>
        ))}
      </div>
    </div>
  )
}

function EvalGraph({
  graph,
  ply,
  markerPly,
  onSelect,
}: {
  graph: number[]
  ply: number
  markerPly?: number
  onSelect: (ply: number) => void
}) {
  const width = 320
  const height = 72
  const clamp = (value: number) => Math.max(-1200, Math.min(1200, value))
  const step = graph.length > 1 ? width / (graph.length - 1) : width
  const toY = (cp: number) => height / 2 - (clamp(cp) / 1200) * (height / 2 - 4)
  const line = graph.map((cp, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${toY(cp).toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height / 2} L0,${height / 2} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1 h-[72px] w-full cursor-crosshair"
      preserveAspectRatio="none"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const ratio = (event.clientX - rect.left) / rect.width
        onSelect(Math.max(0, Math.min(graph.length - 1, Math.round(ratio * (graph.length - 1)))))
      }}
    >
      <defs>
        <linearGradient id="review-eval" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf6ec" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fdf6ec" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="rgba(255,236,224,0.18)" strokeDasharray="3 4" />
      <path d={area} fill="url(#review-eval)" />
      <path d={line} fill="none" stroke="#fdf6ec" strokeWidth="1.6" strokeLinejoin="round" />
      {typeof markerPly === 'number' && markerPly > 0 && (
        <circle cx={markerPly * step} cy={toY(graph[markerPly] ?? 0)} r="2.2" fill="#ffb547" />
      )}
      <line x1={ply * step} x2={ply * step} y1="0" y2={height} stroke="#ff7a45" strokeWidth="1.5" />
      <circle cx={ply * step} cy={toY(graph[ply] ?? 0)} r="2.6" fill="#ff7a45" />
    </svg>
  )
}
