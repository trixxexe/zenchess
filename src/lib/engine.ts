/**
 * A thin wrapper around the Stockfish wasm build: one Web Worker, the UCI text
 * protocol, and a promise per search. Searches are queued, because the engine
 * works on one position at a time.
 *
 * The single-threaded build is used on purpose: multi-threaded wasm needs
 * SharedArrayBuffer, which needs COOP/COEP headers that GitHub Pages cannot
 * send. The single-threaded build needs neither and is still far stronger than
 * any human.
 */

export type EngineScore = { type: 'cp' | 'mate'; value: number }

export type EngineLine = {
  multipv: number
  depth: number
  score?: EngineScore
  pv: string[]
}

export type EngineResult = {
  bestMove: string | null
  ponder: string | null
  lines: EngineLine[]
  depth: number
}

export type SearchOptions = {
  depth?: number
  movetime?: number
  multipv?: number
  skill?: number
  /** Clamp the engine's strength to an Elo rating (Stockfish supports ~1320+). */
  elo?: number
}

export const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`

let shared: StockfishEngine | null = null

/** One engine (and therefore one worker) for the whole session. */
export function getEngine(): StockfishEngine {
  if (!shared) shared = new StockfishEngine()
  return shared
}

export class StockfishEngine {
  private worker: Worker | null = null
  private starting: Promise<void> | null = null
  private chain: Promise<unknown> = Promise.resolve()
  private lines = new Map<number, EngineLine>()
  private bestMove: string | null = null
  private ponder: string | null = null
  private depth = 0
  private pending: { resolve: (result: EngineResult) => void; timer: number } | null = null

  constructor(private readonly url: string = ENGINE_URL) {}

  /** True once the worker exists (the wasm may still be compiling). */
  get started() {
    return this.worker !== null
  }

  start(): Promise<void> {
    if (this.starting) return this.starting
    this.starting = new Promise<void>((resolve, reject) => {
      let settled = false
      let worker: Worker
      const timer = window.setTimeout(() => fail(new Error('The engine took too long to load.')), 30_000)

      const fail = (error: Error) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        worker?.terminate()
        this.worker = null
        this.starting = null
        reject(error)
      }

      try {
        worker = new Worker(this.url)
      } catch {
        fail(new Error('The engine could not be started in this browser.'))
        return
      }

      worker.onerror = (event) => fail(new Error(event.message || 'The engine failed to load.'))
      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as unknown
        const line = typeof data === 'string' ? data : String((data as { data?: string } | null)?.data ?? '')
        if (!line) return
        if (line === 'uciok') {
          worker.postMessage('isready')
          return
        }
        if (line === 'readyok') {
          if (!settled) {
            settled = true
            window.clearTimeout(timer)
            resolve()
          }
          return
        }
        this.consume(line)
      }

      this.worker = worker
      worker.postMessage('uci')
    })
    return this.starting
  }

  /**
   * Search a position. Calls are serialised, so the last request in a burst
   * still gets its own complete answer.
   */
  analyse(fen: string, options: SearchOptions = {}): Promise<EngineResult> {
    const run = async (): Promise<EngineResult> => {
      await this.start()
      const worker = this.worker
      if (!worker) throw new Error('The engine is not running.')

      this.lines.clear()
      this.bestMove = null
      this.ponder = null
      this.depth = 0

      worker.postMessage(`setoption name MultiPV value ${options.multipv ?? 1}`)
      worker.postMessage(`setoption name Skill Level value ${options.skill ?? 20}`)
      if (options.elo) {
        worker.postMessage('setoption name UCI_LimitStrength value true')
        worker.postMessage(`setoption name UCI_Elo value ${options.elo}`)
      } else {
        worker.postMessage('setoption name UCI_LimitStrength value false')
      }
      worker.postMessage(`position fen ${fen}`)

      const movetime = options.movetime ? Math.round(options.movetime) : 0
      const go = movetime ? `go movetime ${movetime}` : `go depth ${options.depth ?? 14}`

      return new Promise<EngineResult>((resolve) => {
        const timer = window.setTimeout(() => {
          if (this.pending) this.pending = null
          worker.postMessage('stop')
          resolve(this.snapshot())
        }, (movetime || 8000) + 20_000)
        this.pending = { resolve, timer }
        worker.postMessage(go)
      })
    }

    const result = this.chain.then(run, run)
    this.chain = result.catch(() => undefined)
    return result
  }

  stop() {
    this.worker?.postMessage('stop')
  }

  destroy() {
    this.worker?.terminate()
    this.worker = null
    this.starting = null
    this.pending = null
  }

  private snapshot(): EngineResult {
    return {
      bestMove: this.bestMove,
      ponder: this.ponder,
      lines: [...this.lines.values()].sort((a, b) => a.multipv - b.multipv),
      depth: this.depth,
    }
  }

  private consume(line: string) {
    if (line.startsWith('bestmove')) {
      const parts = line.split(/\s+/)
      this.bestMove = parts[1] && parts[1] !== '(none)' ? parts[1] : null
      this.ponder = parts[3] ?? null
      const pending = this.pending
      this.pending = null
      if (pending) {
        window.clearTimeout(pending.timer)
        pending.resolve(this.snapshot())
      }
      return
    }

    if (!line.startsWith('info') || !line.includes(' pv ')) return

    const depth = Number(/depth (\d+)/.exec(line)?.[1] ?? 0)
    const multipv = Number(/multipv (\d+)/.exec(line)?.[1] ?? 1)
    const scoreMatch = /score (cp|mate) (-?\d+)/.exec(line)
    const pv = line.slice(line.indexOf(' pv ') + 4).trim().split(/\s+/).filter(Boolean)
    if (!pv.length) return

    this.lines.set(multipv, {
      multipv,
      depth,
      score: scoreMatch ? { type: scoreMatch[1] as 'cp' | 'mate', value: Number(scoreMatch[2]) } : undefined,
      pv,
    })
    this.depth = Math.max(this.depth, depth)
  }
}
