# GJ-retro-sports — Turbo Sprint (TURBO_SPRINT)

- **Estado:** Em revisão
- **Depende de:** SPEC 03, SPEC 04
- **Data:** 2026-09-10
- **Objetivo:** Criar do zero uma corrida de 100 metros estilo Track & Field na rota `/games/turbo-sprint/play`, com controle por alternância de teclas, disputa contra um rival de ritmo fixo e pontuação por tempo de prova, entrando no catálogo como `turbo-sprint` na categoria VERSUS (hoje órfã) e salvando pontuação no Supabase pelo mesmo caminho dos outros jogos.

## Por que esta spec existe

Esta spec nasceu de uma rodada de game jam com o tema **esportes retrô** (air hockey, boxe, corrida, tênis etc.), gerada sem protótipo — mesmo caso da SPEC 08 (Snake). Não existe `game.js` de referência em `started-games/` nem asset em `references/`; toda a mecânica descrita abaixo (velocidade por alternância de teclas, largada falsa, ritmo do rival, fórmula de pontuação por tempo) foi **assumida por este agente para fins de brainstorm, sujeita a revisão humana** — não foi decidida com o usuário, ao contrário do que aconteceu na SPEC 08.

`VERSUS` é hoje a única categoria de `GameCategory` sem nenhum jogo no catálogo (ARCADE tem `arkanoid`/`snake`, PUZZLE tem `tetris`, SHOOTER tem `rocks`). `references/game-suggestions-todo.md` já lista candidatos de VERSUS (`pixel-duel`, `air-hockey`, `tank-clash`, `grid-siege`, `ring-clash`, `orbit-duel`) — todos mecânicas de confronto direto num mesmo campo (rebote de bola, disco, tanques, fila da velha, luta ou gravidade). Este conceito é deliberadamente diferente: uma corrida de pista contra um ritmo fixo, sem colisão entre os dois corredores, para não colidir em mecânica com nada já sugerido.

A arquitetura segue o padrão estabelecido: motor de canvas em refs React com `requestAnimationFrame`, HUD real fora do canvas via `onStateChange`/`onGameOver`, `useImperativeHandle` com `pause`/`resume`/`end`/`restart`, `GameOverModal` reutilizado sem mudança, catálogo em `src/data/games.ts` e leaderboard via `scores`/`submitScore` da SPEC 03.

## Escopo

**Dentro:**

- `src/components/games/turbo-sprint-game.tsx`: motor do jogo — pista horizontal de **100 metros**, vista lateral, câmera acompanhando o corredor do jogador; o rival (CPU) corre numa raia paralela acima ou abaixo.
- **Controles**: alternar `ArrowLeft`/`ArrowRight` (ou `Z`/`X`) o mais rápido possível. Cada alternância válida (tecla diferente da última, dentro de uma janela de **220 ms** desde o toque anterior) soma **+2.5 m/s** à velocidade atual, até um teto de **12 m/s**. Sem alternância válida dentro da janela, a velocidade decai por atrito a **6 m/s²**. Apertar a mesma tecla duas vezes seguidas (sem alternância) não soma velocidade.
- **Largada**: antes da corrida, uma sequência "ON YOUR MARKS... SET..." dura um tempo aleatório de **1.2 a 3.0 segundos** antes de "GO!". Qualquer tecla pressionada antes de "GO!" é uma **largada falsa** — feedback visual (flash vermelho + corredor volta à posição inicial), a corrida **não reinicia**. Na **segunda largada falsa da mesma partida**, o jogador é desclassificado: `onGameOver(0)` é chamado imediatamente, pontuação zero.
- **Rival**: corre em ritmo constante de **9 m/s**, terminando a prova em exatos **11.11 s**. Ritmo fixo e determinístico (não é rubber-band em cima do histórico do jogador) — decisão explícita para manter a partida testável e reprodutível.
- **Linha de chegada**: aos 100 m, a corrida termina para o jogador (independente da posição do rival); `onGameOver(score)` é chamado uma única vez com o tempo final convertido em pontuação.
- **Pontuação**: `score = round(max(0, (15 - tempo_final_segundos) * 400))`. Um tempo de 10s vale 2000 pontos; 12s vale 1200; 15s ou mais vale 0. Se o jogador cruzar a linha antes do rival, soma-se um **bônus fixo de +500 pontos** ao resultado final. A pontuação é sempre submetida ao terminar a prova (vitória ou derrota), exceto em desclassificação (score 0, sem tela de resultado de tempo).
- HUD (Speed/Distance/Position/False Starts) fora do canvas: o componente reporta `{speedMs, distanceM, position, falseStarts}` via `onStateChange` a cada frame e chama `onGameOver(score)` uma única vez ao cruzar a linha ou ao desclassificar.
- Render com primitivas de canvas: pista com raias, marcações de metro em metro a cada 10m, corredor do jogador e do rival como figuras simples (retângulo/círculo com "pernas" animadas por alternância de frames), sem sprite sheet — não há asset de referência para este conceito.
- Canvas dimensionado ao contêiner (`.crt-screen`) via `ResizeObserver`, mantendo proporção `4:3` como os demais jogos (câmera horizontal fixa acompanhando o jogador, sem scroll vertical).
- `src/components/games/turbo-sprint-play.tsx`: wrapper análogo a `snake-play.tsx` — HUD real (Player/Score/Speed/Position), botões PAUSE/END/EXIT, `GameOverModal` condicional, "PLAY AGAIN" via remount (`key` incrementada).
- `src/app/games/[id]/play/page.tsx`: novo branch `if (game.id === "turbo-sprint") return <TurboSprintPlay gameId={game.id} />`.
- `src/data/games.ts`: nova entrada `turbo-sprint` — `id: "turbo-sprint"`, `title: "TURBO SPRINT"`, `short: "Race a rival to the tape in a frantic 100m dash."`, `long: "Alternate your feet as fast as you can to build speed down a neon 100-meter track. A rival sprinter locked to a steady pace chases you stride for stride — false-start twice and you're disqualified. Cross the tape first for the win, or fall short and watch the crowd groan."`, `cat: "VERSUS"`, `cover: "cover-turbo-sprint"` (classe nova, ver Plano), `color: "yellow"`.
- Nova classe `.cover-turbo-sprint` em `src/app/globals.css`, seguindo o padrão visual das existentes (gradiente + `::after`), já que nenhuma capa reservada de card histórico cobre este conceito.
- Seed de `public.games` no Supabase com a linha `('turbo-sprint', 'TURBO SPRINT')`, mesma migration/abordagem da SPEC 03.

