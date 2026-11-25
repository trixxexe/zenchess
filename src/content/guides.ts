export type GuideSection = {
  heading: string
  body: string[]
  bullets?: string[]
}

export type Guide = {
  slug: string
  title: string
  description: string
  minutes: number
  level: string
  sections: GuideSection[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'levels',
    title: 'How the twenty levels work',
    description: 'What actually changes as you climb, why the low levels feel human, and where to start.',
    minutes: 5,
    level: 'Everyone',
    sections: [
      {
        heading: 'Two engines in one',
        body: [
          'A full-strength Stockfish is not a good beginner opponent. It sees mate in twelve from move one, and it plays the same sterile way at every setting. So each level in ZenChess is a combination of three dials: search depth, the engine\'s own skill setting, and a chance of playing a random legal move.',
          'The last dial matters most. At level 1 the engine plays a random legal move more than half the time, which is exactly what a first-week player does: sometimes a sensible developing move, sometimes the rook from the corner.',
        ],
      },
      {
        heading: 'What the numbers mean',
        body: [
          'The Elo label is a calibration, not a promise. 1500 means the level plays roughly like a 1500-rated club player: it knows opening ideas, takes free material, and punishes obvious blunders. 3190 is uncapped Stockfish with NNUE evaluation — no handicap at all.',
          'Below about 1300 the labels get softer, because a weakened engine is not a person. A 900 level will miss a two-move tactic and then find a three-move one. Treat the label as a difficulty, not a rating.',
        ],
      },
      {
        heading: 'Choosing your level',
        body: [
          'Pick the level where you win about half your games. If you win four in a row without thinking, move up two levels. If you lose five in a row, move down two. The ladder is a tool, not a scoreboard.',
          'You can change the level in the middle of a game. The engine will play the next move at the new strength, which is a useful way to see the difference a few hundred Elo makes in the same position.',
        ],
      },
      {
        heading: 'Playing the strong levels honestly',
        body: [
          'From level 16 up, the engine searches deeply and never blunders deliberately. A takeback in a casual game is fine, but the honest way to use these levels is to play the whole game and then review it — the mistakes are the material.',
        ],
      },
    ],
  },
  {
    slug: 'opening-principles',
    title: 'Opening principles that beat memorisation',
    description: 'Five rules that carry you through the first ten moves of any opening, without a single line of theory.',
    minutes: 7,
    level: 'Beginner to club',
    sections: [
      {
        heading: 'Fight for the centre',
        body: [
          'The four squares in the middle — e4, d4, e5, d5 — are the high ground. Pieces placed there reach more squares, and pieces on the edge reach fewer. A pawn on e4 controls two central squares and opens two lines for your queen and bishop.',
          'You do not need to occupy all four. One or two pawns in the centre plus pieces aimed at it is enough. What you want to avoid is a move that does neither: a knight on the rim, a rook\'s pawn pushed for no reason.',
        ],
      },
      {
        heading: 'Develop before you attack',
        body: [
          'In the first ten moves, every tempo spent on a piece that leaves its starting square is a gain. Knights and bishops first, then castle, then connect the rooks. Do not move the same piece twice without a reason, and do not bring the queen out early — she becomes a target.',
          'A simple test after eight moves: how many of your pieces are still on their original squares? If it is more than one, you are probably behind in development.',
        ],
      },
      {
        heading: 'Castle early, and mean it',
        body: [
          'Castling does two jobs at once: it puts the king behind a wall of pawns and it activates a rook. Do it before the centre opens, not after. Most club games are decided by whichever king is still in the middle when the pieces come off.',
          'Castling also tells you where to attack. If your opponent castles short, the h-file and the g7 pawn become interesting. If they castle long, the a-file and the b7 pawn do.',
        ],
      },
      {
        heading: 'When you do not know the theory',
        body: [
          'Play the principled move. If you are out of the book, ask three questions in order: is my king safe, are my pieces developed, and can I improve my worst piece? The answer is almost always one of: castle, develop, or move the piece that is doing nothing.',
          'Avoid pawn moves that create permanent weaknesses, especially in front of your castled king. Pawns cannot go back, and a hole is a square your opponent can park a knight on for the next thirty moves.',
        ],
        bullets: [
          'Develop knights and bishops before queens and rooks.',
          'Castle inside the first ten moves when you can.',
          'Do not grab a pawn if it costs three tempos of development.',
          'Trade pieces, not pawns, when you are cramped.',
        ],
      },
    ],
  },
  {
    slug: 'tactics',
    title: 'Four tactical patterns that win club games',
    description: 'The fork, the pin, the skewer and the discovered attack — what they look like and how to spot them.',
    minutes: 8,
    level: 'Beginner to club',
    sections: [
      {
        heading: 'Start with the checklist',
        body: [
          'Strong players do not find tactics by staring. They run a checklist on every move: checks, captures, threats — yours and your opponent\'s. Most blunders happen because a capture or check was available and nobody looked.',
          'Before you play a move, look at every check your opponent would have in reply. This one habit removes more losses than any opening study.',
        ],
      },
      {
        heading: 'The fork',
        body: [
          'One piece attacks two targets at once, and only one can be saved. Knights are the classic forkers because their awkward pattern is easy to miss; pawns are the sneakiest, because a fork by a pawn usually also comes with check.',
          'Look for forks when your opponent\'s king and queen sit on squares a knight can reach together, or when two undefended pieces share a line.',
        ],
      },
      {
        heading: 'The pin',
        body: [
          'A piece is pinned when moving it would expose something more valuable behind it. A pinned knight cannot defend, and a pinned pawn cannot capture. Pile pressure on a pinned piece with a pawn, not with a piece of equal value.',
          'Absolute pins run to the king and cannot legally be broken. Relative pins run to the queen or a rook, and the pinned piece can move if the trade is good enough — which is exactly why pinning a queen is often weaker than it looks.',
        ],
      },
      {
        heading: 'The skewer and the discovered attack',
        body: [
          'A skewer is a pin backwards: you attack the valuable piece first, and when it moves, the piece behind it falls. They appear most often on open files and long diagonals, and almost always with check.',
          'A discovered attack is a move that uncovers another piece\'s line at the same time. The double check version — king attacked by two pieces and forced to move — is the most forcing pattern in chess, and the basis of many mating combinations.',
        ],
        bullets: [
          'Checks, captures, threats: run the list every move.',
          'Before moving a piece, ask what it was defending.',
          'A knight on the edge forks nothing.',
          'If you see a good tactic, look for a better one.',
        ],
      },
    ],
  },
  {
    slug: 'endgames',
    title: 'Endgame basics that decide half your games',
    description: 'King activity, passed pawns and the rook behind the pawn — the three ideas that win most endgames.',
    minutes: 7,
    level: 'Club',
    sections: [
      {
        heading: 'The king becomes a piece',
        body: [
          'In the middlegame the king hides. In the endgame it walks to the middle of the board, because with few pieces left the danger of checkmate is gone and its four-square reach is worth a bishop.',
          'Rule of thumb: as soon as the queens come off, the first thing to improve is your king. Bring it towards the pawns that matter, and take the opposition rather than chasing material.',
        ],
      },
      {
        heading: 'Passed pawns must be pushed',
        body: [
          'A passed pawn — one with no enemy pawn in front of it on its file or the two adjacent files — is a future queen. Push it, support it with the king, and use it to distract: a pawn on the seventh rank often wins a rook that has to stop it.',
          'The old rule of the square tells you whether the king catches a lone pawn: draw a square whose side is the pawn\'s distance to promotion. If the king is inside it, the pawn loses.',
        ],
      },
      {
        heading: 'Rooks belong behind passed pawns',
        body: [
          'Put your rook behind your own passed pawn to push it, and behind your opponent\'s to stop it. This is the single most repeated piece of endgame advice, and it decides a huge share of club games.',
          'In a pure rook ending, active play usually beats a pawn. Do not defend passively with your rook in front of the pawn if you can get it behind instead.',
        ],
      },
      {
        heading: 'Two practical traps',
        body: [
          'The fifty-move rule and the stalemate trap. When you are winning, count: after fifty moves without a capture or pawn move, the game is drawn. And when your opponent has only a king left, do not take the last square away — a stalemate throws away a whole game.',
          'Before you promote, check whether the new queen is actually needed. Two rooks mate more safely than a queen that can be forked.',
        ],
      },
    ],
  },
  {
    slug: 'study-plan',
    title: 'A study plan that fits in twenty minutes',
    description: 'How to turn one game a day and a short review into visible progress, without buying a course.',
    minutes: 6,
    level: 'Everyone',
    sections: [
      {
        heading: 'Ten minutes of play',
        body: [
          'Play one game at a level where you win about half the time. One. Not five. A game you think about is worth more than five you click through, and the point of the level is that it punishes the mistakes you can actually see.',
          'Play the same opening for a month. Repetition is what turns theory into memory, and the mistakes repeat too — which is useful, because you can fix them once.',
        ],
      },
      {
        heading: 'Five minutes of review',
        body: [
          'Paste the game into the analysis board and step through it with the engine on. Do not read every line. Find the two moves where the evaluation swung hardest, and ask what you missed: a check, a capture, an undefended piece.',
          'The pattern to look for is not "I blundered" but "I did not look at this kind of move". One missing habit is worth more than twenty missing variations.',
        ],
      },
      {
        heading: 'Five minutes of tactics',
        body: [
          'Solve positions until you get one wrong, then stop and understand it. Accuracy matters more than volume, and speed comes on its own once the patterns are in your head.',
          'If you are not sure what to solve, take the position from your own game where the evaluation swung. That is a puzzle you personally failed, which makes the lesson stick.',
        ],
      },
      {
        heading: 'What progress looks like',
        body: [
          'Not a rating jump. Progress looks like: fewer one-move blunders, a king that castles before move ten, and a rook that ends up behind the passed pawn without you thinking about it. Those are the habits that later turn into Elo.',
          'Give it six weeks at twenty minutes a day. The first two weeks feel like nothing is happening. The third is when the same positions start looking familiar.',
        ],
        bullets: [
          'One game, played slowly.',
          'Two turning points, reviewed honestly.',
          'One pattern, named and remembered.',
        ],
      },
    ],
  },
]

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug)
}
