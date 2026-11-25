# ZenChess

A free chess app that runs entirely in the browser. Play Stockfish at twenty levels, analyse any position,
review a finished game move by move, and read the guides — no account, no ads, no backend, no paid plans.

Made by Ritam.

## What is in it

- **Play** (`#/play`) — twenty engine levels from 500 to 3190 Elo, colour choice, optional clocks (bullet to
  classical), hints, takebacks, board flip, captured pieces, move list and PGN copy/download. Click or drag to
  move; promotion, check and illegal moves are handled.
- **Analyse** (`#/analyse`) — free board, up to three engine lines rendered in SAN, evaluation bar, best-move
  arrow, depth and MultiPV sliders, FEN/PGN import and copy.
- **Review** (`#/review`) — a chess.com-style game review: every move graded (Best → Blunder), accuracy per
  player, an evaluation graph and a move list you can step through. Games from **Play** hand themselves over
  with one click; you can also paste any PGN.
- **Learn** (`#/learn`) — five guides: how the levels work, opening principles, tactical patterns, endgame
  basics and a twenty-minute study plan.
- **Support** (`#/support`) — Discord ([stardevs](https://discord.gg/stardevs), user `ritam.dev`) or a GitHub
  issue.

Everything is free: there are no plans, tiers, trials or feature gates.

## Layouts

One codebase, two layouts. Desktop uses the top navigation bar and side-by-side board/panel columns; phones
get a full-width board, stacked panels, a bottom tab bar with safe-area padding for iOS, and touch-first board
interaction (`touch-action: none`, tap or drag).

## Run it

```sh
bun install
bun run dev        # http://localhost:5173
bun run build      # static site in dist/
bun run typecheck
```

Any static file server works for the built site. Routing is hash-based, so no server rewrites are needed.

## Deploy to GitHub Pages

1. Push this repository to GitHub with `main` as the default branch.
2. In **Settings → Pages**, set **Source** to *GitHub Actions*.
3. Push to `main`. `.github/workflows/deploy.yml` typechecks, builds and publishes `dist/`.

The build uses relative asset paths (`base: './'`), so it works at `https://<user>.github.io/<repo>/` or on a
custom domain without configuration. Support links derive the repository URL from the Pages hostname
(`src/lib/repo.ts`), so they point at the right repo once deployed.

## The engine

Stockfish 19 (lite, single-threaded WebAssembly) lives in `public/engine/` and is loaded in a Web Worker. It is
single-threaded on purpose: multi-threaded wasm needs `SharedArrayBuffer`, which needs COOP/COEP headers that
GitHub Pages cannot send. The single-threaded build needs neither.

Levels are built from three dials — UCI `Skill Level`, search depth, and a chance of playing a random legal move —
so the low levels play like weak humans rather than a throttled master.

## Licence

The app code is yours to use. The piece artwork in `public/pieces/cburnett/` is the **Cburnett** set by
Colin M.L. Burnett, used under CC BY-SA 3.0 (see the `LICENCE.txt` beside the files).

The engine files in `public/engine/` are **GPLv3** (Stockfish by the Stockfish team,
compiled by [stockfish.js](https://github.com/nmrugg/stockfish.js)); the full licence text ships alongside them in
`public/engine/COPYING.txt`, and the corresponding source is published in those upstream repositories.
