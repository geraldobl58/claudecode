# GJ-retro-sports — Neon Bowling (NEON_BOWLING)

- **Estado:** Em revisão
- **Depende de:** SPEC 03, SPEC 04
- **Data:** 2026-09-10
- **Objetivo:** Criar do zero um jogo de boliche retrô, com mira e potência ajustáveis, curva controlável e um placar simplificado de 10 frames, na rota `/games/neon-bowling/play`, entrando no catálogo como `neon-bowling` na categoria PUZZLE e salvando pontuação no Supabase pelo mesmo caminho dos outros jogos.

## Por que esta spec existe

Esta spec nasceu de uma rodada de game jam com o tema **esportes retrô** (air hockey, boxe, corrida, tênis etc.), gerada sem protótipo — mesmo caso da SPEC 08 (Snake). Não existe `game.js` de referência em `started-games/` nem asset em `references/`; toda a mecânica descrita abaixo (janela de mira oscilante, medidor de potência, curva da bola, sistema de pontuação simplificado por frame) foi **assumida por este agente para fins de brainstorm, sujeita a revisão humana** — não foi decidida com o usuário, ao contrário do que aconteceu na SPEC 08.

PUZZLE é hoje a segunda categoria mais rasa do catálogo (só `tetris`, ao lado de SHOOTER com só `rocks`; ARCADE já tem dois jogos e VERSUS nenhum). Boliche retrô se encaixa em PUZZLE porque a partida é **por turnos** (mirar, carregar potência, soltar, ver o resultado, próximo arremesso), sem loop contínuo de reflexo — o mesmo raciocínio de planejamento espacial que já justificou `crate-shift`/`mine-hunt` em `references/game-suggestions-todo.md`, aqui aplicado a um tema esportivo em vez de lógica pura.

A arquitetura segue o padrão estabelecido: motor de canvas em refs React com `requestAnimationFrame`, HUD real fora do canvas via `onStateChange`/`onGameOver`, `useImperativeHandle` com `pause`/`resume`/`end`/`restart`, `GameOverModal` reutilizado sem mudança, catálogo em `src/data/games.ts` e leaderboard via `scores`/`submitScore` da SPEC 03.

## Escopo

**Dentro:**