**Fora (para specs futuras ou já decidido não fazer):**

- Modo dois jogadores locais (P1 vs P2 no mesmo teclado) — este MVP é sempre jogador vs. rival CPU de ritmo fixo; multiplayer local vira spec própria se aprovado.
- Rubber-banding do rival com base no histórico de tempos do jogador (ex: melhor tempo salvo em `scores`) — decidido manter ritmo fixo para determinismo e testabilidade nesta primeira versão.
- Múltiplas provas (200m, revezamento, obstáculos) — só os 100m rasos.
- Efeitos de fadiga, lesão ou "puxar músculo" por excesso de alternância — mecânica de Track & Field clássica, fora do MVP.
- Som — nenhum asset de áudio previsto para este conceito.
- Controles touch/mobile.

## Modelo de dados

Nenhum modelo novo no Supabase. Reaproveita `scores`/`getTopScores`/`submitScore` da SPEC 03, com `game_id = "turbo-sprint"`.

`speedMs`, `distanceM`, `position` e `falseStarts` são estado de HUD em memória durante a partida e **não são persistidos** — o schema `scores` continua sendo `game_id`/`player_name`/`score`, como nos quatro jogos já implementados.

## Plano de implementação

1. Criar `src/components/games/turbo-sprint-game.tsx`: estado em refs (velocidade atual, distância percorrida, última tecla e timestamp do último toque válido, posição do rival, contagem de largadas falsas, fase da corrida — "aguardando"/"largada falsa"/"corrida"/"chegada"); loop `requestAnimationFrame` com acumulador de tempo para avançar distância do jogador e do rival; listeners de teclado registrados e limpos em `useEffect`; `ResizeObserver` para o canvas; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart`.
2. Implementar a sequência de largada (temporizador aleatório 1.2–3.0s, detecção de tecla pressionada antes de "GO!", contagem de largadas falsas, desclassificação na segunda).
3. Implementar a física de alternância de teclas (janela de 220ms, incremento de 2.5 m/s por alternância válida, teto de 12 m/s, atrito de 6 m/s² sem input) e o avanço do rival a 9 m/s constantes.
4. Implementar a condição de chegada (jogador atinge 100m), cálculo da fórmula de pontuação e chamada de `onGameOver`.
5. Adicionar `.cover-turbo-sprint` em `src/app/globals.css`, seguindo o padrão das capas existentes.
6. Criar `src/components/games/turbo-sprint-play.tsx`: HUD real (Player/Score/Speed/Position/False Starts), botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT; `GameOverModal` condicional ao estado `gameOver` — copiar a estrutura de `snake-play.tsx` trocando o motor e as stats.
7. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `TurboSprintPlay` quando `game.id === "turbo-sprint"`.
8. Adicionar a entrada `turbo-sprint` em `src/data/games.ts` (`GAMES`).
9. Aplicar migration de seed em `public.games` (`insert ... ('turbo-sprint', 'TURBO SPRINT') on conflict do nothing`) via Supabase MCP.
10. Validar manualmente via Playwright MCP contra `/games/turbo-sprint/play`: sequência de largada dispara, tecla antes de "GO!" conta como largada falsa, segunda largada falsa desclassifica com score 0, alternância de setas acelera o corredor, ausência de input desacelera, corredor cruza os 100m e encerra a corrida, pontuação bate com a fórmula, `GameOverModal` salva no Supabase.

## Critérios de aceite

- [ ] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [ ] `/games/turbo-sprint/play` renderiza a pista de 100m, o corredor do jogador e o rival numa raia paralela.
- [ ] A corrida só começa após a sequência "ON YOUR MARKS... SET... GO!"; pressionar qualquer tecla antes de "GO!" registra uma largada falsa com feedback visual, sem reiniciar a corrida.
- [ ] A segunda largada falsa da mesma partida desclassifica o jogador e encerra a partida com `score = 0`.
- [ ] Alternar `ArrowLeft`/`ArrowRight` dentro de 220ms entre toques aumenta a velocidade em 2.5 m/s por alternância, até o teto de 12 m/s; pressionar a mesma tecla repetidamente não soma velocidade.
- [ ] Sem alternância válida, a velocidade decai a 6 m/s² até zero.
- [ ] O rival avança a ritmo constante de 9 m/s, terminando a prova em 11.11s quando não pausado.
- [ ] Cruzar os 100m encerra a corrida para o jogador e calcula a pontuação pela fórmula `round(max(0, (15 - tempo) * 400))`, com bônus de +500 se o jogador chegou antes do rival.
- [ ] HUD (Speed/Distance/Position/False Starts) reflete o estado real da corrida em tempo real.
- [ ] Botão PAUSE congela a corrida e vira RESUME; botão END força o game over imediatamente.
- [ ] Ao terminar, `GameOverModal` mostra a pontuação final real e salva em `scores` com `game_id = "turbo-sprint"`.
- [ ] "PLAY AGAIN" reinicia do zero (velocidade 0, distância 0, largadas falsas 0, nova sequência de largada) sem recarregar a página.
- [ ] `turbo-sprint` aparece na Home, na Library (`/games`) e no Hall of Fame, com pontuações reais assim que houver partidas salvas.

## Decisões

Todas as escolhas abaixo são propostas deste agente para fins de brainstorm da jam, não decisões fechadas com o usuário — sujeitas a revisão e ajuste humano antes de qualquer promoção para `specs/`.

- **Sim:** corrida contra um rival CPU de ritmo fixo (9 m/s), em vez de dois jogadores locais ou rubber-banding pelo histórico — mantém a mecânica determinística e fácil de testar/verificar nos critérios de aceite.
- **Sim:** mecânica de alternância de teclas com janela de 220ms como controle central, clássica de jogos de corrida retrô (Track & Field/Hyper Sports), escolhida para diferenciar este VERSUS de todos os candidatos já listados em `references/game-suggestions-todo.md` (nenhum deles usa alternância de teclas nem corrida sem colisão).
- **Sim:** duas largadas falsas desclassificam com pontuação zero — reforça o "feel" retrô de tensão na largada sem tornar a partida frustrante logo na primeira falha.
- **Sim:** pontuação por fórmula de tempo (`(15 - tempo) * 400`) em vez de só vitória/derrota binária — mantém compatibilidade com o schema `scores` (`score` numérico) sem precisar de coluna nova, e permite ranquear corredores mesmo quando perdem para o rival.
- **Sim:** categoria VERSUS, priorizando a única categoria hoje sem nenhum jogo no catálogo.
- **Não:** multiplayer local (P1 vs P2) — fica para uma spec futura caso o conceito seja aprovado e o humano queira expandir.
- **Não:** som — nenhum asset previsto para esta primeira versão.

## Riscos

| Risco | Mitigação |
| --- | --- |
| `public.games` ainda não tem a linha `turbo-sprint` — `submitScore` falha com violação de FK até a migration de seed rodar | Passo 9 do plano; mesmo padrão já resolvido para `rocks`, `tetris`, `arkanoid` e `snake`. |
| Mecânica sem protótipo de referência: não há um "original" para comparar o resultado e decidir se o ritmo de alternância está calibrado | Os critérios de aceite acima são a fonte da verdade (janela de 220ms, incrementos de 2.5 m/s, teto de 12 m/s); qualquer ajuste de "feel" depois vira revisão desta spec, não mudança silenciosa no código. |
| Janela de alternância de 220ms pode ser rápida demais ou lenta demais dependendo do teclado/latência do navegador, tornando o jogo injogável em algumas máquinas | Valor calibrável isolado numa única constante do motor; validação manual (passo 10) deve testar em pelo menos um teclado físico antes de aprovar a implementação. |
| Fórmula de pontuação por tempo pode gerar valores negativos ou desproporcionais se o `tempo_final_segundos` ultrapassar 15s | `max(0, ...)` já piso a fórmula em zero; critério de aceite cobre o caso explicitamente. |
| Categoria VERSUS pode ser preenchida antes por outro candidato já em `references/game-suggestions-todo.md` (ex: `pixel-duel`), tornando este conceito redundante do ponto de vista de "abrir a categoria" | Não é um risco técnico, é uma decisão de priorização humana; a spec continua válida como um segundo jogo VERSUS mesmo que outro chegue primeiro, já que a mecânica não colide com nenhum candidato listado. |
