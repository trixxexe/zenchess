/**
 * A curated opening book: names for the lines a 500–1600 player actually
 * reaches, from the first move to about the tenth. This is deliberately not a
 * full ECO database — it is a compact map of SAN sequences, so the board can
 * say "Italian Game: Giuoco Piano" while you play and the review can tell you
 * where you left the book.
 *
 * Keys are plain SAN moves from the starting position: `e4 c5 2. Nf3 …` is
 * stored as `e4 c5 Nf3 …`.
 */

export type OpeningInfo = {
  /** Deepest named line that matches the game. */
  name: string
  /** The SAN moves of that named line. */
  line: string
  /** How many plies the name covers. */
  plies: number
  /** How many plies still follow a known line before the game leaves the book. */
  bookPlies: number
  /** The ply where the game first leaves every known line, if it does. */
  leftBookAtPly: number | null
}

const LINES: ReadonlyArray<readonly [string, string]> = [
  // 1.e4 e5
  ['e4 e5', 'Open Game'],
  ['e4 e5 Nf3 Nc6 Bb5', 'Ruy Lopez'],
  ['e4 e5 Nf3 Nc6 Bb5 a6', 'Ruy Lopez: Morphy Defense'],
  ['e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7', 'Ruy Lopez: Closed'],
  ['e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6', 'Ruy Lopez: Exchange Variation'],
  ['e4 e5 Nf3 Nc6 Bb5 Nf6', 'Ruy Lopez: Berlin Defense'],
  ['e4 e5 Nf3 Nc6 Bb5 Bc5', 'Ruy Lopez: Classical Defense'],
  ['e4 e5 Nf3 Nc6 Bc4', 'Italian Game'],
  ['e4 e5 Nf3 Nc6 Bc4 Bc5', 'Italian Game: Giuoco Piano'],
  ['e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4', 'Giuoco Piano: Main Line'],
  ['e4 e5 Nf3 Nc6 Bc4 Bc5 b4', 'Evans Gambit'],
  ['e4 e5 Nf3 Nc6 Bc4 Bc5 d3', 'Italian Game: Giuoco Pianissimo'],
  ['e4 e5 Nf3 Nc6 Bc4 Nf6', 'Italian Game: Two Knights Defense'],
  ['e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5', 'Two Knights Defense: Polerio Variation'],
  ['e4 e5 Nf3 Nc6 Bc4 Be7', 'Italian Game: Hungarian Defense'],
  ['e4 e5 Nf3 Nc6 Bc4 Nd4', 'Blackburne Shilling Gambit'],
  ['e4 e5 Nf3 Nc6 d4 exd4 Nxd4', 'Scotch Game'],
  ['e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5', 'Scotch Game: Classical Variation'],
  ['e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6', 'Scotch Game: Schmidt Variation'],
  ['e4 e5 Nf3 Nc6 Nc3 Nf6', 'Four Knights Game'],
  ['e4 e5 Nf3 Nf6', 'Petrov Defense'],
  ['e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4', 'Petrov Defense: Classical'],
  ['e4 e5 Nf3 d6', 'Philidor Defense'],
  ['e4 e5 Nf3 f5', 'Latvian Gambit'],
  ['e4 e5 Nc3', 'Vienna Game'],
  ['e4 e5 Nc3 Nf6 f4', 'Vienna Gambit'],
  ['e4 e5 Nc3 Nc6 f4', 'Vienna Gambit'],
  ['e4 e5 Bc4', "Bishop's Opening"],
  ['e4 e5 f4', "King's Gambit"],
  ['e4 e5 f4 exf4', "King's Gambit Accepted"],
  ['e4 e5 f4 exf4 Nf3 g5', "King's Gambit Accepted: Kieseritzky"],
  ['e4 e5 f4 exf4 Nf3 d6', "King's Gambit Accepted: Fischer Defense"],
  ['e4 e5 f4 Bc5', "King's Gambit Declined"],
  ['e4 e5 d4 exd4 Qxd4', 'Center Game'],

  // Sicilian
  ['e4 c5', 'Sicilian Defense'],
  ['e4 c5 Nf3', 'Sicilian Defense: Open'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', 'Sicilian Defense: Najdorf Variation'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5', 'Najdorf: English Attack'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4', 'Najdorf: Main Line'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6', 'Sicilian Defense: Dragon Variation'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O', 'Dragon: Yugoslav Attack'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6', 'Sicilian Defense: Scheveningen Variation'],
  ['e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6', 'Sicilian Defense: Classical Variation'],
  ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6', 'Sicilian Defense: Accelerated Dragon'],
  ['e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e6', 'Sicilian Defense: Four Knights'],
  ['e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6', 'Sicilian Defense: Taimanov Variation'],
  ['e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6', 'Sicilian Defense: Four Knights'],
  ['e4 c5 Nf3 Nf6', 'Sicilian Defense: Nimzowitsch Variation'],
  ['e4 c5 c3', 'Sicilian Defense: Alapin Variation'],
  ['e4 c5 Nc3 Nc6 g3', 'Sicilian Defense: Closed'],
  ['e4 c5 d4 cxd4 c3', 'Sicilian Defense: Smith-Morra Gambit'],
  ['e4 c5 Nf3 d6 Bb5+', 'Sicilian Defense: Moscow Variation'],
  ['e4 c5 Nf3 Nc6 Bb5', 'Sicilian Defense: Rossolimo Variation'],
  ['e4 c5 Nf3 d6 d4 cxd4 Qxd4', 'Sicilian Defense: Chekhover Variation'],
  ['e4 c5 f4', 'Sicilian Defense: Grand Prix Attack'],

  // French
  ['e4 e6', 'French Defense'],
  ['e4 e6 d4 d5 Nc3 Nf6', 'French Defense: Classical'],
  ['e4 e6 d4 d5 Nc3 Bb4', 'French Defense: Winawer Variation'],
  ['e4 e6 d4 d5 Nd2', 'French Defense: Tarrasch Variation'],
  ['e4 e6 d4 d5 e5', 'French Defense: Advance Variation'],
  ['e4 e6 d4 d5 e5 c5 c3 Nc6', 'French Advance: Paulsen Attack'],
  ['e4 e6 d4 d5 exd5 exd5', 'French Defense: Exchange Variation'],
  ['e4 e6 d4 d5 Nc3 dxe4', 'French Defense: Rubinstein Variation'],

  // Caro-Kann
  ['e4 c6', 'Caro-Kann Defense'],
  ['e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5', 'Caro-Kann: Classical Variation'],
  ['e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7', 'Caro-Kann: Karpov Variation'],
  ['e4 c6 d4 d5 e5', 'Caro-Kann: Advance Variation'],
  ['e4 c6 d4 d5 exd5 cxd5 c4', 'Caro-Kann: Panov-Botvinnik Attack'],
  ['e4 c6 d4 d5 f3', 'Caro-Kann: Fantasy Variation'],

  // Scandinavian / Alekhine / Pirc / others
  ['e4 d5', 'Scandinavian Defense'],
  ['e4 d5 exd5 Qxd5 Nc3 Qa5', 'Scandinavian: Mieses-Kotroc Variation'],
  ['e4 d5 exd5 Nf6', 'Scandinavian Defense: Modern'],
  ['e4 Nf6', 'Alekhine Defense'],
  ['e4 Nf6 e5 Nd5 d4 d6 Nf3', 'Alekhine Defense: Modern'],
  ['e4 Nf6 e5 Nd5 d4 d6 c4 Nb6', 'Alekhine Defense: Four Pawns Attack'],
  ['e4 d6 d4 Nf6 Nc3 g6', 'Pirc Defense'],
  ['e4 d6 d4 Nf6 Nc3 g6 f4 Bg7 Nf3 O-O', 'Pirc Defense: Austrian Attack'],
  ['e4 g6 d4 Bg7 Nc3 d6', 'Modern Defense'],
  ['e4 Nc6', 'Nimzowitsch Defense'],
  ['e4 b6', 'Owen Defense'],
  ['e4', "King's Pawn Opening"],

  // 1.d4
  ['d4', "Queen's Pawn Opening"],
  ['d4 d5', "Queen's Pawn Game"],
  ['d4 Nf6', 'Indian Game'],
  ['d4 d5 c4', "Queen's Gambit"],
  ['d4 d5 c4 dxc4', "Queen's Gambit Accepted"],
  ['d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5', "Queen's Gambit Accepted: Classical"],
  ['d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7', "Queen's Gambit Declined"],
  ['d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7', "Queen's Gambit Declined: Orthodox"],
  ['d4 d5 c4 e6 cxd5 exd5', "Queen's Gambit Declined: Exchange Variation"],
  ['d4 d5 c4 e6 Nc3 c6', 'Semi-Slav Defense'],
  ['d4 d5 c4 e6 Nc3 c6 Nf3 Nf6 e3 Nbd7', 'Semi-Slav: Meran Formation'],
  ['d4 d5 c4 e6 Nc3 c5', "Queen's Gambit Declined: Tarrasch Defense"],
  ['d4 d5 c4 e6 Nc3 Bb4', 'Ragozin Defense'],
  ['d4 d5 c4 c6 Nc3 Nf6 Nf3 dxc4 a4 Bf5', 'Slav Defense: Main Line'],
  ['d4 d5 c4 c6 Nc3 dxc4', 'Slav Defense: Accepted'],
  ['d4 d5 c4 Nc6', 'Chigorin Defense'],
  ['d4 d5 c4 e5 dxe5 d4', 'Albin Counter-Gambit'],
  ['d4 d5 c4 Nf6', "Queen's Gambit: Marshall Defense"],
  ['d4 d5 Nf3 Nf6 Bf4', 'London System'],
  ['d4 Nf6 Nf3 d5 Bf4', 'London System'],
  ['d4 Nf6 c4 g6 Nc3 Bg7', "King's Indian Defense"],
  ['d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5', "King's Indian: Classical"],
  ['d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3', "King's Indian: Sämisch Variation"],
  ['d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4', "King's Indian: Four Pawns Attack"],
  ['d4 Nf6 c4 g6 Nc3 d5', 'Grünfeld Defense'],
  ['d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7', 'Grünfeld Defense: Exchange'],
  ['d4 Nf6 c4 g6 Nc3 d5 Nf3 Bg7 Bg5', 'Grünfeld Defense: Taimanov Variation'],
  ['d4 Nf6 c4 e6 Nc3 Bb4', 'Nimzo-Indian Defense'],
  ['d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5', 'Nimzo-Indian: Rubinstein Variation'],
  ['d4 Nf6 c4 e6 Nc3 Bb4 Qc2', 'Nimzo-Indian: Classical Variation'],
  ['d4 Nf6 c4 e6 Nc3 Bb4 a3', 'Nimzo-Indian: Sämisch Variation'],
  ['d4 Nf6 c4 e6 Nf3 b6', "Queen's Indian Defense"],
  ['d4 Nf6 c4 e6 Nf3 b6 g3 Ba6', "Queen's Indian: Main Line"],
  ['d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O', 'Catalan Opening'],
  ['d4 Nf6 c4 c5 d5 b5', 'Benko Gambit'],
  ['d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6', 'Benoni Defense'],
  ['d4 c5 d5 e5', 'Benoni Defense: Czech'],
  ['d4 f5', 'Dutch Defense'],
  ['d4 f5 c4 Nf6 g3 e6 Bg2 Be7', 'Dutch Defense: Classical'],
  ['d4 f5 e4 fxe4 Nc3 Nf6', 'Dutch Defense: Staunton Gambit'],
  ['d4 d5 e4 dxe4 Nc3 Nf6 f3', 'Blackmar-Diemer Gambit'],
  ['d4 Nf6 Bg5', 'Trompowsky Attack'],
  ['d4 Nf6 Nf3 e6 Bg5', 'Torre Attack'],

  // 1.c4 and other first moves
  ['c4', 'English Opening'],
  ['c4 e5', 'English Opening: Reversed Sicilian'],
  ['c4 e5 Nc3 Nf6 Nf3 Nc6 g3', 'English Opening: Four Knights'],
  ['c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7', 'English Opening: Symmetrical'],
  ['c4 Nf6', 'English Opening: Anglo-Indian Defense'],
  ['Nf3', 'Réti Opening'],
  ['Nf3 d5 c4 e6 b3', 'Réti Opening: Main Line'],
  ['Nf3 d5 c4 dxc4 e3', 'Réti Opening: Accepted'],
  ['Nf3 Nf6 c4 e6 g3 d5 Bg2', 'Réti Opening: Catalan'],
  ['Nf3 d5 g3', "King's Indian Attack"],
  ['b3 e5 Bb2 Nc6', 'Nimzo-Larsen Attack'],
  ['f4 d5 Nf3 Nf6 e3', "Bird's Opening"],
  ['g3 d5 Bg2 Nf6', 'Benko Opening'],
  ['b4 e5 Bb2 Bxb4', 'Polish Opening'],
  ['Nc3 d5 e4', 'Dunst Opening'],
]

