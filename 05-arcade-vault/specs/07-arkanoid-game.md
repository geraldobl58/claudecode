# 07 — Arkanoid Game (ARKANOID)

- **Estado:** Aprovado
- **Depende de:** SPEC 03, SPEC 04
- **Data:** 2026-09-08
- **Objetivo:** Portar o protótipo standalone `started-games/arkanoid/` para um componente React jogável dentro da rota `/games/arkanoid/play`, com sprite sheet, animação de explosão e som do original, entrando no catálogo como `arkanoid` e salvando pontuação no Supabase.

## Por que esta spec existe

`started-games/arkanoid/` é um Arkanoid/Breakout funcional em HTML/Canvas/JS puro, e é o protótipo mais completo dos três: além da física de rebote com ângulo variável, ele tem uma **sprite sheet** (`assets/spritesheet-breakout.png`) que desenha 100% do jogo, **animação de explosão** de 4 frames por bloco destruído e **efeitos sonoros com três níveis de volume** — cada um desses documentado em uma spec própria dentro do protótipo (`specs/01-mvp-arkanoid.md`, `02-block-explosion-animation.md`, `03-niveis-de-som.md`).

Isso muda o padrão de port em dois pontos em relação às SPECs 04 (Asteroids) e 06 (Tetris), que renderizavam com primitivas de canvas e não tinham áudio: aqui o port **traz os assets** (imagem + som), porque sem eles o jogo simplesmente não se parece com o original. Decisão tomada explicitamente com o usuário (ver Decisões) — inclusive porque no port do Tetris a ausência da animação do protótipo foi sentida como perda.

O restante segue o molde da SPEC 04: motor em refs React com `requestAnimationFrame`, HUD real fora do canvas via callbacks, `GameOverModal` reutilizado sem mudança, catálogo e leaderboard via SPEC 03.

## Escopo

**Dentro:**

- `src/components/games/arkanoid-game.tsx`: motor portado de `started-games/arkanoid/game.js` — raquete (`x:320, y:560, 162x14, speed 8`) movida por `ArrowLeft`/`ArrowRight` e presa às bordas; bola (`radius 8, speed 5`) que começa **grudada** na raquete (`attached`) e é lançada com `Space` (`dx = speed*0.6`, `dy = -speed*0.8`); rebote nas paredes/teto; rebote na raquete com ângulo proporcional ao ponto de contato (`relativeX` clampado × `MAX_BOUNCE_ANGLE = 75°`, `dx = speed·sin(a)`, `dy = -speed·cos(a)`); grade de 7 linhas × 10 colunas de blocos `32x16` com gap 4 a partir de `y = 60`, centralizada; pontuação por cor de linha (`gray 10`, `cyan 20`, `green 30`, `yellow 40`, `magenta 50`, `red 60`, `hotpink 70`); 3 vidas, bola perdida volta a ficar grudada na raquete.
- **Sprite sheet portada**: `assets/spritesheet-breakout.png` copiada para `public/games/arkanoid/spritesheet-breakout.png`, e os helpers de `assets/spritesheet.js` (`SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`, `drawSprite`, `drawFrame`) portados para TypeScript dentro de `src/components/games/arkanoid-sprites.ts`, com carregamento da imagem em `useEffect` (o jogo só começa a desenhar depois do `onload`).
- **Animação de explosão**: ao destruir um bloco, empilha uma explosão (`{x, y, width, height, color, startTime}`) desenhada com `drawFrame` em 4 frames ao longo de `EXPLOSION_DURATION = 150ms`, na cor do bloco, e limpa da lista quando expira — igual à `spec 02` do protótipo, sem bloquear a física.
- **Som**: `ball-bounce.mp3` (parede e raquete) e `break-sound.mp3` (bloco) copiados para `public/games/arkanoid/`, tocados com o mesmo `playSound` (reinicia `currentTime`, ignora rejeição do `play()`).
- **Níveis de som**: `off`/`medium`/`high` (volumes `0`/`0.5`/`1.0`), default `high`, ciclados pela tecla `M` na mesma ordem do protótipo (índice decrescente) e persistidos em `localStorage` na chave `arkanoid-sound-level`. O nível atual aparece no HUD real (em inglês: `OFF`/`MED`/`HIGH`), não desenhado no canvas.
- Canvas dimensionado ao contêiner (`.crt-screen`) via `ResizeObserver`, mas mantendo o sistema de coordenadas `800x600` do protótipo e aplicando escala uniforme no contexto (`ctx.setTransform(scale, 0, 0, scale, 0, 0)`) — `800x600` é exatamente `4:3`, a mesma proporção do `.crt-screen`, então nada de física precisa ser retunado.
- HUD (Score/Lives/Sound) e telas de início/pausa/fim **não** desenhados no canvas — o componente reporta `{score, lives, soundLevel}` via `onStateChange` e chama `onGameOver(score)` uma única vez; **sem** stat "Level" (o protótipo tem uma única grade, não tem níveis nem ondas).
- **Vitória**: destruir todos os 70 blocos encerra a partida e abre o mesmo `GameOverModal` com a pontuação final (o modal continua genérico, sem mudança).
- `src/components/games/arkanoid-play.tsx`: wrapper client component análogo a `rocks-play.tsx`/`tetris-play.tsx` — HUD real (Player/Score/Lives/Sound), botões PAUSE/END/EXIT, `GameOverModal` condicional, "PLAY AGAIN" via remount (`key` incrementada).
- `src/app/games/[id]/play/page.tsx`: novo branch `if (game.id === "arkanoid") return <ArkanoidPlay gameId={game.id} />`.
- `src/data/games.ts`: nova entrada `arkanoid` reaproveitando a copy/capa/cor do card `block-buster` removido pela SPEC 05 (`short: "Bounce the ball and smash neon walls."`, `long`, `cat: "ARCADE"`, `cover: "cover-bricks"`, `color: "cyan"`), com `id: "arkanoid"` / `title: "ARKANOID"`.
- Seed de `public.games` no Supabase com a linha `('arkanoid', 'ARKANOID')`, mesma migration/abordagem da SPEC 03.