- `src/components/games/neon-bowling-game.tsx`: motor do jogo — pista (lane) vista de cima, largura lógica de **300 unidades**, comprimento até os pinos de **900 unidades**; a bola começa centralizada na base da pista (`x=150, y=900`).
- **Mira**: pressionar e segurar `ArrowLeft`/`ArrowRight` ajusta o ângulo de lançamento em **±1.5°/frame (a 60fps)**, limitado ao intervalo **-30° a +30°** a partir do centro da pista. O indicador de mira é uma linha reta da bola até o fim da pista, atualizada em tempo real.
- **Potência**: pressionar e segurar `Space` inicia o carregamento do medidor de potência, que sobe de **0% a 100% em 0.9 segundos** (linear); ao atingir 100%, o medidor volta a oscilar entre 100% e 0% em loop até `Space` ser solto. Soltar `Space` lança a bola com velocidade proporcional à potência no momento da soltura: **300 a 900 unidades/segundo** (potência 0% = 300, 100% = 900). Soltar com potência abaixo de **20%** é tratada como arremesso fraco: a bola para antes de alcançar os pinos (nenhum pino é derrubado).
- **Curva**: enquanto a bola está em movimento, segurar `ArrowLeft`/`ArrowRight` aplica um desvio lateral acumulado de até **±60 unidades** ao longo do trajeto (curva clássica de boliche), não altera o ângulo inicial já fixado no lançamento.
- **Pinos**: formação triangular padrão de 10 pinos (4-3-2-1), raio de colisão de **8 unidades** por pino, posicionados a partir de `y=100` até `y=40`, centralizados em `x=150`. Um pino é derrubado se a trajetória da bola (raio **10 unidades**) passar a uma distância menor que a soma dos raios do centro do pino.
- **Gutter (canaleta)**: se a posição `x` da bola sair do intervalo `[0, 300]` antes de alcançar a linha dos pinos, a bola cai na canaleta — arremesso encerrado sem derrubar nenhum pino restante.
- **Frames**: partida de **10 frames**. Cada frame tem até **2 arremessos**: se o primeiro derruba os 10 pinos (**strike**), o frame termina e os pinos são resetados para o próximo frame sem segundo arremesso; caso contrário, os pinos derrubados permanecem fora e o segundo arremesso mira nos pinos restantes; ao fim do segundo arremesso (derrubando todos os 10 entre os dois arremessos = **spare**, ou não), os pinos resetam para o próximo frame.
- **Pontuação simplificada** (não é o sistema oficial de boliche com bônus em cascata — ver Decisões): cada pino derrubado vale **10 pontos**; um strike soma um **bônus fixo de +50 pontos** além dos 100 pontos dos 10 pinos; um spare soma um **bônus fixo de +25 pontos** além dos pontos dos pinos derrubados nos dois arremessos. Placar acumulado ao longo dos 10 frames.
- **Fim de jogo**: após o segundo arremesso (ou strike) do 10º frame, a partida termina; `onGameOver(score)` é chamado uma única vez com a soma total.
- HUD (Score/Frame/Roll/Power) fora do canvas: o componente reporta `{score, frame, roll, powerPct}` via `onStateChange` a cada frame.
- Render com primitivas de canvas: pista com linhas de raia, marcação central, bola e pinos como formas geométricas simples (círculos), medidor de potência desenhado fora do canvas no HUD — sem sprite sheet, não há asset de referência para este conceito.
- Canvas dimensionado ao contêiner (`.crt-screen`) via `ResizeObserver`, mantendo proporção `4:3`, com a pista centralizada verticalmente ocupando a maior parte da altura disponível.
- `src/components/games/neon-bowling-play.tsx`: wrapper análogo a `tetris-play.tsx` — HUD real (Player/Score/Frame/Roll/Power), botões PAUSE/END/EXIT, `GameOverModal` condicional, "PLAY AGAIN" via remount (`key` incrementada).
- `src/app/games/[id]/play/page.tsx`: novo branch `if (game.id === "neon-bowling") return <NeonBowlingPlay gameId={game.id} />`.
- `src/data/games.ts`: nova entrada `neon-bowling` — `id: "neon-bowling"`, `title: "NEON BOWLING"`, `short: "Aim, power up, and strike down a full rack of neon pins."`, `long: "Ten frames, one lane bathed in neon light. Set your angle, hold to charge the power meter, and release to send the ball rolling. Curve it past the gutter, read the pin spread, and chase the perfect game."`, `cat: "PUZZLE"`, `cover: "cover-neon-bowling"` (classe nova, ver Plano), `color: "magenta"`.
- Nova classe `.cover-neon-bowling` em `src/app/globals.css`, seguindo o padrão visual das existentes (gradiente + `::after`).
- Seed de `public.games` no Supabase com a linha `('neon-bowling', 'NEON BOWLING')`, mesma migration/abordagem da SPEC 03.

**Fora (para specs futuras ou já decidido não fazer):**

- Sistema oficial de pontuação de boliche (bônus de strike/spare somando os próximos 1-2 arremessos em cascata) — decidido usar bônus fixo simplificado para manter a fórmula determinística e fácil de verificar num critério de aceite; sistema oficial vira spec própria se aprovado.
- Múltiplos jogadores/turnos alternados no mesmo teclado.
- Efeitos de "óleo da pista"/variação de atrito por raia ou por partida.
- Replay/câmera lenta da bola derrubando os pinos.
- Som — nenhum asset de áudio previsto para este conceito.
- Controles touch/mobile.

## Modelo de dados

Nenhum modelo novo no Supabase. Reaproveita `scores`/`getTopScores`/`submitScore` da SPEC 03, com `game_id = "neon-bowling"`.

