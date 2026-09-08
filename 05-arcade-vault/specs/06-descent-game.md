# 06 — Tetris Game (DESCENT)

- **Estado:** Aprovado
- **Depende de:** SPEC 03, SPEC 04, SPEC 05
- **Data:** 2026-09-08
- **Objetivo:** Portar o protótipo standalone `started-games/tetris/` para um componente React jogável dentro da rota `/games/descent/play`, reocupando o slot `descent` do catálogo (removido pela SPEC 05 por não ter jogo real) com gameplay de verdade e leaderboard no Supabase.

## Por que esta spec existe

`started-games/tetris/` é um Tetris funcional em HTML/Canvas/JS puro (tabuleiro, 9 tipos de peça, rotação, drop/hard-drop, combo, níveis, preview da próxima peça), sem framework, feito fora do app Next.js. Antes da SPEC 05 reduzir `GAMES` a só `rocks`, o catálogo já tinha um card `descent` ("Fit the pieces before the ceiling crushes you... clear lines to survive. The speed ramps up without mercy every 10 lines.", categoria PUZZLE, cor magenta, capa `cover-tetro`) que já descrevia exatamente esse protótipo — inclusive o detalhe "every 10 lines" bate com `LINES_PER_LEVEL = 10` no código. O CSS desse card (`.cover-tetro` em `globals.css`) nunca foi removido, só o objeto em `src/data/games.ts`. Esta spec segue o molde que a SPEC 04 estabeleceu para Asteroids (motor em refs React, HUD real fora do canvas, `submitScore`/`getTopScores` da SPEC 03) — gerada pela skill `/add-game` a partir da leitura de `started-games/tetris/game.js` e `CLAUDE.md`.

## Escopo

**Dentro:**

- `src/components/games/descent-game.tsx`: motor do jogo portado de `started-games/tetris/game.js` — tabuleiro, as 9 formas de peça do protótipo (7 tetrominoes clássicos + `PLUS` + `U`, em `SHAPES`), rotação própria por matriz quadrada (`rotateMatrix`, pivota no centro da própria matriz — **não** é a convenção SRS clássica de 4x4), movimento lateral (`ArrowLeft`/`ArrowRight`), soft drop (`ArrowDown`, +1 ponto por célula), hard drop (`Space`, +2 pontos por célula), lock+merge da peça no tabuleiro, `clearLines`, pontuação por linhas simultâneas (`LINE_SCORES = [0, 40, 100, 300, 1200]` × `level`), combo (contagem de locks consecutivos que limpam linha, zera se um lock não limpa nada), `level = nível inicial + floor(lines / 10)`, intervalo de queda decrescente por nível (`dropInterval`), preview da próxima peça.
- Canvas dimensionado ao contêiner (`.crt-screen`) via `ResizeObserver`, mesmo padrão da SPEC 04 — não os `300x600`/`120x120` fixos do protótipo original.
- HUD (Score/Lines/Level) e "GAME OVER" **não** desenhados no canvas — o componente reporta `{score, lines, level}` via `onStateChange` e chama `onGameOver(score)` uma única vez; **sem** stat "Lives" — Tetris não tem vidas, o jogo termina quando a peça nova não cabe ao spawnar.
- `src/components/games/descent-play.tsx`: wrapper client component análogo a `rocks-play.tsx` — monta `DescentGame`, liga o HUD real (Player/Score/Lines/Level), preview da próxima peça, os botões PAUSE/END/EXIT, mostra `GameOverModal` (reutilizado sem mudança) só ao terminar, com "PLAY AGAIN" reiniciando via remount (`key` incrementada).
- `src/app/games/[id]/play/page.tsx`: novo branch `if (game.id === "descent") return <DescentPlay gameId={game.id} />`.
- `src/data/games.ts`: restaurar o objeto `descent` removido pela SPEC 05, com os mesmos campos que já existiam antes (`title: "DESCENT"`, `short`, `long`, `cat: "PUZZLE"`, `cover: "cover-tetro"`, `color: "magenta"`) — só restaurar, não reescrever copy.
- Seed de `public.games` no Supabase com a linha `('descent', 'DESCENT')`, mesma migration/abordagem da SPEC 03.

