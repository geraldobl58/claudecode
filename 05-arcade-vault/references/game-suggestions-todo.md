# Game Suggestions TODO

Memória persistente do subagente `game-planner` (`.claude/agents/game-planner.md`). Ele lê esta tabela no início de toda execução e atualiza/acrescenta linhas ao final — é o único agente que deve escrever neste arquivo.

Colunas:

- **Origem**: `prototype` (existe pasta em `started-games/`) | `histórico` (card removido do catálogo, recuperável via `git show <hash>:src/data/games.ts`) | `ideia nova`
- **Status**: `Sugerido` | `Reconsiderado` | `Aceito` | `Rejeitado` | `Adiado` | `Portado`

| Data | Candidato | Categoria | Origem | Status | Racional |
| ---- | --------- | --------- | ------ | ------ | -------- |
| 2026-09-10 | `invaders` | SHOOTER | histórico | Sugerido | Card removido do catálogo original (pré-SPEC-05); sem prototype em `started-games/`, exigiria spec do zero como Snake (SPEC 08). |
| 2026-09-10 | `glutton` | ARCADE | histórico | Sugerido | Conceito estilo Pac-Man removido do catálogo original; sem prototype. |
| 2026-09-10 | `crossing` | ARCADE | histórico | Sugerido | Conceito estilo Frogger removido do catálogo original; sem prototype. |
| 2026-09-10 | `pixel-duel` | VERSUS | histórico | Sugerido | Único candidato que usaria a categoria `VERSUS`, hoje órfã em `GameCategory` (`src/data/games.ts`); sem prototype. |
