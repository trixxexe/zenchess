// All copy lives here so the page can be read and edited in one place.

export const brand = {
  name: 'ZenChess',
  tagline: 'A quiet room for serious chess',
  author: 'Ritam',
}

export const nav = {
  links: [
    { label: 'Play', href: '#/play' },
    { label: 'Analyse', href: '#/analyse' },
    { label: 'Review', href: '#/review' },
    { label: 'Learn', href: '#/learn' },
    { label: 'Levels', href: '#levels' },
  ],
  cta: { label: 'Play free', href: '#/play' },
}

export const hero = {
  badge: 'Free forever · no account · runs in your browser',
  title: ['Play chess', 'at exactly your level'],
  highlight: 'your level',
  description:
    'Twenty calibrated strengths of Stockfish, from a 500-rated beginner to the full engine. Analysis, guides and PGN export included. No sign-up, no ads, nothing to install.',
  primary: { label: 'Play a game', href: '#/play' },
  secondary: { label: 'Open the analysis board', href: '#/analyse' },
  footnote: 'Free forever, no account needed. Made by Ritam.',
}

export const standards = ['Stockfish', 'NNUE', 'Syzygy', 'UCI', 'PGN', 'FEN', 'Chess960', 'WASM']

export const features = {
  eyebrow: 'Everything in one place',
  title: 'A real chess room, not a puzzle box',
  description: 'Play, analyse and study without a login, an install, or a subscription.',
  items: [
    {
      key: 'levels',
      title: 'Twenty levels of Stockfish',
      description: 'From 500 Elo to the full engine. The low levels play like beginners, not like throttled masters.',
      span: 2,
    },
    {
      key: 'analysis',
      title: 'Analysis that explains',
      description: 'Engine lines in plain SAN, an evaluation bar and an arrow for the best move.',
      span: 1,
    },
    {
      key: 'local',
      title: 'Private by design',
      description: 'The engine runs on your device. No account, no upload, no tracking.',
      span: 1,
    },
    {
      key: 'guides',
      title: 'Guides worth reading',
      description: 'Opening principles, tactical patterns, endgame basics and a twenty-minute study plan.',
      span: 2,
    },
  ],
}

export const levels = {
  eyebrow: 'Engine levels',
  title: 'Twenty steps from first game to 3190 Elo',
  description:
    'Each level combines search depth, engine skill and a chance of a human mistake. Nothing jumps at you from the first move.',
}

export const steps = {
  eyebrow: 'How it works',
  title: 'Sit down, play, understand',
  items: [
    {
      title: 'Pick your level',
      description: 'Anything from 500 to 3190 Elo. Change it mid-game and the next move changes with it.',
    },
    {
      title: 'Play the game',
      description: 'Drag or tap to move, with legal-move dots, clocks, hints and promotion handled.',
    },
    {
      title: 'Take it to analysis',
      description: 'Every game exports as PGN. Paste it into the analysis board and see where it turned.',
    },
  ],
}

export const showcase = {
  eyebrow: 'Inside the app',
  title: 'One board, three ways to look at it',
  tabs: [
    {
      key: 'play',
      title: 'Play',
      description: 'A calm board with both clocks, captured pieces and hints that stay out of the way.',
    },
    {
      key: 'analyse',
      title: 'Analyse',
      description: 'Up to three engine lines, a running evaluation and an arrow for the best move.',
    },
    {
      key: 'learn',
      title: 'Learn',
      description: 'Five guides on openings, tactics, endgames and how to actually practise.',
    },
  ],
}

export const metrics: { value: number; decimals?: number; suffix?: string; label: string }[] = [
  { value: 20, label: 'Engine levels' },
  { value: 3190, label: 'Top strength, in Elo' },
  { value: 0, label: 'Accounts required' },
  { value: 0, label: 'Installs needed' },
]

