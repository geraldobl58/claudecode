# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A working Asteroids-style browser game implemented as plain HTML/CSS/JS — no framework, no build step, no package manager, no test suite.

## Running the game

Open `index.html` directly in a browser, or serve the directory with a static server:

```
python3 -m http.server
```

There is no lint, build, or test command — verify changes by reloading the page in a browser.

## Architecture

Everything lives in a single IIFE in `game.js` (~320 lines), closed over `canvas`/`ctx` module-level state. There are no separate modules/classes.

- **Entities as plain objects**, not classes: `ship` (single object), `bullets` and `asteroids` (arrays). All three are re-created by `resetGame()` / `spawnWave()`, not mutated into existence piecemeal.
- **Game loop**: `requestAnimationFrame(loop)` computes `dt` (delta time in seconds, capped at 0.05s to avoid spiral-of-death on tab-switch), then calls `update(dt)` followed by `draw()`. All motion/physics constants (thrust, turn speed, bullet speed, asteroid speed/size/points) are top-of-file constants — tune the game by editing those rather than inline magic numbers.
- **Input**: a `keys` object keyed by `KeyboardEvent.code`, set by `keydown`/`keyup` listeners; `update()` reads from it each frame rather than reacting to events directly. `CONTROL_KEYS` lists codes that get `preventDefault()` (so arrows/space don't scroll the page). Restarting after game over is the one event-driven exception, handled directly in the `keydown` listener (Enter, when `state.gameOver`).
- **Screen wrap**: the single `wrap(obj)` helper (mutates `x`/`y` in place against `canvas.width/height`) is applied to the ship, bullets, and asteroids every frame — reuse it for any new entity that should wrap instead of writing bounds logic inline.
- **Asteroid splitting**: `splitAsteroid(a)` encodes the size progression `large → medium(x2) → small(x2) → destroyed`, driven by the `ASTEROID_SIZES`/`ASTEROID_SPEED`/`ASTEROID_POINTS` maps keyed by size string. Collision-vs-split is handled in `update()`'s bullet/asteroid double loop using a labeled `outer:` continue to safely splice both arrays mid-iteration.
- **Waves**: `spawnWave()` spawns `3 + state.wave` large asteroids at random edge positions; a new wave starts automatically once `asteroids.length === 0`.
- **State object** (`state`): `score`, `lives`, `wave`, `gameOver` — read directly by both `update()` and the HUD/game-over drawing functions rather than passed as parameters.
- **Rendering**: one `draw*` function per entity type (`drawShip`, `drawAsteroid`, `drawBullet`, `drawHUD`, `drawGameOver`), each doing its own `ctx.save()`/`translate`/`rotate`/`restore()` when needed. Ship invulnerability after respawn is visualized by skipping the draw call on alternating frames (blink), not by a separate opacity/effect system.
- Asteroid shapes are irregular polygons generated once at creation time (`offsets` array of per-vertex radius multipliers), not procedurally redrawn — store any new per-instance visual variation the same way rather than recomputing it every frame.

## UI text

In-game text (game over / restart prompt) is in Portuguese (pt-BR); `index.html` sets `lang="pt-BR"`. Keep new user-facing strings consistent with that unless told otherwise.
