# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This repository is a pre-implementation scaffold for an Arkanoid/Breakout-style browser game. There is no game source code yet (no HTML entry point, no game loop, no build tooling) — only game assets and a spec-driven workflow are in place:

- `assets/spritesheet-breakout.png` — the sprite sheet image.
- `assets/spritesheet.js` — sprite/frame coordinate maps (`SPRITES`, `EXPLOSION_FRAMES`) and canvas helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`) for drawing sprites from the sheet onto a `<canvas>` 2D context. This is the only functional code in the repo and defines the sprite naming convention future game code should reuse (e.g. `block_red`, `block_cyan`, `paddle`, `ball`).
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

Because there's no build system, framework, or entry point yet, don't assume conventions (bundler, module system, TypeScript, etc.) — check what actually exists before adding tooling, and prefer the simplest approach (plain HTML/canvas/JS) unless the user says otherwise.

## Spec-driven workflow

This repo uses a two-phase spec workflow implemented as custom skills, symlinked from `.agents/skills/` into `.claude/skills/`:

- **`/spec <description>`** (`.agents/skills/spec/SKILL.md`) — interactive spec design. Asks clarifying questions in phases, then writes a new spec to `specs/NN-slug.md` (numbered sequentially, kebab-case slug). Never writes code. New specs start in `Draft` state and must be manually changed to `Approved` before implementation.
- **`/spec-impl <NN-slug>`** (`.agents/skills/spec-impl/SKILL.md`) — implements an approved spec. Refuses to proceed unless the spec's state means "Approved" (in any language). Creates/switches to a git branch named `spec-NN-slug` (governed by `AutoCreateBranch` in `specs/.spec-config.yml`, default `true`), then implements the plan step by step, pausing for review after each step. Never commits automatically.

The `specs/` directory does not exist yet — it is created on first use of `/spec`. When working in this repo, check `specs/` for existing specs and their approval state before writing game code, since the intended flow is spec first (reviewed and approved by the human), implementation second.

Note: this directory is **not yet a git repository**. `/spec-impl`'s branch-creation step requires `git init` first.