**Fora (para specs futuras ou já decidido não fazer):**

- Tela de seleção de nível inicial do protótipo (`initial-level-select`) — o port sempre começa no nível 1, mesma simplicidade dos outros ports (Asteroids sempre começa na onda 1).
- Seletor de tema visual (`theme-select`) do protótipo.
- Leaderboard local próprio do protótipo (`start-leaderboard`/`gameover-leaderboard`, nome+score+lines+combo salvos em `localStorage`, botão "clear scores") — o app já tem seu próprio leaderboard real via Supabase (SPEC 03/05); portar o do protótipo também criaria dois "recordes" diferentes e confusos para o jogador.
- Estatísticas all-time do protótipo (melhor combo, máximo de linhas), guardadas em chaves de `localStorage` separadas — não fazem parte do modelo `scores`.
- Efeitos de partícula / screen-shake / flash branco ao limpar linhas (`spawnExplosion`) — segundo o próprio `CLAUDE.md` do protótipo, é "puramente visual e separado de score/estado do jogo"; fica fora do port inicial, pode virar uma spec própria depois (mesma filosofia de manter o port simples, como a SPEC 04 deixou som de fora).
- Som — o protótipo não tem nenhum (sem `Audio`/`.mp3` no código), então não há nada a portar nem a excluir aqui; mencionado só por paridade com as outras specs de port.
- Controles touch/mobile — só teclado, como todos os ports até agora.

## Modelo de dados

Nenhum modelo novo. Reaproveita `scores`/`getTopScores`/`submitScore` da SPEC 03, com `game_id = "descent"`.

**Decisão explícita:** o protótipo grava `lines` e `combo` no leaderboard local dele. O schema `scores` da SPEC 03 só tem `score integer` — `lines`/`level` ficam apenas como estado de HUD em memória durante a partida, **não são persistidos**. Ver Decisões.

## Plano de implementação