**Fora (para specs futuras ou já decidido não fazer):**

- Recorde local do protótipo (`arkanoid-highscore` em `localStorage`) — o app já tem leaderboard real via Supabase (SPEC 03/05); manter os dois seria redundante, mesma decisão do port do Tetris.
- Telas de início ("Pressione ESPAÇO para começar") e de fim ("GAME OVER"/"VITÓRIA!") desenhadas no canvas — o app já tem o `GameOverModal` e monta o jogo direto; a partida começa com a bola grudada esperando o `Space`.
- Overlay de "PAUSADO" desenhado no canvas e as teclas `P`/`Escape` de pausa — pausa continua sendo o botão PAUSE do HUD, como nos outros dois ports.
- Regeneração da grade após a vitória (modo endless) — a vitória encerra a partida, fiel ao protótipo.
- Power-ups, múltiplas fases/layouts de grade, controles touch/mobile.

## Modelo de dados

Nenhum modelo novo no Supabase. Reaproveita `scores`/`getTopScores`/`submitScore` da SPEC 03, com `game_id = "arkanoid"`.

Única persistência local nova: a preferência de volume (`localStorage`, chave `arkanoid-sound-level`, valores `off`/`medium`/`high`). É preferência de UI por navegador, não dado de jogo — não conflita com a decisão de não portar o recorde local, que era sobre pontuação.

## Plano de implementação