`frame`, `roll` e `powerPct` são estado de HUD em memória durante a partida e **não são persistidos** — o schema `scores` continua sendo `game_id`/`player_name`/`score`, como nos quatro jogos já implementados.

## Plano de implementação

1. Criar `src/components/games/neon-bowling-game.tsx`: estado em refs (ângulo de mira atual, potência atual e direção do medidor, posição/velocidade da bola em movimento, lista de pinos em pé com posição, frame atual, arremesso atual dentro do frame, score acumulado, fase — "mirando"/"carregando"/"bola em movimento"/"resultado do arremesso"); loop `requestAnimationFrame` cuidando da física da bola quando em movimento e do preenchimento do medidor de potência quando `Space` está pressionado; listeners de teclado registrados e limpos em `useEffect`; `ResizeObserver` para o canvas; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart`.
2. Implementar a detecção de colisão bola-pino (raio 10 + raio 8) e a lógica de canaleta (gutter) quando `x` sai de `[0, 300]`.
3. Implementar a máquina de frames/arremessos: reset de pinos após strike ou após o segundo arremesso, contagem de pinos derrubados por arremesso, cálculo de pontuação (10 pontos/pino + bônus fixo de strike/spare), avanço para o próximo frame, encerramento no 10º frame.
4. Adicionar `.cover-neon-bowling` em `src/app/globals.css`, seguindo o padrão das capas existentes.
5. Criar `src/components/games/neon-bowling-play.tsx`: HUD real (Player/Score/Frame/Roll/Power), botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT; `GameOverModal` condicional ao estado `gameOver` — copiar a estrutura de `tetris-play.tsx` trocando o motor e as stats.
6. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `NeonBowlingPlay` quando `game.id === "neon-bowling"`.
7. Adicionar a entrada `neon-bowling` em `src/data/games.ts` (`GAMES`).
8. Aplicar migration de seed em `public.games` (`insert ... ('neon-bowling', 'NEON BOWLING') on conflict do nothing`) via Supabase MCP.
9. Validar manualmente via Playwright MCP contra `/games/neon-bowling/play`: mira responde às setas dentro de -30°/+30°, potência carrega e oscila após 100%, soltar `Space` abaixo de 20% resulta em arremesso fraco sem derrubar pinos, bola curva com input lateral durante o trajeto, strike reseta os pinos e soma 150 pontos (100 + bônus 50), spare soma o bônus de 25, canaleta encerra o arremesso sem derrubar pinos restantes, partida termina exatamente no 10º frame, `GameOverModal` salva no Supabase.

## Critérios de aceite

- [ ] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [ ] `/games/neon-bowling/play` renderiza a pista, os 10 pinos na formação triangular e a bola na posição inicial.
- [ ] `ArrowLeft`/`ArrowRight` ajustam o ângulo de mira em ±1.5°/frame, limitado a -30°/+30°, com o indicador de mira atualizado em tempo real.
- [ ] Segurar `Space` carrega o medidor de 0% a 100% em 0.9s e passa a oscilar em loop após atingir 100% até a tecla ser solta.
- [ ] Soltar `Space` lança a bola com velocidade entre 300 e 900 unidades/s proporcional à potência no momento da soltura.
- [ ] Soltar `Space` com potência abaixo de 20% produz um arremesso fraco que não alcança os pinos.
- [ ] Segurar `ArrowLeft`/`ArrowRight` enquanto a bola está em movimento aplica curva lateral, até um máximo de ±60 unidades de desvio acumulado.
- [ ] A bola sair do intervalo `x=[0,300]` antes da linha dos pinos encerra o arremesso como canaleta, sem derrubar pinos.
- [ ] Um strike (10 pinos no primeiro arremesso) soma 150 pontos (100 pelos pinos + 50 de bônus), reseta os pinos e avança direto para o próximo frame sem segundo arremesso.
- [ ] Um spare (10 pinos somados entre os dois arremessos do frame) soma um bônus de 25 pontos além dos pontos já contados pelos pinos.
- [ ] A partida sempre termina exatamente após o arremesso final do 10º frame, nunca antes nem depois.
- [ ] HUD (Score/Frame/Roll/Power) reflete o estado real da partida em tempo real.
- [ ] Botão PAUSE congela a partida (bola e medidor de potência) e vira RESUME; botão END força o game over imediatamente.
- [ ] Ao terminar, `GameOverModal` mostra a pontuação final real e salva em `scores` com `game_id = "neon-bowling"`.
- [ ] "PLAY AGAIN" reinicia do zero (frame 1, score 0, 10 pinos em pé) sem recarregar a página.
- [ ] `neon-bowling` aparece na Home, na Library (`/games`) e no Hall of Fame, com pontuações reais assim que houver partidas salvas.

## Decisões

Todas as escolhas abaixo são propostas deste agente para fins de brainstorm da jam, não decisões fechadas com o usuário — sujeitas a revisão e ajuste humano antes de qualquer promoção para `specs/`.

- **Sim:** pontuação simplificada (10 pontos/pino + bônus fixo de strike/spare), em vez do sistema oficial de boliche com bônus em cascata sobre os próximos arremessos — mantém a fórmula determinística e verificável num único critério de aceite, sem precisar rastrear dependência entre frames.
- **Sim:** mecânica turn-based (mirar → carregar potência → soltar → resultado) em vez de loop contínuo, escolhida para reforçar a categoria PUZZLE, hoje quase tão rasa quanto SHOOTER.
- **Sim:** curva controlável durante o trajeto da bola, em vez de só um ângulo fixo no lançamento — traz uma segunda camada de precisão ao "puzzle" de acertar os pinos, sem depender de física realista de rotação da bola.
- **Sim:** medidor de potência que oscila em loop após 100% em vez de travar no máximo — clássico de jogos de esporte retrô (golfe, boliche, arco e flecha de Track & Field), força o jogador a cronometrar a soltura.
- **Sim:** categoria PUZZLE, entre as duas categorias hoje mais rasas do catálogo junto com SHOOTER.
- **Não:** múltiplos jogadores/turnos alternados — fica para spec futura caso o conceito seja aprovado.
- **Não:** som — nenhum asset previsto para esta primeira versão.

## Riscos

| Risco | Mitigação |
| --- | --- |
| `public.games` ainda não tem a linha `neon-bowling` — `submitScore` falha com violação de FK até a migration de seed rodar | Passo 8 do plano; mesmo padrão já resolvido para `rocks`, `tetris`, `arkanoid` e `snake`. |
| Mecânica sem protótipo de referência: não há um "original" para comparar o resultado e decidir se a curva/potência estão calibradas | Os critérios de aceite acima são a fonte da verdade (janela de potência de 0.9s, curva máxima de 60 unidades, raios de colisão); qualquer ajuste de "feel" depois vira revisão desta spec, não mudança silenciosa no código. |
| Pontuação simplificada pode "parecer errada" para jogadores que conhecem o sistema oficial de boliche (bônus em cascata) | Aceito conscientemente nesta spec (ver Decisões); se o humano revisor preferir o sistema oficial, isso é uma revisão explícita da spec antes da promoção, não um bug. |
| Colisão bola-pino por distância simples pode permitir que a bola "atravesse" um pino em velocidades altas sem detectar colisão num único frame (tunneling) | Verificar colisão por segmento de reta percorrido no frame (posição anterior → posição atual), não só pela posição pontual, ao implementar o passo 2 do plano. |
| Detecção de gutter pode disparar cedo demais se a curva lateral (±60 unidades) empurrar a bola para fora do intervalo antes da linha dos pinos, mesmo com mira dentro dos limites | Comportamento aceito como parte da mecânica (curva tem risco); critério de aceite cobre o caso, e é responsabilidade do jogador dosar a curva. |
