/**
 * Everything that should survive a refresh, kept on this device:
 *
 * - settings (sound, animation, coordinates, legal-move dots, auto-queen)
 * - the game in progress, including the remaining clock
 * - a small archive of finished games
 * - the last game handed to the reviewer
 *
 * There is no account and no server, so all of it lives in localStorage and
 * every read tolerates missing or corrupt data.
 */

import type { Color } from 'chess.js'
import { useSyncExternalStore } from 'react'

import type { GameStatus } from './chess'

const SETTINGS_KEY = 'zenchess:settings'
const GAME_KEY = 'zenchess:game'
const ARCHIVE_KEY = 'zenchess:archive'
const LAST_GAME_KEY = 'zenchess:lastGame'

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing or a full quota: the app still works, it just forgets.
  }
}

/* ------------------------------------------------------------------ settings */

export type Settings = {
  sound: boolean
  animation: boolean
  coordinates: boolean
  legalMoves: boolean
  autoQueen: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  animation: true,
  coordinates: true,
  legalMoves: true,
  autoQueen: false,
}

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]

function loadSettings(): Settings {
  const stored = readJson<Partial<Settings>>(SETTINGS_KEY)
  const next = { ...DEFAULT_SETTINGS }
  if (stored) {
    for (const key of SETTING_KEYS) {
      if (typeof stored[key] === 'boolean') next[key] = stored[key] as boolean
    }
  }
  return next
}

let currentSettings = loadSettings()
const settingsListeners = new Set<() => void>()

function subscribeSettings(listener: () => void) {
  settingsListeners.add(listener)
  return () => {
    settingsListeners.delete(listener)
  }
}

export function getSettings(): Settings {
  return currentSettings
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings)
}

export function updateSettings(patch: Partial<Settings>) {
  currentSettings = { ...currentSettings, ...patch }
  writeJson(SETTINGS_KEY, currentSettings)
  settingsListeners.forEach((listener) => listener())
}

/* -------------------------------------------------------------- saved game */

export type SavedGame = {
  pgn: string
  player: Color
  level: number
  timeControl: string
  clocks: { w: number; b: number }
  orientation: Color
  outcome: GameStatus | null
  updatedAt: number
}

export function loadSavedGame(): SavedGame | null {
  const stored = readJson<SavedGame>(GAME_KEY)
  if (!stored || typeof stored.pgn !== 'string' || !stored.pgn.trim()) return null
  if (stored.player !== 'w' && stored.player !== 'b') return null
  return {
    pgn: stored.pgn,
    player: stored.player,
    level: Number(stored.level) || 10,
    timeControl: typeof stored.timeControl === 'string' ? stored.timeControl : 'none',
    clocks: {
      w: Math.max(0, Number(stored.clocks?.w) || 0),
      b: Math.max(0, Number(stored.clocks?.b) || 0),
    },
    orientation: stored.orientation === 'b' ? 'b' : 'w',
    outcome: stored.outcome ?? null,
    updatedAt: Number(stored.updatedAt) || 0,
  }
}

export function saveSavedGame(game: Omit<SavedGame, 'updatedAt'>) {
  writeJson(GAME_KEY, { ...game, updatedAt: Date.now() })
}

export function clearSavedGame() {
  try {
    window.localStorage.removeItem(GAME_KEY)
  } catch {
    // Nothing to do.
  }
}

/* ------------------------------------------------------------------ archive */

export type GameResult = 'win' | 'loss' | 'draw'