1. Copiar os assets do protótipo para `public/games/arkanoid/`: `spritesheet-breakout.png`, `ball-bounce.mp3`, `break-sound.mp3`.
2. Criar `src/components/games/arkanoid-sprites.ts`: portar `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`, `drawSprite` e `drawFrame` de `started-games/arkanoid/assets/spritesheet.js` para TypeScript, apontando para `/games/arkanoid/spritesheet-breakout.png`, com um carregador de imagem que resolve uma `Promise` no `onload`.
3. Criar `src/components/games/arkanoid-game.tsx`: portar `createBlocks`/física/colisões/`checkBallLost`/`checkWinCondition` para refs de componente; loop `requestAnimationFrame` e listeners de teclado (`ArrowLeft`/`ArrowRight`/`Space`/`KeyM`) registrados e limpos em `useEffect`; escala do contexto para o contêiner via `ResizeObserver`; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart`, mesmo contrato de `AsteroidsGameHandle`/`TetrisGameHandle`; só desenha depois da sprite sheet carregar.
4. Adicionar som: instanciar os dois `Audio` uma vez em ref, `playSound` respeitando o nível atual, tecla `M` ciclando o nível e persistindo em `localStorage` (com `try/catch`, como no protótipo).
5. Criar `src/components/games/arkanoid-play.tsx`: HUD real (Player/Score/Lives em corações/Sound), botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT; `GameOverModal` condicional ao estado `gameOver` — copiar a estrutura de `tetris-play.tsx` trocando o motor e as stats.
6. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `ArkanoidPlay` quando `game.id === "arkanoid"`.
7. Adicionar a entrada `arkanoid` em `src/data/games.ts` (`GAMES`), com a copy/capa/cor do antigo `block-buster`.
8. Aplicar migration de seed em `public.games` (`insert ... ('arkanoid', 'ARKANOID') on conflict do nothing`) via Supabase MCP.
9. Validar manualmente via Playwright MCP contra `/games/arkanoid/play`: raquete responde às setas, `Space` lança a bola, bola rebate em parede/raquete/blocos, bloco destruído soma os pontos da cor e dispara a explosão, bola perdida tira vida, 0 vidas encerra o jogo, `GameOverModal` salva no Supabase.

## Critérios de aceite

- [ ] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [ ] `/games/arkanoid/play` renderiza a grade de 70 blocos, a raquete e a bola **usando a sprite sheet** (não retângulos genéricos).
- [ ] A bola começa grudada na raquete e só sai depois de `Space`; acompanha a raquete horizontalmente enquanto está grudada.
- [ ] Raquete move com as setas e não sai das bordas do canvas.
- [ ] Bola rebate em parede lateral, teto e raquete; o ângulo de saída na raquete varia com o ponto de contato (bater na ponta manda a bola mais para o lado do que bater no centro).
- [ ] Destruir um bloco soma exatamente os pontos da cor dele (`gray 10` … `hotpink 70`) e dispara a animação de explosão de 4 frames na posição do bloco.
- [ ] Perder a bola pelo fundo reduz uma vida e devolve a bola grudada na raquete; ao zerar as 3 vidas o jogo termina.
- [ ] Destruir todos os 70 blocos encerra a partida (vitória) e abre o `GameOverModal` com a pontuação final.
- [ ] HUD (Score/Lives/Sound) reflete o estado real do jogo em tempo real.
- [ ] Tecla `M` cicla o volume entre `HIGH`/`MED`/`OFF`, o HUD mostra o nível atual e a escolha sobrevive a um reload da página.
- [ ] Botão PAUSE congela bola/raquete e vira RESUME; botão END força o game over imediatamente.
- [ ] Ao terminar, `GameOverModal` mostra a pontuação final real e salva em `scores` com `game_id = "arkanoid"`.
- [ ] "PLAY AGAIN" reinicia do zero (score 0, 3 vidas, grade completa, bola grudada) sem recarregar a página.
- [ ] `arkanoid` aparece na Home, na Library (`/games`) e no Hall of Fame, com pontuações reais assim que houver partidas salvas.

## Decisões

- **Sim:** reaproveitar o padrão de port da SPEC 04/06 (refs + `requestAnimationFrame`, `useImperativeHandle`, HUD fora do canvas, `GameOverModal` sem mudança), incluindo a convenção de nomes — motor com o nome do protótipo (`arkanoid-game.tsx`), wrapper com o id do catálogo (`arkanoid-play.tsx`). Aqui os dois coincidem porque o id do catálogo é o próprio nome do protótipo; não é engano.
- **Sim:** `arkanoid`/`ARKANOID` como id/título, não `block-buster`/`BLOCK BUSTER` do card mockado. Mesmo critério aplicado ao Tetris na SPEC 06: nome fictício de catálogo não faz sentido quando existe um jogo real por trás. A copy/capa/cor do card antigo são reaproveitadas — descrevem bem o jogo e o CSS `.cover-bricks` já existe em `globals.css`.
- **Sim:** portar a sprite sheet. É o único jeito de o port se parecer com o protótipo (100% do render dele é `drawSprite`), e é pré-requisito da animação de explosão, que usa `EXPLOSION_FRAMES` da mesma folha. Diverge conscientemente dos ports de Asteroids/Tetris, que não tinham assets para portar.
- **Sim:** portar a animação de explosão dos blocos. Tem spec própria no protótipo (`02-block-explosion-animation.md`, Finalizado) e é o tipo de perda que foi sentida no port do Tetris.
- **Sim:** portar som e os três níveis de volume com a tecla `M`. Primeiro jogo do app com áudio; o indicador de nível sai do canvas e vira stat do HUD, em inglês (`OFF`/`MED`/`HIGH`), seguindo a regra de UI 100% em inglês do `CLAUDE.md`.
- **Sim:** manter o sistema de coordenadas `800x600` do protótipo e escalar o contexto, em vez de recalcular a física para o tamanho do contêiner. `800x600` é `4:3`, exatamente a proporção do `.crt-screen` — escala uniforme sem distorção e sem retunar velocidade de bola/raquete.
- **Sim:** vitória encerra a partida e abre o `GameOverModal` com a pontuação final, em vez de regenerar a grade (modo endless). Fiel ao protótipo, que tem a tela "VITÓRIA!" como fim de jogo.
- **Não:** portar o recorde local (`arkanoid-highscore`), as telas de start/fim desenhadas no canvas, o overlay de pausa e as teclas `P`/`Escape` — o app já tem HUD, modal e botão PAUSE próprios.
- **Não:** estender o schema `scores`. Este jogo não produz nenhum dado além de `score`; a preferência de volume fica em `localStorage`, não no banco.

## Riscos

| Risco                                                                                                                                    | Mitigação                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.games` ainda não tem a linha `arkanoid` — `submitScore` falha com violação de FK até a migration de seed rodar                   | Passo 8 do plano; mesmo padrão já resolvido para `rocks` (SPEC 03) e `tetris` (SPEC 06).                                                                                                                  |
| Autoplay policy do browser bloqueia áudio antes de qualquer interação do usuário                                                         | O primeiro som só pode tocar depois de a bola ser lançada com `Space`, ou seja, sempre há interação antes; ainda assim `playSound` ignora a rejeição do `play()` (`.catch(() => {})`), como no protótipo. |
| Sprite sheet ainda não carregada no primeiro frame → `drawImage` com imagem incompleta desenha nada ou lança                             | O loop só desenha depois do `onload` da imagem (passo 3); antes disso o canvas fica limpo.                                                                                                                |
| Física em coordenadas fixas (`800x600`) com canvas escalado pode desalinhar colisão e desenho se a escala for aplicada em só um dos dois | Aplicar a escala uma única vez no contexto (`setTransform`) e manter **toda** a lógica (colisão, posições, limites) em coordenadas `800x600`, sem converter nada manualmente.                             |
| Fórmula de rebote na raquete (`relativeX` × `MAX_BOUNCE_ANGLE`) é o que dá o "feel" do jogo e é fácil de portar errado                   | Copiar `checkPaddleCollision` literalmente de `started-games/arkanoid/game.js:314-333`, sem reimplementar; comparar lado a lado com o protótipo aberto no browser antes de fechar o port.                 |
| Teclas `Space` e setas ativarem foco/scroll de elementos HTML da página, como já identificado na SPEC 04                                 | Reaproveitar o mesmo `preventDefault()` em `keydown` para as teclas de controle, já usado nos dois ports anteriores.                                                                                      |
