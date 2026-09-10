# Implemented Games

Games currently live in the catalog (`src/data/games.ts`), each with a canvas engine component and a real Supabase-backed leaderboard. See CLAUDE.md → Architecture for the shared `*-game.tsx` / `*-play.tsx` split these all follow.

| # | ID | Title | Category | Spec | Prototype (`started-games/`) |
| - | -- | ----- | -------- | ---- | ----------------------------- |
| 1 | `rocks` | ROCKS (Asteroids) | SHOOTER | [04-asteroids-game.md](../specs/04-asteroids-game.md) | `asteroids/` |
| 2 | `tetris` | TETRIS | PUZZLE | [06-tetris-game.md](../specs/06-tetris-game.md) | `tetris/` |
| 3 | `arkanoid` | ARKANOID | ARCADE | [07-arkanoid-game.md](../specs/07-arkanoid-game.md) | `arkanoid/` |
| 4 | `snake` | SNAKE | ARCADE | [08-snake-game.md](../specs/08-snake-game.md) | none — designed from scratch |

Component files:

- **ROCKS**: `src/components/games/asteroids-game.tsx` + `src/components/games/rocks-play.tsx`
- **TETRIS**: `src/components/games/tetris-game.tsx` + `src/components/games/tetris-play.tsx`
- **ARKANOID**: `src/components/games/arkanoid-game.tsx` + `src/components/games/arkanoid-play.tsx` + `src/components/games/arkanoid-sprites.ts`
- **SNAKE**: `src/components/games/snake-game.tsx` + `src/components/games/snake-play.tsx` + `src/components/games/snake-sprites.ts`

To port a new game, see CLAUDE.md → "Porting a new game" and use the `/add-game <slug>` skill.
