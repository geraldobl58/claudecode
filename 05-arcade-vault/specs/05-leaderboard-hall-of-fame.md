# 05 — Leaderboard real no Hall of Fame e catálogo reduzido

- **Estado:** Em revisão
- **Depende de:** SPEC 03, SPEC 04
- **Data:** 2026-09-08
- **Objetivo:** Substituir a pontuação mockada (`seededScores`) pela pontuação real do Supabase no Hall of Fame e na página de detalhe do jogo, e reduzir o catálogo (`GAMES`) aos jogos realmente jogáveis.

## Por que esta spec existe

Com Asteroids (SPEC 04) jogável e salvando no Supabase (SPEC 03), manter os outros 7 jogos do catálogo — que nunca tiveram implementação real, só card + `seededScores` fake — ficou inconsistente: a Home, a Library e o Hall of Fame prometiam 8 jogos jogáveis quando só 1 existe de verdade. Esta spec fecha esse gap: some com os jogos que não existem e troca os dados fake por dados reais nos lugares que já tinham infraestrutura pronta para isso.

## Escopo

**Dentro:**

- `src/data/games.ts`: `GAMES` reduzido a um único item, `rocks` (Asteroids/ROCKS) — os outros 7 objetos (`block-buster`, `descent`, `serpentine`, `glutton`, `invaders`, `crossing`, `pixel-duel`) removidos do array. `seededScores` continua existindo (ainda usada pelo ticker "LIVE ACTIVITY" da Home — fora de escopo, ver abaixo).
- `src/app/games/[id]/page.tsx` (detalhe do jogo): painel "TOP SCORES" passa a usar `getTopScores(id, 10)` sempre — o `id` só pode ser `"rocks"` agora, já que `generateStaticParams`/`notFound()` dependem de `GAMES`. Estado vazio adicionado ("No scores yet — be the first to play.") para quando a tabela ainda não tem linhas.
- `src/app/hall-of-fame/page.tsx`: abas passam a ser geradas de `GAMES` (hoje só "ROCKS"); pontuações buscadas via `getTopScores(tab, 12)` por aba, com cache em memória por aba (`rowsByTab`) para não refazer a query ao trocar de volta para uma aba já carregada; pódio (top 1/2/3) só renderiza com 3+ linhas reais, senão mostra "NO SCORES YET — BE THE FIRST TO PLAY {jogo}".
- `src/app/page.tsx` (Home): texto do card "CLASSIC GAMES" (seção "WHY ARCADE VAULT") deixa de citar jogos removidos ("Block Buster, Descent, Serpentine...") — reescrito para não prometer jogos que não existem.
- `src/lib/scores.ts`: mensagem de erro de `getTopScores` melhorada (`error.message` + `error.code` explícitos) — o log anterior (`console.error("...", error)`) aparecia como `{}` no overlay de erro do Next.js porque `message` não é uma propriedade enumerável de `Error`.

**Fora (para specs futuros):**

- Arkanoid e Tetris de volta ao catálogo (`GAMES`) — reentram quando forem portados como a SPEC 04 fez com Asteroids, cada um com sua própria spec de implementação.
- "YOUR BEST SCORE" no Hall of Fame (`youRank`/`youScore`) continua **fabricado** — não há vínculo estável entre o usuário mockado (`localStorage`) e as pontuações reais salvas em `scores` (`player_name` é texto livre, não um id de usuário). Corrigir isso exigiria autenticação real (fora de escopo da SPEC 03) ou casar por `player_name === user.name`, frágil e não implementado aqui.
- O ticker "LIVE ACTIVITY" e "TOP PLAYERS · TODAY" da Home continuam usando `seededScores` — são mocks de "atividade global" mostrados independente de qual jogo existe, não pontuação por jogo; ficam de fora desta spec.
- Filtrar os chips de categoria (`CATS`) da Library para refletir só categorias com jogo disponível — hoje filtrar por `PUZZLE`/`ARCADE`/`VERSUS` mostra corretamente o estado vazio já existente ("NO RESULTS FOUND"), então não é um bug, só ficou sem uso aparente até novos jogos voltarem ao catálogo.

## Modelo de dados

Nenhum modelo novo. Reaproveita a tabela `scores` da SPEC 03 via `getTopScores`.

## Plano de implementação

1. Reduzir `GAMES` em `src/data/games.ts` a `[{ id: "rocks", ... }]`.
2. Simplificar `src/app/games/[id]/page.tsx`: remover a ramificação `id === "rocks" ? getTopScores(...) : seededScores(...)`, usar sempre `getTopScores`; adicionar estado vazio no painel "TOP SCORES".
3. Simplificar `src/app/hall-of-fame/page.tsx`: remover a ramificação equivalente e o import de `seededScores`; buscar sempre via `getTopScores`, com cache por aba em `rowsByTab` para evitar refetch ao alternar entre abas já visitadas.
4. Reescrever o texto do card "CLASSIC GAMES" em `src/app/page.tsx` para não citar jogos removidos.
5. Melhorar a mensagem de erro em `src/lib/scores.ts` (`getTopScores`) para expor `error.message`/`error.code` em vez do objeto `Error` cru.
6. Validar manualmente via Playwright (Home, `/games`, `/hall-of-fame`) que só ROCKS aparece, sem erros novos no console além do 404 esperado de `scores`/`games` ainda não existirem no Supabase (SPEC 03, pendente).

## Critérios de aceite

- [x] Home ("GAMES AVAILABLE NOW"), Library (`/games`) e Hall of Fame (abas) mostram só ROCKS.
- [x] `npm run lint` e `tsc --noEmit` não reportam erros novos nos arquivos tocados.
- [x] Hall of Fame mostra "NO SCORES YET — BE THE FIRST TO PLAY ROCKS" quando não há pontuações (verificado com a tabela `scores` ainda inexistente no Supabase).
- [ ] Depois de salvar uma pontuação em `/games/rocks/play` (SPEC 04) e recarregar `/hall-of-fame` e `/games/rocks`, a pontuação aparece na lista — **bloqueado** até a SPEC 03 aplicar a migration (tabelas ainda não existem: erro `PGRST205` confirmado via `curl` direto no REST do Supabase).

## Decisões

- **Sim:** remover os 7 jogos de `GAMES` em vez de manter os cards visíveis com um badge "COMING SOON". Motivo: decisão explícita do usuário — cards de jogos que não existem de verdade (sem play, sem leaderboard real) confundem mais do que ajudam num catálogo que já tem 1 jogo real.
- **Sim:** cache de pontuações por aba (`rowsByTab`) no Hall of Fame em vez de refazer a query do Supabase toda vez que o usuário troca de aba e volta. Custo baixo, evita chamadas redundantes.
- **Não:** corrigir "YOUR BEST SCORE" agora. Motivo: exigiria decisão de identidade de usuário (auth real ou match frágil por nome) que não foi tomada — registrado aqui para não ser esquecido, não implementado.
- **Não:** tocar no ticker "LIVE ACTIVITY" da Home. Motivo: é mock de atividade global do site, não pontuação por jogo — está fora do que foi pedido nesta spec.

## O que **não** está nesta spec

- Arkanoid e Tetris de volta ao catálogo — cada um ganha sua própria spec de port quando entrar em escopo (mesmo molde da SPEC 04).
- "YOUR BEST SCORE" real no Hall of Fame — depende de uma decisão de identidade de usuário ainda não tomada.
- Qualquer alteração no ticker "LIVE ACTIVITY" / "TOP PLAYERS · TODAY" da Home.