export const free = {
  eyebrow: 'Pricing',
  title: 'Everything is included. There are no plans.',
  description:
    'No tiers, no trials, no feature gates, no accounts. Twenty levels, analysis, game review, guides and PGN export — the whole app, for everyone.',
  promises: [
    { title: 'Every level', description: 'All twenty strengths, from 500 to full Stockfish. No locked “pro” engine.' },
    { title: 'Every feature', description: 'Analysis, game review, hints, clocks, guides. Nothing held back.' },
    { title: 'No account', description: 'No sign-up, no email, no password. Open the page and play.' },
    { title: 'No tracking', description: 'No analytics, no ads, no third-party scripts. The engine runs locally.' },
  ],
}

export const support = {
  eyebrow: 'Support',
  title: 'Stuck, found a bug, or want to argue about level 12?',
  description: 'Two ways to reach a human. Both are free, like everything else here.',
  discord: {
    invite: 'https://discord.gg/stardevs',
    username: 'ritam.dev',
    description: 'The community server for bugs, ideas and games — usually the fastest answer.',
  },
  github: {
    description:
      'Open an issue with the position, the moves and what you expected. That is the most useful bug report you can send.',
  },
}

export const faq = {
  title: 'Questions, answered',
  items: [
    {
      q: 'Is it really free?',
      a: 'Yes. Every engine level, the analysis board and the guides are free, with no account, no trial and no upsell. The whole app is static files and the engine runs locally, so there is nothing to meter.',
    },
    {
      q: 'Do I need an account?',
      a: 'No. There is no sign-up at all. Games live in the page until you close it — export the PGN if you want to keep one.',
    },
    {
      q: 'Where does Stockfish run?',
      a: 'In a Web Worker on your device, as WebAssembly. Your browser downloads the engine once (about 1.8 MB) and caches it. Nothing about your games is sent anywhere.',
    },
    {
      q: 'How are the twenty levels calibrated?',
      a: 'Each level sets the engine skill, the search depth and a chance of a random legal move. The low levels are deliberately unreliable, which is what makes them feel like a beginner rather than a weakened engine.',
    },
    {
      q: 'Does it work on a phone?',
      a: 'Yes. Tap a piece then a square, or drag it. The layout adapts down to small phones, and the engine is the same one the desktop uses.',
    },
    {
      q: 'Can I keep or share my games?',
      a: 'Yes. Copy the PGN from the play page or download it as a file, then paste it into the analysis board — or any other chess program — later.',
    },
  ],
}

export const cta = {
  title: 'Take a seat at the board',
  description: 'Twenty levels of Stockfish, waiting quietly. No card, no account, no download.',
  primary: { label: 'Play a game', href: '#/play' },
  secondary: { label: 'Read the guides', href: '#/learn' },
}

export const footer = {
  blurb:
    'ZenChess is a calm, browser-native chess room powered by Stockfish. Play, study and improve at your own pace.',
  madeBy: `Made by ${brand.author}`,
  columns: [
    {
      title: 'App',
      links: [
        { label: 'Play', href: '#/play' },
        { label: 'Analyse', href: '#/analyse' },
        { label: 'Game review', href: '#/review' },
        { label: 'Guides', href: '#/learn' },
        { label: 'Engine levels', href: '#levels' },
      ],
    },
    {
      title: 'Learn',
      links: [
        { label: 'Opening principles', href: '#/learn/opening-principles' },
        { label: 'Tactical patterns', href: '#/learn/tactics' },
        { label: 'Endgame basics', href: '#/learn/endgames' },
        { label: 'Study plan', href: '#/learn/study-plan' },
        { label: 'How levels work', href: '#/learn/levels' },
      ],
    },
    {
      title: 'Project',
      links: [
        { label: 'Source code', href: '__repo__' },
        { label: 'Report a bug', href: '__issues__' },
        { label: 'Contribute', href: '__repo__' },
        { label: 'Stockfish licence', href: './engine/COPYING.txt' },
        { label: 'Made by Ritam', href: '#/support' },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'Support', href: '#/support' },
        { label: 'Discord', href: '__discord__' },
        { label: 'GitHub issues', href: '__issues__' },
        { label: 'FAQ', href: '#faq' },
        { label: 'Free forever', href: '#free' },
      ],
    },
  ],
  legal: `© ${new Date().getFullYear()} ZenChess. Free and open source.`,
}