const NAMED = new Map<string, string>()
const PREFIXES = new Set<string>()

for (const [line, name] of LINES) {
  const moves = line.trim().split(/\s+/)
  let prefix = ''
  for (const move of moves) {
    prefix = prefix ? `${prefix} ${move}` : move
    PREFIXES.add(prefix)
  }
  // A later, more specific line with the same key wins.
  NAMED.set(moves.join(' '), name)
}

/** Find the deepest named opening for a SAN move list, and where the book ends. */
export function findOpening(sanMoves: string[]): OpeningInfo | null {
  if (!sanMoves.length) return null

  let name: string | null = null
  let plies = 0
  let bookPlies = 0

  for (let index = 1; index <= sanMoves.length; index += 1) {
    const key = sanMoves.slice(0, index).join(' ')
    if (NAMED.has(key)) {
      name = NAMED.get(key) as string
      plies = index
    }
    if (!PREFIXES.has(key)) break
    bookPlies = index
  }

  if (!name) return null
  return {
    name,
    line: sanMoves.slice(0, plies).join(' '),
    plies,
    bookPlies,
    leftBookAtPly: bookPlies < sanMoves.length ? bookPlies + 1 : null,
  }
}

/** "move 6" for the sixth ply of the game. */
export function plyToMove(ply: number): number {
  return Math.max(1, Math.ceil(ply / 2))
}
