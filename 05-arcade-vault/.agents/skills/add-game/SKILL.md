---
name: add-game
description: Generates a spec for porting a started-games/<slug> prototype into the Arcade Vault platform (React component, catalog entry, Supabase leaderboard), pre-filled with the established SPEC 03/04 port pattern. Use when adding a new playable game to the platform.
disable-model-invocation: true
argument-hint: '<slug in started-games/> (e.g. arkanoid, tetris)'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(git show:*), Bash(git log:*)
---

# /add-game — Game port spec generator

## Session context

Today's date (use this for the spec header, never guess it):
!`date +%F`

Specs that already exist:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist yet"`

Prototypes available to port:
!`ls started-games/ 2>/dev/null || echo "The started-games/ folder does not exist"`

Current catalog:
!`cat src/data/games.ts 2>/dev/null || echo "src/data/games.ts not found"`

---

## Philosophy

This is not a general-purpose spec designer — that is `/spec`. This skill exists because porting a game from `started-games/` into the platform is a **repeatable recipe**, established by SPEC 03 (Supabase `scores` schema, generic by `game_id`) and SPEC 04 (Asteroids port: canvas engine in component refs driven by `requestAnimationFrame`, HUD reported via callbacks instead of drawn on the canvas, `GameOverModal` reused unchanged, wiring into the catalog and the `/games/[id]/play` route). Writing that recipe out by hand for every new game invites drift. This skill's job is to gather only the facts that are genuinely specific to the game being ported, and generate a new spec that follows that recipe exactly — the human still reviews and approves it before `/spec-impl` touches any code.

**You never write code here. You never modify `src/`. The only file you write is the new spec under `specs/`.**

## Command flow

Follow these phases in order. Do not skip Phase 3 — asking only what is genuinely unresolved is the entire value of this skill over a generic `/spec` run (which would ask everything from scratch).

### Phase 0 — Resolve the game

The received argument is: `$ARGUMENTS`

- If empty: list the subfolders of `started-games/` from the session context above, cross-reference against existing specs (a spec whose title/objective mentions that folder name or its `game.js` path means it is already ported or already has a spec in progress), and ask the user which un-ported prototype to generate a spec for. Stop and wait.
- If given: resolve it against the `started-games/` subfolders (exact match, or the closest unambiguous one). If no match, show the available slugs and ask the user to correct it.
- Verify `started-games/<slug>/game.js` and `started-games/<slug>/index.html` both exist — this skill only handles canvas/JS prototypes shaped like the existing ones (`asteroids`, `arkanoid`, `tetris`). If the prototype is structured very differently, say so and ask whether to continue anyway or hand off to plain `/spec`.
- Check `specs/` for a file that already covers this slug (by reading objectives, not just filenames — a spec might reference the prototype without the slug being in the filename). If one exists, tell the user and ask whether they want to revise it (via `/spec`, not this skill) or stop.

### Phase 1 — Reread the reference pattern

Before looking at the new prototype, reload the pattern being replicated so the new spec is consistent, not reinvented:

1. Read `specs/04-asteroids-game.md` in full. This is the template to imitate section by section — not `.agents/skills/spec/template.md`. That generic template uses an English blockquote header (`> **Status:** Draft`); this repo's real specs use a Portuguese bullet-list header (`- **Estado:** ...`). **Always follow what the existing specs actually do, never the generic template**, exactly like `/spec` itself is instructed to.
2. Read `specs/03-supabase-integration.md`, specifically its **Modelo de dados** section — the `scores` table (`game_id text`, `player_name text`, `score integer`, no other columns). Every new game reuses this schema unchanged by default.
3. Read the code the pattern is built on, so the generated spec cites real paths instead of re-describing behavior from memory:
   - `src/components/games/asteroids-game.tsx` — refs-based engine, `useImperativeHandle` exposing `pause`/`resume`/`end`/`restart`, `onStateChange`/`onGameOver` callbacks.
   - `src/components/games/rocks-play.tsx` — the wrapper pattern (HUD, PAUSE/END/EXIT buttons, `GameOverModal` mounted conditionally, "PLAY AGAIN" via remount `key`).
   - `src/components/game-over-modal.tsx` — already generic (`gameId`, `finalScore`, `onPlayAgain?`), calls `submitScore`. Never propose changing this file; the new spec just says it is reused as-is.
   - `src/app/games/[id]/play/page.tsx` — the `if (game.id === "...") return <XPlay .../>` branch to extend.
   - `src/lib/scores.ts` and `src/app/hall-of-fame/page.tsx` — already fully data-driven from `GAMES`; a new catalog entry needs no changes here.