export type GameRecord = {
  id: string
  at: number
  pgn: string
  player: Color
  level: number
  timeControl: string
  result: GameResult
  headline: string
  plies: number
  accuracy?: { w: number; b: number }
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function loadArchive(): GameRecord[] {
  const stored = readJson<GameRecord[]>(ARCHIVE_KEY)
  if (!Array.isArray(stored)) return []
  return stored.filter(
    (entry): entry is GameRecord =>
      Boolean(entry) &&
      typeof entry.pgn === 'string' &&
      entry.pgn.trim().length > 0 &&
      (entry.result === 'win' || entry.result === 'loss' || entry.result === 'draw'),
  )
}

/** Store a finished game. The same PGN is replaced rather than duplicated. */
export function recordGame(input: Omit<GameRecord, 'id' | 'at'>): GameRecord[] {
  const archive = loadArchive().filter((entry) => entry.pgn !== input.pgn)
  archive.unshift({ ...input, id: newId(), at: Date.now() })
  const capped = archive.slice(0, 40)
  writeJson(ARCHIVE_KEY, capped)
  return capped
}

/** Attach a finished review's accuracy to the game it belongs to. */
export function attachAccuracy(pgn: string, accuracy: { w: number; b: number }): GameRecord[] {
  const archive = loadArchive()
  const record = archive.find((entry) => entry.pgn === pgn)
  if (!record) return archive
  if (record.accuracy && Math.abs(record.accuracy.w - accuracy.w) < 0.01) return archive
  record.accuracy = accuracy
  writeJson(ARCHIVE_KEY, archive)
  return archive
}

export type ProgressStats = {
  games: number
  wins: number
  losses: number
  draws: number
  streak: { result: GameResult; count: number } | null
  byLevel: Record<number, { wins: number; losses: number; draws: number }>
  recent: GameResult[]
  averageAccuracy: number | null
  /** Reviewed-game accuracy, oldest to newest, for the progress sparkline. */
  accuracyTrend: number[]
}

export function progressStats(archive: GameRecord[]): ProgressStats {
  const stats: ProgressStats = {
    games: archive.length,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: null,
    byLevel: {},
    recent: archive.slice(0, 12).map((entry) => entry.result),
    averageAccuracy: null,
    accuracyTrend: [],
  }

  for (const entry of archive) {
    if (entry.result === 'win') stats.wins += 1
    else if (entry.result === 'loss') stats.losses += 1
    else stats.draws += 1

    const level = stats.byLevel[entry.level] ?? { wins: 0, losses: 0, draws: 0 }
    if (entry.result === 'win') level.wins += 1
    else if (entry.result === 'loss') level.losses += 1
    else level.draws += 1
    stats.byLevel[entry.level] = level
  }

  if (archive.length) {
    const first = archive[0].result
    let count = 0
    for (const entry of archive) {
      if (entry.result !== first) break
      count += 1
    }
    stats.streak = { result: first, count }
  }

  const accuracies = archive
    .filter((entry) => entry.accuracy)
    .slice(0, 5)
    .map((entry) => (entry.player === 'w' ? entry.accuracy?.w : entry.accuracy?.b) ?? 0)
  if (accuracies.length) {
    stats.averageAccuracy = accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length
  }

  stats.accuracyTrend = archive
    .filter((entry) => entry.accuracy)
    .slice(0, 6)
    .reverse()
    .map((entry) => (entry.player === 'w' ? entry.accuracy?.w : entry.accuracy?.b) ?? 0)

  return stats
}

export function levelRecord(archive: GameRecord[], level: number) {
  return archive
    .filter((entry) => entry.level === level)
    .reduce(
      (record, entry) => {
        if (entry.result === 'win') record.wins += 1
        else if (entry.result === 'loss') record.losses += 1
        else record.draws += 1
        return record
      },
      { wins: 0, losses: 0, draws: 0 },
    )
}

/* ---------------------------------------------------------------- last game */

export type LastGame = { pgn: string; player: Color; level: number }

export function saveLastGame(game: LastGame) {
  writeJson(LAST_GAME_KEY, game)
}

function readLastGameRaw(): string | null {
  try {
    return window.localStorage.getItem(LAST_GAME_KEY) ?? window.sessionStorage.getItem(LAST_GAME_KEY)
  } catch {
    return null
  }
}

/** Read the game handed to the reviewer, tolerating the old raw-PGN format. */
export function readLastGame(): LastGame | null {
  const raw = readLastGameRaw()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<LastGame>
    if (parsed && typeof parsed.pgn === 'string' && parsed.pgn.trim()) {
      return {
        pgn: parsed.pgn,
        player: parsed.player === 'b' ? 'b' : 'w',
        level: Number(parsed.level) || 10,
      }
    }
  } catch {
    // Older versions stored the PGN itself, not JSON.
    if (raw.includes('[') || /\d+\./.test(raw)) return { pgn: raw, player: 'w', level: 10 }
  }
  return null
}