1. Criar `src/components/games/descent-game.tsx`: portar `SHAPES`/`rotateMatrix`/`collides`/board/`clearLines`/`lockPiece`/pontuação de `started-games/tetris/game.js` para refs de componente; preservar os dois mecanismos de timing do protótipo — um "drop timer" (equivalente ao `setInterval` de `dropInterval()`, reiniciado a cada mudança de `level`) para a gravidade, e `requestAnimationFrame` para o loop de render — ambos registrados/limpos em `useEffect`; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart`, mesmo contrato de `AsteroidsGameHandle`.
2. Criar `src/components/games/descent-play.tsx`: HUD real (Player/Score/Lines/Level), preview da próxima peça, botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT (link existente); `GameOverModal` condicional ao estado `gameOver` — copiar a estrutura de `rocks-play.tsx` trocando o motor e as stats do HUD.
3. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `DescentPlay` quando `game.id === "descent"`.
4. Restaurar o objeto `descent` em `src/data/games.ts` (`GAMES`), na mesma posição/forma que tinha antes da SPEC 05.
5. Aplicar migration de seed em `public.games` (`insert ... ('descent', 'DESCENT') on conflict do nothing`) via Supabase MCP, mesma abordagem da SPEC 03.
6. Validar manualmente via Playwright MCP contra `/games/descent/play`: peça atual move/rotaciona/soft-drop/hard-drop, linha completa é removida e soma pontos (checar clear simultâneo de múltiplas linhas = maior pontuação), `level` sobe a cada 10 linhas e a queda acelera, peça nova que não cabe termina o jogo, `GameOverModal` salva no Supabase.

## Critérios de aceite

- [ ] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [ ] `/games/descent/play` renderiza um tabuleiro jogável: peça atual move com as setas laterais, rotaciona com seta pra cima, soft drop com seta pra baixo, hard drop com espaço.
- [ ] Peça trava ao colidir por baixo/lateral e se funde ao tabuleiro; uma nova peça é sorteada e aparece no topo.
- [ ] Linha(s) completa(s) são removidas do tabuleiro e somam pontos conforme `LINE_SCORES × level` (1 linha = 40×level, 2 = 100×level, 3 = 300×level, 4 simultâneas = 1200×level).
- [ ] `level` sobe a cada 10 linhas completadas (`lines / 10`) e a velocidade de queda aumenta de acordo.
- [ ] HUD (Score/Lines/Level) reflete o estado real do jogo em tempo real, não valores fixos.
- [ ] Botão PAUSE congela o jogo (queda e input) e vira RESUME; botão END força o game over imediatamente.
- [ ] Uma peça nova que não cabe ao spawnar termina o jogo (sem sistema de vidas).
- [ ] Ao terminar, `GameOverModal` mostra a pontuação final real e permite salvar com um nome, gravando em `scores` com `game_id = "descent"`.
- [ ] "PLAY AGAIN" reinicia o jogo do zero (score 0, lines 0, level inicial, tabuleiro vazio) sem recarregar a página.
- [ ] `descent` aparece na Home, na Library (`/games`) e no Hall of Fame ao lado de `rocks` (e de `block-buster`, se já portado), com pontuações reais assim que houver partidas salvas.

## Decisões

- **Sim:** reaproveitar 100% o padrão de port da SPEC 04 (refs + `requestAnimationFrame`, `useImperativeHandle`, HUD fora do canvas, `GameOverModal` sem mudança) — já validado em produção para Asteroids.
- **Sim:** restaurar o objeto `descent` com os mesmos textos/cores que já existiam no catálogo mockado — o card já foi desenhado para esse jogo (a descrição já cita "clear lines"/"every 10 lines").
- **Sim:** manter as 9 formas de peça do protótipo (7 tetrominoes clássicos + `PLUS` + `U`) e a rotação própria por matriz quadrada (`rotateMatrix`) em vez de "corrigir" para a convenção SRS clássica — é o que o protótipo original faz; mudar isso seria uma reformulação de gameplay, não um port.
- **Sim:** manter os dois mecanismos de timing do protótipo (drop timer separado do loop de render) em vez de forçar tudo num único `requestAnimationFrame` — o próprio `CLAUDE.md` do protótipo alerta para não conflar os dois; portar fielmente evita reintroduzir bugs de timing já resolvidos ali.
- **Não:** portar o leaderboard local do protótipo (nome+score+lines+combo em `localStorage`) — o app já tem leaderboard real via Supabase (SPEC 03/05); manter os dois seria redundante e confuso.
- **Não:** estender o schema `scores` para incluir `lines`/`combo`. Motivo: consistência com a SPEC 03 ("camada de dados genérica por `game_id`, não específica de um jogo") e com a SPEC 04 (não expandiu o schema para Asteroids/ondas). Se um dia quiserem ranquear por linhas/combo, é uma spec própria de schema.
- **Não:** portar tela de seleção de nível inicial, seletor de tema, estatísticas all-time (melhor combo/máximo de linhas) e efeitos de partícula/shake/flash — todos "fora" (ver Escopo), mesma filosofia de simplicidade já aplicada nos outros ports.

## Riscos

| Risco                                                                                                                                                                                             | Mitigação                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.games` ainda não tem a linha `descent` — `submitScore` falha até a migration de seed rodar                                                                                                | Passo 5 do plano de implementação; mesmo padrão de risco já resolvido para `rocks` na SPEC 03.                                                                                                            |
| Os dois mecanismos de timing do protótipo (drop timer por `setInterval` + `requestAnimationFrame` para render) portados incorretamente podem quebrar a sensação de gravidade/velocidade por nível | Portar `restartDropTimer()`/`dropInterval()` fielmente do protótipo, limpar o interval em `useEffect`/`end`/`pause`, testar visualmente a aceleração ao subir de nível antes de considerar o port pronto. |
| `rotateMatrix` pivota cada peça em torno do centro da própria matriz (2x2/3x3/4x4), diferente da convenção SRS clássica — fácil de "corrigir" sem querer e mudar o feel do jogo                   | Copiar a função exata do protótipo, sem tentar alinhar com SRS.                                                                                                                                           |
| Tecla `Space` (hard drop) e as setas ativarem foco de botões HTML da página, como já identificado na SPEC 04 para Asteroids                                                                       | Reaproveitar o mesmo `preventDefault()` em `keydown` já usado nos outros ports.                                                                                                                           |