### Phase 2 — Learn the prototype

Read `started-games/<slug>/game.js`, `index.html`, and `CLAUDE.md` (and `started-games/<slug>/specs/`, if that prototype has its own spec history — it documents intent the code alone won't show). Extract:

- **Controls**: which keys, what they do.
- **Core mechanics**: the entities and rules that make the game what it is (collision, scoring rule, difficulty progression).
- **Win/loss condition**: what ends the game. Do not assume "lives" — not every game has them (Tetris does not; it ends when a piece can't spawn).
- **Real HUD fields**: only the stats the prototype actually tracks (Score always; Lives/Level/Lines only if the prototype has them). Copying Asteroids' exact HUD (Score/Lives/Level) onto a game that doesn't have lives is a mistake this skill exists to avoid.
- **Prototype-only features** that are candidates for "Fora de escopo": sound/music, sprite sheets or other image assets, a local leaderboard already built into the prototype (name/score/localStorage), a level-select or settings screen. Default recommendation for all of these: leave them out, matching the precedent set by the Asteroids port (canvas-only rendering, no sound, no prototype-local persistence).

Then look for a reusable catalog card instead of inventing one:

- Search the git history of `src/data/games.ts` for a removed entry that thematically matches this prototype (`git log --oneline -- src/data/games.ts`, then `git show <commit>:src/data/games.ts` on commits before the SPEC 05 catalog reduction). SPEC 05 removed 7 mocked cards; several already match `started-games/` prototypes by theme — e.g. a breakout-style card matches an Arkanoid prototype, a falling-pieces card matches a Tetris prototype. If you find a match, plan to **restore its exact fields** (`title`/`short`/`long`/`cat`/`cover`/`color`) rather than writing new copy.
- If a match is found, check `src/app/globals.css` for its `cover` class (e.g. `grep -n "cover-<name>"`) to confirm the CSS still exists (it likely does — SPEC 05 only trimmed the data array, not the CSS).
- If no thematic match exists in history, this becomes a Phase 3 question: the user needs to supply a catalog id, title, and short/long copy, and you need to confirm (or pick) an available `cover` CSS class and `color`/`cat` value.

### Phase 3 — Ask only what's still ambiguous

Use `AskUserQuestion` (or a numbered list if unavailable) for exactly what Phases 1–2 could not resolve on their own. Do not re-ask what you already found with certainty. Typical open points, when they apply:

1. **Catalog id + card copy**, only if Phase 2 found no matching removed entry in `src/data/games.ts` history.
2. **HUD field set**, if the prototype's stats don't map cleanly onto Score/Lives/Level (state the fields you found and ask the user to confirm, rather than assuming).
3. **Data that doesn't fit the `scores` schema** (e.g. a prototype that tracks lines cleared, combo multipliers, or anything beyond a single integer score). Default recommendation: keep the schema as-is (score only); the extra fields stay as in-game HUD state, not persisted. Flag this explicitly — never silently propose extending the `scores` table.
4. **Anything from the "prototype-only features" list in Phase 2** that seems like it might actually matter to the user for this game (e.g. sound was a deliberate part of the experience) — default recommendation is still "leave it out, future spec if wanted."

If Phases 1–2 answered everything with certainty (a catalog match was found, HUD fields are unambiguous, no extra data to persist), skip straight to Phase 4 — do not manufacture questions for the sake of asking.

### Phase 4 — Write the spec

1. Determine the next sequential number from the `specs/` listing in the session context (highest existing + 1, zero-padded to two digits).
2. Name the file `NN-<catalog-id>-game.md` — the **catalog id**, not the `started-games/` folder name, since they can differ (a prototype folder `arkanoid/` might restore a catalog card whose id is `block-buster`).
3. Write `specs/NN-<catalog-id>-game.md` following the same section order and the same header labels as `specs/04-asteroids-game.md`, in Portuguese, matching this repo's real convention (not `template.md`'s generic English blockquote):
   - Header: `- **Estado:** Rascunho`, `- **Depende de:** SPEC 03, SPEC 04` (plus any other spec this depends on), `- **Data:**` (from the session context, never guessed), `- **Objetivo:**` (one sentence).
   - `## Por que esta spec existe` — same tone as SPEC 04: name the prototype being ported and the pattern being reused.
   - `## Escopo` — **Dentro**/**Fora**, concrete, grounded in Phase 2's findings, not invented.
   - `## Modelo de dados` — state plainly that no new schema is introduced, reusing `scores`/`getTopScores`/`submitScore` from SPEC 03 with the specific `game_id`. If Phase 3 surfaced extra prototype data, document the "keep it HUD-only, not persisted" decision here or in Decisões.
   - `## Plano de implementação` — numbered steps mirroring SPEC 04's: create `src/components/games/<slug>-game.tsx` (engine), create `src/components/games/<catalog-id>-play.tsx` (wrapper), extend the `page.tsx` branch, add/restore the catalog entry in `src/data/games.ts`, seed `public.games` with the new `game_id` via the Supabase MCP, validate manually (Playwright MCP against the real route).
   - `## Critérios de aceite` — boolean, verifiable, grounded in the actual mechanics found in Phase 2 (not generic "it works").
   - `## Decisões` — cite the reused-pattern decisions from SPEC 04 as still valid here, plus anything decided in Phase 3.
   - `## Riscos` — always include the `public.games` seed dependency (score inserts will fail on the FK until the seed runs) and any risk specific to porting this prototype's mechanics faithfully.
4. Verify every spec referenced in `Depende de` actually exists in `specs/` — never write a dangling reference.
5. Mark the state `Rascunho`. **Never mark it `Aprovado`/`Implementado` automatically** — the user does that after rereading it.

### Phase 5 — Confirm

- Announce the path of the file you created.
- Remind the user it is in `Rascunho` state and needs to be changed to `Aprovado` before `/spec-impl NN-<catalog-id>-game` can run.
- **Stop here.** Do not propose implementing the spec, writing code, or taking any further action beyond this confirmation.

## Hard rules

- **Never write code.** Only the spec `.md` file, at the very end.
- **Never modify anything under `src/`, `started-games/`, or the Supabase project.** Read-only exploration of those; the deliverable is the spec text.
- **Never invent mechanics or catalog copy that aren't grounded** in the prototype's actual code or in a real removed catalog entry from git history. If something is genuinely unknown, ask in Phase 3.
- **Never propose changing the `scores` schema silently.** If a game's data doesn't fit `game_id`/`player_name`/`score`, that is an explicit, flagged decision in Decisões — default to leaving the extra data out of persistence.
- **Always follow this repo's real spec conventions** (Portuguese, bullet-list header, section order from `specs/04-asteroids-game.md`), never `.agents/skills/spec/template.md`'s generic shape.
- **Never propose implementing the spec after saving it.** Your job ends at Phase 5. The user runs `/spec-impl` when ready.

## Arguments

`$ARGUMENTS` is the slug of the prototype folder under `started-games/` (e.g. `arkanoid`, `tetris`) — not the catalog id, which may differ and gets resolved in Phase 2. If empty, list the available un-ported prototypes and ask.
