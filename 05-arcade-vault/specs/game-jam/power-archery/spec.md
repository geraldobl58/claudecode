# GJ-retro-sports — Power Archery (POWER_ARCHERY)

- **Estado:** Em revisão
- **Depende de:** SPEC 03, SPEC 04
- **Data:** 2026-09-10
- **Objetivo:** Criar do zero um jogo de tiro ao alvo com arco, mira oscilante, carga de potência e vento variável, na rota `/games/power-archery/play`, entrando no catálogo como `power-archery` na categoria SHOOTER e salvando pontuação no Supabase pelo mesmo caminho dos outros jogos.

## Por que esta spec existe

Esta spec nasceu de uma rodada de game jam com o tema **esportes retrô** (air hockey, boxe, corrida, tênis etc.), gerada sem protótipo — mesmo caso da SPEC 08 (Snake). Não existe `game.js` de referência em `started-games/` nem asset em `references/`; toda a mecânica descrita abaixo (oscilação da mira, curva de carga da potência, deriva do vento, tabela de pontuação por anel) foi **assumida por este agente para fins de brainstorm, sujeita a revisão humana** — não foi decidida com o usuário, ao contrário do que aconteceu na SPEC 08.

SHOOTER é hoje uma das duas categorias mais rasas do catálogo (só `rocks`, ao lado de PUZZLE com só `tetris`; ARCADE já tem dois jogos e VERSUS nenhum). `references/game-suggestions-todo.md` já lista vários candidatos de SHOOTER (`invaders`, `swarm-wing`, `chain-bug`, `vector-strike`, `turret-siege`, `depth-charge`) — todos de combate contra inimigos que se movem e atiram de volta. Este conceito é deliberadamente diferente: tiro ao alvo estático, sem inimigos, centrado em timing e precisão (carga de potência + leitura de vento), para não colidir em mecânica com nada já sugerido.

A arquitetura segue o padrão estabelecido: motor de canvas em refs React com `requestAnimationFrame`, HUD real fora do canvas via `onStateChange`/`onGameOver`, `useImperativeHandle` com `pause`/`resume`/`end`/`restart`, `GameOverModal` reutilizado sem mudança, catálogo em `src/data/games.ts` e leaderboard via `scores`/`submitScore` da SPEC 03.

## Escopo

**Dentro:**

- `src/components/games/power-archery-game.tsx`: motor do jogo — alvo de anéis concêntricos fixo no centro da cena, a uma distância fixa do arqueiro (vista de trás do arqueiro em direção ao alvo).
- **Alvo**: 5 anéis concêntricos com raios de **15 / 35 / 55 / 75 / 95 unidades** a partir do centro, valendo **10 / 8 / 6 / 4 / 2 pontos** respectivamente (impacto além de 95 unidades do centro = **0 pontos**, "errou o alvo").
- **Mira**: uma mira (crosshair) oscila automaticamente em movimento senoidal horizontal, amplitude de **±120 unidades** a partir do centro do alvo, com período inicial de **1.8 segundos** por ciclo completo. O período diminui **0.15s a cada "end" completo** (ver abaixo), com piso de **0.9 segundos** — a mira fica progressivamente mais rápida e difícil de cronometrar.
- **Carga de potência**: pressionar e segurar `Space` inicia o carregamento, subindo de **0% a 100% em 0.9 segundos** (linear). Soltar `Space` antes de **40%** de potência desperdiça a flecha: ela sai fraca e não alcança o alvo, registrando **0 pontos** para aquele tiro. Entre 40% e 100%, a flecha alcança o alvo normalmente.
- **Vento**: a cada flecha, um valor de vento é sorteado uniformemente entre **-50 e +50 unidades** de deriva lateral, exibido no HUD como um indicador de direção/intensidade **antes** do disparo (o jogador vê o vento antes de soltar `Space`, para poder compensar mirando fora do centro). A deriva final aplicada ao ponto de impacto é `vento * (1 - potência/100)` — quanto maior a potência no momento da soltura, menor o efeito do vento (flecha mais rápida = menos tempo exposta ao vento).
- **Cálculo do impacto**: `posição_de_impacto = posição_da_mira_no_momento_da_soltura + deriva_de_vento_aplicada`. A pontuação do tiro é lida pela distância entre `posição_de_impacto` e o centro do alvo, contra a tabela de anéis.
- **Ends**: a partida tem **6 ends de 3 flechas cada** (18 flechas no total). Ao fim das 3 flechas de um end, o período de oscilação da mira diminui (ver acima) antes do próximo end começar. Pontuação máxima teórica: 18 × 10 = **180 pontos**.
- **Fim de jogo**: após a 18ª flecha (última flecha do 6º end), a partida termina; `onGameOver(score)` é chamado uma única vez com a soma total.
- HUD (Score/End/Arrow/Wind/Power) fora do canvas: o componente reporta `{score, end, arrowInEnd, windValue, powerPct}` via `onStateChange` a cada frame.
- Render com primitivas de canvas: alvo como círculos concêntricos coloridos, mira como uma cruz/retículo simples, indicador de vento como uma seta fora do canvas no HUD (não desenhado sobre o alvo) — sem sprite sheet, não há asset de referência para este conceito.
- Canvas dimensionado ao contêiner (`.crt-screen`) via `ResizeObserver`, mantendo proporção `4:3`, com o alvo centralizado.
- `src/components/games/power-archery-play.tsx`: wrapper análogo a `arkanoid-play.tsx` — HUD real (Player/Score/End/Arrow/Wind/Power), botões PAUSE/END/EXIT, `GameOverModal` condicional, "PLAY AGAIN" via remount (`key` incrementada).
- `src/app/games/[id]/play/page.tsx`: novo branch `if (game.id === "power-archery") return <PowerArcheryPlay gameId={game.id} />`.
- `src/data/games.ts`: nova entrada `power-archery` — `id: "power-archery"`, `title: "POWER ARCHERY"`, `short: "Draw, aim through the wind, and put every arrow in gold."`, `long: "A neon archery range stretches into the fog. Track the oscillating crosshair, charge your draw, and loose arrows at a target that drifts with gusting crosswind. Six ends of three arrows each — chase a perfect 360."`, `cat: "SHOOTER"`, `cover: "cover-power-archery"` (classe nova, ver Plano), `color: "cyan"`.
- Nova classe `.cover-power-archery` em `src/app/globals.css`, seguindo o padrão visual das existentes (gradiente + `::after`).
- Seed de `public.games` no Supabase com a linha `('power-archery', 'POWER ARCHERY')`, mesma migration/abordagem da SPEC 03.

