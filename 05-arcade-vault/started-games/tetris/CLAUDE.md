# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running

No build, install, or test tooling. Open `index.html` directly in a browser, or serve it:

```
python3 -m http.server 8000
```

Scripts are loaded as a plain `<script>` tag (not a module), so keep `game.js` free of
`import`/`export` unless `index.html` is switched to `<script type="module">`.

## Architecture

Everything lives in three files with no separation into modules: `index.html` (page shell +
canvas + stats panel), `styles.css`, and `game.js` (all logic). `game.js` is organized top to
bottom as: piece/shape data → pure board/geometry helpers → rendering functions → particle/juice
effects → mutable game state → game-loop functions → input handling → the `requestAnimationFrame`
loop. There are no classes and no external state container — game state is a set of module-level
`let` variables (`board`, `currentPiece`, `score`, `lines`, `level`, `paused`, `gameOver`).

Key mechanics to know before editing:

- **Pieces** (`SHAPES` in game.js:8-54) are square matrices (2x2, 3x3, or 4x4) rather than the
  classic 4x4-only SRS convention, so rotation (`rotateMatrix`) pivots each piece around its own
  matrix center. In addition to the 7 standard tetrominoes, `PLUS` and `U` pieces exist.
- **Two timing systems run independently**: `dropTimer` (a `setInterval`, speed derived from
  `dropInterval()` which scales with `level`) drives gravity/soft-drop ticks, while
  `requestAnimationFrame` (`animationLoop`) drives rendering and particle/shake/flash effects
  using a delta-time (`dt`) accumulator. Don't conflate the two when changing timing behavior.
- **Locking a piece** (`lockPiece`) merges it into `board`, clears full rows (`clearLines`,
  which mutates `board` via `splice`/`unshift`), updates score/lines/level, restarts the drop
  timer (since level may have changed the interval), spawns the next piece, and checks the new
  piece's spawn position for game over.
- **Line-clear "juice"** (particles, screen shake, white flash) is driven by `spawnExplosion`,
  which is called from `lockPiece` and scales intensity with the number of simultaneous line
  clears (Tetris = biggest effect). This is purely visual and separate from scoring/game state.
- Colors are declared once in `COLORS` and reused for both live pieces and locked board cells,
  so a locked cell's color doubles as its "occupied" truthiness check throughout the board logic.
