import { Chess, type Color, type Move } from 'chess.js'
import { Check, Copy, Download, Flag, Gauge, Handshake, Lightbulb, Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { AppBar } from '../components/AppBar'
import { Button } from '../components/Button'
import { ChessBoard, type BoardMove } from '../components/ChessBoard'
import { Container } from '../components/Container'
import {
  capturedBy,
  describeGame,
  formatClock,
  materialDiff,
  pieceSrc,
  uciToMove,
  type GameStatus,
} from '../lib/chess'
import { getEngine } from '../lib/engine'
import { DEFAULT_LEVEL, LEVELS, TIME_CONTROLS, levelById } from '../lib/levels'
import { findOpening } from '../lib/openings'
import { navigate } from '../lib/router'
import { playSound } from '../lib/sound'
import {
  clearSavedGame,
  levelRecord,
  loadArchive,
  loadSavedGame,
  progressStats,
  recordGame,
  saveLastGame,
  saveSavedGame,
  type GameResult,
} from '../lib/store'
import { cx } from '../lib/cx'

type Position = {
  fen: string
  turn: Color
  legal: Move[]
  board: ReturnType<Chess['board']>
  history: Move[]
  lastMove: { from: string; to: string } | null
  inCheck: boolean
  status: GameStatus
}

type Initial = {
  game: Chess
  player: Color
  level: number
  timeControl: string
  clocks: { w: number; b: number }
  orientation: Color
  outcome: GameStatus | null
  resumed: boolean
}

function snapshot(game: Chess, player: Color): Position {
  const history = game.history({ verbose: true })
  return {
    fen: game.fen(),
    turn: game.turn(),
    legal: game.moves({ verbose: true }),
    board: game.board(),
    history,
    lastMove: history.length ? { from: history[history.length - 1].from, to: history[history.length - 1].to } : null,
    inCheck: game.isCheck(),
    status: describeGame(game, { playerColor: player }),
  }
}

function freshGame(): Initial {
  return {
    game: new Chess(),
    player: 'w',
    level: DEFAULT_LEVEL,
    timeControl: 'none',
    clocks: { w: 0, b: 0 },
    orientation: 'w',
    outcome: null,
    resumed: false,
  }
}

/** Restore the game left behind by the last visit, if there is one. */
function buildInitial(): Initial {
  const saved = loadSavedGame()
  if (!saved) return freshGame()

  const game = new Chess()
  try {
    game.loadPgn(saved.pgn)
  } catch {
    clearSavedGame()
    return freshGame()
  }
  if (!game.history().length) return freshGame()

  const tc = TIME_CONTROLS.find((entry) => entry.id === saved.timeControl) ?? TIME_CONTROLS[0]
  return {
    game,
    player: saved.player,
    level: saved.level,
    timeControl: tc.id,
    clocks: tc.minutes > 0 ? saved.clocks : { w: 0, b: 0 },
    orientation: saved.orientation,
    outcome: saved.outcome,
    resumed: true,
  }
}

function playMoveSound(game: Chess) {
  const history = game.history({ verbose: true })
  const last = history[history.length - 1]
  if (!last) return
  const captured = last.flags.includes('c') || last.flags.includes('e')
  if (last.flags.includes('p')) playSound('promote')
  else if (captured) playSound('capture')
  else if (last.flags.includes('k') || last.flags.includes('q')) playSound('castle')
  else playSound('move')
  if (game.isCheck()) playSound('check')
}

function streakLabel(result: GameResult, count: number): string {
  const noun = result === 'win' ? 'win' : result === 'loss' ? 'loss' : 'draw'
  return `${count} ${noun}${count === 1 ? '' : result === 'loss' ? 'es' : 's'} in a row`
}

export function Play() {
  const [initial] = useState(buildInitial)
  const gameRef = useRef<Chess>(undefined as unknown as Chess)
  if (!gameRef.current) gameRef.current = initial.game

  const [player, setPlayer] = useState<Color>(initial.player)
  const [position, setPosition] = useState<Position>(() => snapshot(initial.game, initial.player))
  const [level, setLevel] = useState(initial.level)
  const [timeControl, setTimeControl] = useState(initial.timeControl)
  const [clocks, setClocks] = useState(initial.clocks)
  const [outcome, setOutcome] = useState<GameStatus | null>(initial.outcome)
  const [thinking, setThinking] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<Color>(initial.orientation)
  const [engineState, setEngineState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [engineError, setEngineError] = useState('')
  const [toast, setToast] = useState(initial.resumed ? 'Game restored' : '')
  const [confirmResign, setConfirmResign] = useState(false)
  const [drawPending, setDrawPending] = useState(false)
  const [archive, setArchive] = useState(() => loadArchive())
  const movesScrollRef = useRef<HTMLDivElement>(null)

  const levelInfo = levelById(level)
  const tc = TIME_CONTROLS.find((entry) => entry.id === timeControl) ?? TIME_CONTROLS[0]
  const finished = Boolean(outcome) || position.status.over
  // Read inside async engine callbacks, where state would be stale.
  const finishedRef = useRef(false)
  finishedRef.current = finished
  // Guards so a flag can only end the game once, and so the ticker credits
  // real elapsed time instead of counting interval callbacks.
  const flaggedRef = useRef(false)
  const lastTickRef = useRef<number | null>(null)
  const engineRunRef = useRef(0)

  const opening = useMemo(
    () => findOpening(position.history.map((move) => move.san)),
    [position.history],
  )
  const stats = useMemo(() => progressStats(archive), [archive])
  const levelStats = useMemo(() => levelRecord(archive, level), [archive, level])
  const streak = stats.streak && stats.streak.count > 1 ? streakLabel(stats.streak.result, stats.streak.count) : null

  useEffect(() => {
    const engine = getEngine()
    let alive = true
    engine
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
    const id = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(id)
  }, [toast])

  // Keep the newest move in view, like a chess.com move list.
  useEffect(() => {
    const el = movesScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [position.history.length])

  const applyMove = useCallback(
    (move: BoardMove) => {
      const game = gameRef.current
      try {
        game.move(move)
      } catch {
        return
      }
      const mover: Color = game.turn() === 'w' ? 'b' : 'w'
      setPosition(snapshot(game, player))
      setHint(null)
      playMoveSound(game)
      // Re-baseline the ticker: the mover's last partial tick must never be
      // charged to the opponent who is now on the clock.
      lastTickRef.current = tc.minutes > 0 ? performance.now() : null

      const status = describeGame(game, { playerColor: player })
      // Increment is added once per move, only to the side that just moved, and
      // only if that side still had time on the clock when the move landed.
      if (tc.minutes > 0 && tc.increment > 0 && !status.over) {
        setClocks((current) => ({
          ...current,
          [mover]: current[mover] > 0 ? current[mover] + tc.increment * 1000 : current[mover],
        }))
      }
      if (status.over) setOutcome(status)
    },
    [player, tc.increment, tc.minutes],
  )

  const startNewGame = useCallback(
    (nextPlayer: Color = player, nextTimeControl: string = timeControl) => {
      gameRef.current = new Chess()
      const next = TIME_CONTROLS.find((entry) => entry.id === nextTimeControl) ?? TIME_CONTROLS[0]
      setPosition(snapshot(gameRef.current, nextPlayer))
      setClocks({ w: next.minutes * 60_000, b: next.minutes * 60_000 })
      setOutcome(null)
      setHint(null)
      setThinking(false)
      setConfirmResign(false)
      setOrientation(nextPlayer)
      flaggedRef.current = false
      lastTickRef.current = null
      setToast('New game')
    },
    [player, timeControl],
  )

  // The engine moves whenever it is not the player's turn.
  useEffect(() => {
    const engineTurn = position.turn !== player && !position.status.over && !outcome
    if (!engineTurn || engineState !== 'ready') return
    let cancelled = false
    // Identifies this search so a late `finally` cannot clear a newer search's
    // "thinking" flag (e.g. after a resign or a timeout ends the game mid-search).
    const runId = ++engineRunRef.current

    void (async () => {
      setThinking(true)
      try {
        const config = levelById(level)
        let move: BoardMove | null = null

        if (Math.random() < config.blunder) {
          const legal = gameRef.current.moves({ verbose: true })
          const pick = legal[Math.floor(Math.random() * legal.length)]
          if (pick) move = { from: pick.from, to: pick.to, promotion: pick.promotion }
        } else {
          const result = await getEngine().analyse(gameRef.current.fen(), {
            depth: config.depth,
            movetime: config.movetime,
            skill: config.skill,
          })
          if (result.bestMove) move = uciToMove(result.bestMove)
        }

        if (cancelled || finishedRef.current || !move) return
        applyMove(move)
      } catch (error) {
        if (!cancelled) {
          setEngineState('error')
          setEngineError(error instanceof Error ? error.message : 'The engine stopped responding.')
        }
      } finally {
        if (runId === engineRunRef.current) setThinking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applyMove, engineState, level, outcome, player, position.fen, position.status.over, position.turn])

  // Clock ticks for the side to move, charged by real elapsed time. Intervals
  // are throttled in background tabs, so counting callbacks would let a hidden
  // tab keep minutes it never spent.
  useEffect(() => {
    if (tc.minutes === 0 || finished) {
      lastTickRef.current = null
      return
    }
    lastTickRef.current = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const last = lastTickRef.current ?? now
      lastTickRef.current = now
      const elapsed = now - last
      if (elapsed <= 0) return
      const turn = gameRef.current.turn()
      setClocks((current) => ({ ...current, [turn]: Math.max(0, current[turn] - elapsed) }))
    }, 100)
    return () => {
      window.clearInterval(id)
      lastTickRef.current = null
    }
  }, [finished, tc.minutes])

  // A clock reaching zero ends the game exactly once, even if the engine is
  // still searching when it happens. Under FIDE rules a flag fall is a draw
  // when the player with time cannot possibly mate, so a bare king or a lone
  // minor piece does not "win on time".
  useEffect(() => {
    if (tc.minutes === 0 || finished || engineState === 'loading' || flaggedRef.current) return
    const turn = gameRef.current.turn()
    if (clocks[turn] > 0) return
    flaggedRef.current = true
    setThinking(false)
    if (gameRef.current.isInsufficientMaterial()) {
      setOutcome({
        over: true,
        headline: 'Draw — time out',
        detail: 'The clock ran out, but there is not enough material left to mate.',
        winner: null,
      })
      return
    }
    setOutcome({
      over: true,
      headline: turn === player ? 'Time out — you lose' : 'Time out — you win',
      detail: 'The clock ran out. Start a new game when you are ready.',
      winner: turn === 'w' ? 'b' : 'w',
    })
  }, [clocks, engineState, finished, player, tc.minutes])

  // Persist the game, including the remaining clock, so a refresh or a closed
  // tab never loses it. The interval catches the clock draining between moves.
  const persist = useCallback(() => {
    const game = gameRef.current
    if (!game.history().length && !outcome) {
      clearSavedGame()
      return
    }
    saveSavedGame({
      pgn: game.pgn(),
      player,
      level,
      timeControl,
      clocks,
      orientation,
      outcome,
    })
  }, [clocks, level, orientation, outcome, player, timeControl])

  const persistRef = useRef(persist)
  persistRef.current = persist

  useEffect(() => {
    persistRef.current()
  }, [level, outcome, orientation, player, position.fen, timeControl])

  useEffect(() => {
    const id = window.setInterval(() => persistRef.current(), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Record a finished game once, for the local archive and progress panel.
  useEffect(() => {
    if (!outcome) return
    const game = gameRef.current
    const pgn = game.pgn()
    if (!pgn) return
    const result: GameResult = outcome.winner === null ? 'draw' : outcome.winner === player ? 'win' : 'loss'
    setArchive(
      recordGame({
        pgn,
        player,
        level,
        timeControl,
        result,
        headline: outcome.headline,
        plies: game.history().length,
      }),
    )
    // Only a new result should record a game; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome])

  useEffect(() => {
    if (!outcome) return
    if (!outcome.winner) playSound('draw')
    else playSound(outcome.winner === player ? 'win' : 'lose')
  }, [outcome, player])

  useEffect(() => {
    if (!confirmResign) return
    const id = window.setTimeout(() => setConfirmResign(false), 4000)
    return () => window.clearTimeout(id)
  }, [confirmResign])

  function onMove(move: BoardMove) {
    if (finished || position.turn !== player) return
    applyMove(move)
  }

  function openReview() {
    try {
      const pgn = gameRef.current.pgn()
      if (!pgn) {
        setToast('Play a few moves first.')
        return
      }
      saveLastGame({ pgn, player, level })
    } catch {
      setToast('Could not save the game for review.')
      return
    }
    navigate('/review')
  }

  function undo() {
    const game = gameRef.current
    // A finished game stays finished: undoing a timeout would leave the clock
    // on zero and the game would immediately flag again.
    if (finished || !game.history().length) return
    setOutcome(null)
    do {
      game.undo()
    } while (game.history().length && game.turn() !== player)
    setPosition(snapshot(game, player))
    setHint(null)
  }

  function resign() {
    if (finished) return
    setThinking(false)
    setConfirmResign(false)
    setOutcome({
      over: true,
      headline: 'You resigned',
      detail: 'Start a new game when you are ready.',
      winner: player === 'w' ? 'b' : 'w',
    })
  }

  async function offerDraw() {
    if (finished || drawPending || engineState !== 'ready' || position.turn !== player) return
    const fen = gameRef.current.fen()
    setDrawPending(true)
    try {
      const result = await getEngine().analyse(fen, { depth: 10, movetime: 300 })
      // The engine does not believe in draws, so it accepts when it is not
      // better by half a pawn from its own point of view.
      if (fen !== gameRef.current.fen() || finishedRef.current) return
      const score = result.lines[0]?.score
      const centipawns = !score ? 0 : score.type === 'mate' ? (score.value > 0 ? 10_000 : -10_000) : score.value
      // Bots do not hand out half a point on move one: accept only when the
      // engine is clearly worse, or when a long game is completely level.
      const plies = gameRef.current.history().length
      const accepts = centipawns >= 150 || (plies >= 60 && Math.abs(centipawns) <= 30)
      if (accepts) {
        setOutcome({
          over: true,
          headline: 'Draw agreed',
          detail: 'Stockfish accepted your draw offer.',
          winner: null,
        })
      } else {
        setToast('Stockfish declined the draw.')
      }
    } catch {
      setToast('The engine is not ready.')
    } finally {
      setDrawPending(false)
    }
  }

  async function showHint() {
    if (finished || position.turn !== player) return
    try {
      const result = await getEngine().analyse(position.fen, { depth: 14 })
      if (result.bestMove) {
        setHint(result.bestMove)
        window.setTimeout(() => setHint(null), 3200)
      }
    } catch {
      setToast('The engine is not ready.')
    }
  }

  async function copyPgn() {
    const pgn = gameRef.current.pgn()
    if (!pgn) {
      setToast('No moves to copy yet.')
      return
    }
    try {
      await navigator.clipboard.writeText(pgn)
      setToast('PGN copied')
    } catch {
      setToast('Could not copy — select the moves instead.')
    }
  }

  function downloadPgn() {
    const pgn = gameRef.current.pgn()
    if (!pgn) {
      setToast('No moves to save yet.')
      return
    }
    const url = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'zenchess-game.pgn'
    link.click()
    URL.revokeObjectURL(url)
  }

  const moves = position.history
  const you = player === 'w' ? 'White' : 'Black'
  const engineColor: Color = player === 'w' ? 'b' : 'w'
  const statusText = outcome
    ? outcome.headline
    : position.status.over
      ? position.status.headline
      : thinking
        ? 'Stockfish is thinking…'
        : position.turn === player
          ? 'Your move'
          : 'Stockfish to move'

  return (
    <div className="min-h-dvh pb-16">
      <AppBar current="play" />
      <Container className="pt-6 sm:pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
          {/* Board column */}
          <div className="mx-auto w-full max-w-[600px]">
            <PlayerStrip
              name={`Stockfish · level ${levelInfo.id}`}
              elo={`${levelInfo.elo} Elo`}
              captured={capturedBy(gameRef.current, engineColor)}
              material={materialDiff(gameRef.current, engineColor)}
              clock={tc.minutes ? formatClock(clocks[engineColor]) : null}
              active={position.turn !== player && !finished}
              engine
            />

            <div className="relative">
              <ChessBoard
                board={position.board}
                turn={position.turn}
                moves={position.legal}
                orientation={orientation}
                lastMove={position.lastMove}
                inCheck={position.inCheck}
                onMove={finished || position.turn !== player ? undefined : onMove}
                arrow={hint}
              />
              {finished && (
                <div className="absolute inset-0 grid place-items-center rounded-[14px] bg-bg/70 p-4 backdrop-blur-[2px]">
                  <div className="depth relative w-full max-w-[280px] rounded-card bg-surface p-5 text-center shadow-glow">
                    <p className="text-[16px] font-semibold">{outcome?.headline ?? position.status.headline}</p>
                    <p className="mt-1 text-[13px] leading-snug text-muted">
                      {outcome?.detail || position.status.detail}
                    </p>
                    <Button className="mt-4 w-full" onClick={() => startNewGame()}>
                      New game
                    </Button>
                    <Button variant="secondary" className="mt-2 w-full" onClick={openReview}>
                      Review game
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3 px-0.5">
              <p className="truncate text-[11px] text-faint">
                {opening?.name ?? (moves.length ? 'Uncommon opening' : 'Starting position')}
              </p>
              <span className="shrink-0 text-[11px] tabular-nums text-faint">
                {moves.length ? `Move ${Math.ceil(moves.length / 2)}` : ''}
              </span>
            </div>

            <PlayerStrip
              name={`You · ${you}`}
              elo={position.inCheck && !finished ? 'In check' : 'Your move'}
              captured={capturedBy(gameRef.current, player)}
              material={materialDiff(gameRef.current, player)}
              clock={tc.minutes ? formatClock(clocks[player]) : null}
              active={position.turn === player && !finished}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cx(
                  'depth relative inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[12px]',
                  thinking ? 'bg-accent/10 text-accent' : 'bg-white/[0.04] text-muted',
                )}
              >
                {thinking && <Loader2 className="size-3.5 animate-spin" />}
                {statusText}
              </span>
              {toast && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-accent-2/10 px-2.5 text-[12px] text-accent-2">
                  <Check className="size-3.5" />
                  {toast}
                </span>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={openReview}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-white/[0.04] px-2.5 text-[12px] text-muted transition-colors hover:text-fg"
                >
                  <Gauge className="size-3.5" /> Review
                </button>
                <IconButton label="Undo" onClick={undo} disabled={!moves.length || thinking || finished}>
                  <Undo2 className="size-4" />
                </IconButton>
                <IconButton label="Hint" onClick={showHint} disabled={finished || position.turn !== player}>
                  <Lightbulb className="size-4" />
                </IconButton>
                <IconButton
                  label="Offer draw"
                  onClick={offerDraw}
                  disabled={finished || position.turn !== player || drawPending}
                >
                  {drawPending ? <Loader2 className="size-4 animate-spin" /> : <Handshake className="size-4" />}
                </IconButton>
                <IconButton label="Flip board" onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}>
                  <RotateCcw className="size-4" />
                </IconButton>
                {confirmResign ? (
                  <button
                    type="button"
                    onClick={resign}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-accent-3/15 px-2.5 text-[12px] font-medium text-accent-3"
                  >
                    <Flag className="size-4" /> Resign?
                  </button>
                ) : (
                  <IconButton label="Resign" onClick={() => setConfirmResign(true)} disabled={finished}>
                    <Flag className="size-4" />
                  </IconButton>
                )}
              </div>
            </div>
          </div>

          {/* Panel */}
          <aside className="flex flex-col gap-3">
            <section className="depth relative rounded-card bg-surface p-4 shadow-glow">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold">Engine level</h2>
                <span className="text-[12px] tabular-nums text-accent">
                  {levelInfo.id} / {LEVELS.length}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">{levelInfo.elo}</span>
                <span className="text-[12px] text-muted">Elo · {levelInfo.band}</span>
              </div>
              <input
                type="range"
                min={1}
                max={LEVELS.length}
                step={1}
                value={level}
                onChange={(event) => setLevel(Number(event.target.value))}
                aria-label="Engine level"
                className="mt-3 w-full accent-[#ff7a45]"
              />
              <p className="mt-1 text-[11px] leading-snug text-faint">
                Changing the level applies immediately, even mid-game.
              </p>
            </section>

            <section className="depth relative rounded-card bg-surface p-4 shadow-glow">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold">Your progress</h2>
                <span className="text-[11px] text-faint">This device</span>
              </div>
              {stats.games === 0 ? (
                <p className="mt-2 text-[11px] leading-snug text-faint">
                  Finish a game and your record starts here — no account, no server.
                </p>
              ) : (
                <>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-[22px] font-semibold tabular-nums tracking-tight">
                      {stats.wins}–{stats.losses}–{stats.draws}
                    </span>
                    <span className="pb-1 text-[11px] text-muted">W–L–D</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {stats.recent.map((result, index) => (
                      <span
                        key={index}
                        title={result === 'win' ? 'Win' : result === 'loss' ? 'Loss' : 'Draw'}
                        className={cx(
                          'round size-2',
                          result === 'win' ? 'bg-[#8fd694]' : result === 'loss' ? 'bg-accent-3' : 'bg-faint',
                        )}
                      />
                    ))}
                    <span className="ml-1 text-[10px] text-faint">last {stats.recent.length}</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-0.5 text-[11px] leading-snug text-muted">
                    <span>
                      vs level {level}: {levelStats.wins}W {levelStats.losses}L {levelStats.draws}D
                    </span>
                    {streak && <span>{streak}</span>}
                    {stats.averageAccuracy !== null && (
                      <span>Avg accuracy {stats.averageAccuracy.toFixed(1)}%</span>
                    )}
                  </div>
                  {stats.accuracyTrend.length > 1 && (
                    <div className="mt-2">
                      <div className="flex items-end gap-1" aria-label="Accuracy trend">
                        {stats.accuracyTrend.map((value, index) => (
                          <span
                            key={index}
                            title={`${value.toFixed(1)}%`}
                            className="w-1.5 rounded-[2px] bg-accent/70"
                            style={{ height: `${Math.max(4, Math.round((value / 100) * 24))}px` }}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-faint">Accuracy trend · last {stats.accuracyTrend.length}</p>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="depth relative rounded-card bg-surface p-4 shadow-glow">
              <h2 className="text-[13px] font-semibold">New game</h2>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {(['w', 'random', 'b'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      const color: Color =
                        option === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : option
                      setPlayer(color)
                      startNewGame(color, timeControl)
                    }}
                    className={cx(
                      'h-9 rounded-[10px] text-[12px] transition-colors',
                      (option === 'random' ? true : player === option)
                        ? 'bg-white/[0.09] text-fg'
                        : 'bg-white/[0.03] text-muted hover:bg-white/[0.06]',
                    )}
                  >
                    {option === 'w' ? 'White' : option === 'b' ? 'Black' : 'Random'}
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-[11px] text-faint" htmlFor="time-control">
                Time control
              </label>
              <select
                id="time-control"
                value={timeControl}
                onChange={(event) => {
                  setTimeControl(event.target.value)
                  startNewGame(player, event.target.value)
                }}
                className="mt-1 h-9 w-full rounded-[10px] bg-white/[0.05] px-2 text-[12px] text-fg outline-none"
              >
                {TIME_CONTROLS.map((entry) => (
                  <option key={entry.id} value={entry.id} className="bg-surface">
                    {entry.label}
                  </option>
                ))}
              </select>
              <Button variant="secondary" className="mt-3 h-10 w-full text-[13px]" onClick={() => startNewGame()}>
                Start over
              </Button>
            </section>

            <section className="depth relative flex min-h-[180px] flex-1 flex-col rounded-card bg-surface p-4 shadow-glow">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold">Moves</h2>
                <div className="flex items-center gap-1">
                  <IconButton label="Copy PGN" onClick={copyPgn} small>
                    <Copy className="size-3.5" />
                  </IconButton>
                  <IconButton label="Download PGN" onClick={downloadPgn} small>
                    <Download className="size-3.5" />
                  </IconButton>
                </div>
              </div>
              {moves.length === 0 ? (
                <p className="mt-6 text-center text-[12px] text-faint">No moves yet.</p>
              ) : (
                <div ref={movesScrollRef} className="mt-2 max-h-[260px] overflow-y-auto text-[13px] tabular-nums">
                  {Array.from({ length: Math.ceil(moves.length / 2) }, (_, row) => {
                    const white = moves[row * 2]
                    const black = moves[row * 2 + 1]
                    return (
                      <div key={row} className="flex items-stretch gap-0.5">
                        <span className="w-7 shrink-0 py-[3px] pr-1 text-right text-[11px] text-faint">{row + 1}.</span>
                        <MoveCell san={white?.san} current={moves.length - 1 === row * 2} />
                        <MoveCell san={black?.san} current={moves.length - 1 === row * 2 + 1} />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <p className="px-1 text-[11px] leading-relaxed text-faint">
              {engineState === 'error'
                ? `Engine error: ${engineError}`
                : engineState === 'loading'
                  ? 'Loading Stockfish (1.8 MB, cached after the first visit)…'
                  : 'Stockfish runs on your device. Nothing is uploaded, and there is no account.'}
            </p>
          </aside>
        </div>
      </Container>
    </div>
  )
}

function PlayerStrip({
  name,
  elo,
  captured,
  material,
  clock,
  active,
  engine = false,
}: {
  name: string
  elo: string
  captured: ReturnType<typeof capturedBy>
  material: number
  clock: string | null
  active: boolean
  engine?: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span
        className={cx(
          'grid size-7 shrink-0 place-items-center rounded-[9px] text-[11px] font-semibold',
          engine ? 'bg-white/[0.07] text-accent' : 'bg-white/[0.07] text-fg',
        )}
      >
        {engine ? 'SF' : 'You'}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium">{name}</p>
        <p className="truncate text-[11px] text-faint">{elo}</p>
      </div>
      <div className="ml-2 hidden min-w-0 flex-1 items-center text-[13px] text-muted sm:flex">
        {captured.map((piece) => (
          <span key={piece.type} className="mr-0.5 inline-flex items-center">
            <img src={pieceSrc(piece.color, piece.type)} alt="" className="size-[18px]" />
            {piece.count > 1 && <span className="text-[9px] align-super">{piece.count}</span>}
          </span>
        ))}
      </div>
      {material > 0 && (
        <span className="ml-auto shrink-0 text-[11px] font-medium tabular-nums text-muted sm:ml-2">+{material}</span>
      )}
      {clock && (
        <span
          className={cx(
            'shrink-0 rounded-[9px] px-2 py-1 text-[14px] font-medium tabular-nums',
            material > 0 ? '' : 'ml-auto',
            active ? 'bg-fg text-bg' : 'bg-white/[0.06] text-fg/80',
          )}
        >
          {clock}
        </span>
      )}
    </div>
  )
}

function MoveCell({ san, current }: { san?: string; current: boolean }) {
  if (!san) return <span className="min-w-0 flex-1" />
  return (
    <span
      className={cx(
        'min-w-0 flex-1 truncate rounded-[5px] px-1.5 py-[3px]',
        current ? 'bg-white/[0.12] font-medium text-fg' : 'text-fg/80',
      )}
    >
      {san}
    </span>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
  small = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cx(
        'grid place-items-center rounded-[9px] text-muted transition-colors hover:bg-white/[0.07] hover:text-fg disabled:pointer-events-none disabled:opacity-40',
        small ? 'size-7' : 'size-8 bg-white/[0.04]',
      )}
    >
      {children}
    </button>
  )
}