**Fora (para specs futuras ou já decidido não fazer):**

- Oscilação vertical da mira (só horizontal nesta versão) — reduz a superfície de calibração do MVP.
- Diferentes tipos de flecha/equipamento com atributos variados.
- Modo multiplayer (ranking local por turnos entre dois jogadores no mesmo teclado).
- Réplica visual do voo da flecha em arco (trajetória parabólica desenhada) — o impacto é calculado diretamente, sem animação de arco de flecha em voo.
- Som — nenhum asset de áudio previsto para este conceito.
- Controles touch/mobile.

## Modelo de dados

Nenhum modelo novo no Supabase. Reaproveita `scores`/`getTopScores`/`submitScore` da SPEC 03, com `game_id = "power-archery"`.

`end`, `arrowInEnd`, `windValue` e `powerPct` são estado de HUD em memória durante a partida e **não são persistidos** — o schema `scores` continua sendo `game_id`/`player_name`/`score`, como nos quatro jogos já implementados.

## Plano de implementação

1. Criar `src/components/games/power-archery-game.tsx`: estado em refs (fase da oscilação senoidal da mira, período atual do ciclo, potência atual do carregamento, vento sorteado da flecha atual, end atual, flecha atual dentro do end, score acumulado, fase — "mirando"/"carregando"/"resultado do tiro"); loop `requestAnimationFrame` avançando a oscilação da mira e o carregamento de potência quando `Space` está pressionado; listeners de teclado registrados e limpos em `useEffect`; `ResizeObserver` para o canvas; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart`.
2. Implementar o sorteio de vento por flecha, o cálculo de `posição_de_impacto` (mira no instante da soltura + deriva de vento escalada pela potência) e a leitura de pontos pela tabela de anéis (10/8/6/4/2/0).
3. Implementar a máquina de ends/flechas: avançar flecha dentro do end, reduzir o período da mira em 0.15s (piso 0.9s) a cada end completo, encerrar a partida após a 18ª flecha.
4. Adicionar `.cover-power-archery` em `src/app/globals.css`, seguindo o padrão das capas existentes.
5. Criar `src/components/games/power-archery-play.tsx`: HUD real (Player/Score/End/Arrow/Wind/Power), botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT; `GameOverModal` condicional ao estado `gameOver` — copiar a estrutura de `arkanoid-play.tsx` trocando o motor e as stats.
6. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `PowerArcheryPlay` quando `game.id === "power-archery"`.
7. Adicionar a entrada `power-archery` em `src/data/games.ts` (`GAMES`).
8. Aplicar migration de seed em `public.games` (`insert ... ('power-archery', 'POWER ARCHERY') on conflict do nothing`) via Supabase MCP.
9. Validar manualmente via Playwright MCP contra `/games/power-archery/play`: mira oscila continuamente sem input, `Space` carrega o medidor até 100% em 0.9s, soltar abaixo de 40% resulta em tiro de 0 pontos, soltar em cheio no centro da oscilação com vento zero acerta o anel de 10 pontos, vento desvia o impacto proporcionalmente a `(1 - potência/100)`, período da mira encurta a cada end (até o piso de 0.9s), partida termina exatamente após a 18ª flecha, `GameOverModal` salva no Supabase.

## Critérios de aceite

- [ ] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [ ] `/games/power-archery/play` renderiza o alvo de 5 anéis concêntricos e a mira oscilando horizontalmente sem nenhum input do jogador.
- [ ] A mira oscila em movimento senoidal com amplitude de ±120 unidades e período inicial de 1.8s por ciclo completo.
- [ ] Segurar `Space` carrega o medidor de potência de 0% a 100% em 0.9s.
- [ ] Soltar `Space` com potência abaixo de 40% produz um tiro que não alcança o alvo (0 pontos).
- [ ] Soltar `Space` com potência entre 40% e 100% calcula o impacto pela posição da mira no instante da soltura, deslocado pelo vento sorteado escalado por `(1 - potência/100)`.
- [ ] A pontuação de cada tiro segue a tabela de anéis (10/8/6/4/2 pontos conforme a distância do impacto ao centro) ou 0 se o impacto cair além de 95 unidades do centro.
- [ ] O vento sorteado de cada flecha (entre -50 e +50 unidades) é exibido no HUD antes do disparo, não só depois do resultado.
- [ ] O período de oscilação da mira diminui em 0.15s a cada end completo (3 flechas), com piso de 0.9s, e nunca fica abaixo disso.
- [ ] A partida sempre termina exatamente após a 18ª flecha (fim do 6º end), nunca antes nem depois.
- [ ] HUD (Score/End/Arrow/Wind/Power) reflete o estado real da partida em tempo real.
- [ ] Botão PAUSE congela a oscilação da mira e o carregamento de potência, e vira RESUME; botão END força o game over imediatamente.
- [ ] Ao terminar, `GameOverModal` mostra a pontuação final real e salva em `scores` com `game_id = "power-archery"`.
- [ ] "PLAY AGAIN" reinicia do zero (end 1, flecha 1, score 0, período de mira em 1.8s) sem recarregar a página.
- [ ] `power-archery` aparece na Home, na Library (`/games`) e no Hall of Fame, com pontuações reais assim que houver partidas salvas.

## Decisões

Todas as escolhas abaixo são propostas deste agente para fins de brainstorm da jam, não decisões fechadas com o usuário — sujeitas a revisão e ajuste humano antes de qualquer promoção para `specs/`.

- **Sim:** mecânica de tiro ao alvo estático com timing de mira oscilante + carga de potência + vento, em vez de qualquer variação de "atirar em inimigos que se movem" — escolhida para diferenciar este SHOOTER de todos os candidatos já listados em `references/game-suggestions-todo.md` para a categoria.
- **Sim:** vento visível **antes** do disparo, nunca escondido — decisão de fair play; esconder o vento tornaria o jogo mais sobre sorte do que sobre timing/leitura, o que descaracterizaria a categoria SHOOTER de precisão.
- **Sim:** o efeito do vento é escalado pela potência do disparo (`1 - potência/100`), recompensando cargas mais fortes com menos deriva — cria uma decisão real de trade-off entre "carregar mais" (mais precisão) e "soltar mais cedo" (mais tempo de reação à oscilação da mira).
- **Sim:** período da mira encurta progressivamente a cada end, com piso de 0.9s — cria curva de dificuldade dentro da própria partida sem precisar de "níveis" ou HUD extra.
- **Sim:** categoria SHOOTER, entre as duas categorias hoje mais rasas do catálogo junto com PUZZLE.
- **Não:** oscilação vertical da mira — mantém o MVP com uma única dimensão de timing, mais fácil de calibrar e testar.
- **Não:** som — nenhum asset previsto para esta primeira versão.

## Riscos

| Risco | Mitigação |
| --- | --- |
| `public.games` ainda não tem a linha `power-archery` — `submitScore` falha com violação de FK até a migration de seed rodar | Passo 8 do plano; mesmo padrão já resolvido para `rocks`, `tetris`, `arkanoid` e `snake`. |
| Mecânica sem protótipo de referência: não há um "original" para comparar o resultado e decidir se a curva de dificuldade (período da mira, força do vento) está calibrada | Os critérios de aceite acima são a fonte da verdade (amplitude, período inicial e piso, janela de potência, faixa de vento); qualquer ajuste de "feel" depois vira revisão desta spec, não mudança silenciosa no código. |
| Fórmula de deriva de vento escalada pela potência pode zerar completamente o efeito do vento em potência 100%, tornando o vento irrelevante para jogadores que sempre carregam ao máximo | Aceito conscientemente — carregar sempre ao máximo (0.9s) tem custo próprio: a mira já se moveu várias vezes durante a carga, então soltar no momento certo já é o desafio principal; jogadores que dominam o timing "pagam" com precisão, não é um exploit não intencional. |
| Sorteio de vento uniforme entre -50 e +50 pode, por azar, gerar sequências de vento sempre no mesmo extremo, tornando alguns ends artificialmente mais difíceis que outros | Aceito como parte do "feel" de esporte ao ar livre (vento real também varia); não há mitigação de RNG nesta versão — pode virar decisão de revisão futura (ex: clamping de sequência) se o humano achar o jogo injusto. |
| Cálculo de impacto dependente do instante exato da soltura de `Space` pode ser sensível a variação de frame rate entre dispositivos | Usar o mesmo acumulador de tempo por delta (não por contagem de frames) já padronizado desde a SPEC 08, garantindo oscilação e carga de potência independentes da taxa de quadros. |
