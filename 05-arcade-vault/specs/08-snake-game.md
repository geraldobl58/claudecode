# 08 — Snake Game (SNAKE)

- **Estado:** Implementado
- **Depende de:** SPEC 03, SPEC 04
- **Data:** 2026-09-09
- **Objetivo:** Criar do zero um Snake jogável na rota `/games/snake/play`, usando os sprites de frutas de `references/snake-assets/`, entrando no catálogo como `snake` e salvando pontuação no Supabase pelo mesmo caminho dos outros jogos.

## Por que esta spec existe

Esta é a primeira spec de jogo **sem protótipo**. As SPECs 04 (Asteroids), 06 (Tetris) e 07 (Arkanoid) portaram código que já existia em `started-games/`; aqui não existe `game.js` nenhum — só os assets em `references/snake-assets/` (`fruits.png`, 3790x442, e `sprites.js`, que mapeia 22 frutas de uma linha da folha). Toda a mecânica descrita abaixo foi **decidida com o usuário durante a geração desta spec**, não extraída de um protótipo: parede mata, cobra acelera a cada fruta, e as 22 frutas são sorteadas só por variedade visual (todas valem os mesmos pontos).

O que **não** muda é a arquitetura: motor de canvas em refs React com `requestAnimationFrame`, HUD real fora do canvas via `onStateChange`/`onGameOver`, `useImperativeHandle` com `pause`/`resume`/`end`/`restart`, `GameOverModal` reutilizado sem mudança, catálogo em `src/data/games.ts` e leaderboard via `scores`/`submitScore` da SPEC 03. O card `serpentine` removido pela SPEC 05 já reservava capa (`.cover-snake`, ainda presente em `globals.css`), cor e categoria para este jogo.

## Escopo

**Dentro:**

- `src/components/games/snake-game.tsx`: motor do jogo — grade lógica de **32x24 células**, cobra começando com **4 segmentos** no centro, movimento por _tick_ (não por frame), controle por `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown` com bloqueio de reversão de 180° (não é possível virar direto para cima da própria nuca).
- **Regras de partida**: comer fruta soma **10 pontos**, adiciona **1 segmento** e acelera o tick; encostar a cabeça em **qualquer parede** ou em **qualquer segmento do próprio corpo** encerra a partida (sem vidas).
- **Velocidade**: tick inicial de **140 ms**, multiplicado por **0,98** a cada fruta, com piso de **60 ms** — a partida acelera indefinidamente mas nunca fica injogável.
- **Frutas**: a cada spawn, sorteia uma célula vazia (nunca sobre a cobra) e **uma das 22 frutas** do atlas, apenas por variedade visual; todas valem os mesmos 10 pontos.
- `src/components/games/snake-sprites.ts`: porte TypeScript de `references/snake-assets/sprites.js` (que hoje é um script de browser que escreve em `window.SPRITE_ATLAS`), no mesmo formato de `arkanoid-sprites.ts` — mapa de recortes tipado, `loadFruitSheet(): Promise<HTMLImageElement>` e `drawFruit(ctx, sheet, name, x, y, w, h)`, apontando para `/games/snake/fruits.png`.
- `public/games/snake/fruits.png`: cópia do asset (o jogo só desenha depois do `onload`, como no Arkanoid).
- **Render da cobra**: desenhada com primitivas de canvas na cor de destaque do card (verde), com a cabeça visualmente distinta do corpo — o atlas só tem frutas, não tem sprite de cobra.
- Canvas dimensionado ao contêiner (`.crt-screen`) via `ResizeObserver`, com o tamanho da célula calculado por `floor(min(largura/32, altura/24))` e o canvas centralizado — mesmo padrão do port do Tetris, que também é baseado em grade. Como `32:24` é exatamente `4:3`, o canvas preenche o `.crt-screen` por inteiro (igual ao Arkanoid em `800x600`).
- **Fundo do tabuleiro**: preenchimento sólido + grade de linhas finas (mesmo padrão do `drawGrid` do Tetris) cobrindo as `32x24` células, para o jogador enxergar os limites da área jogável — sem isso, a área do jogo (transparente) coincide exatamente com o fundo preto do `.crt-screen`, deixando as paredes invisíveis até a cobra morrer nelas. Adicionado durante a implementação, a pedido do usuário.
- HUD (Score/Length) fora do canvas: o componente reporta `{score, length}` via `onStateChange` e chama `onGameOver(score)` uma única vez. **Sem** "Lives" e **sem** "Level" — este Snake não tem nenhum dos dois.
- `src/components/games/snake-play.tsx`: wrapper análogo a `arkanoid-play.tsx` — HUD real (Player/Score/Length), botões PAUSE/END/EXIT, `GameOverModal` condicional, "PLAY AGAIN" via remount (`key` incrementada).
- `src/app/games/[id]/play/page.tsx`: novo branch `if (game.id === "snake") return <SnakePlay gameId={game.id} />`.
- `src/data/games.ts`: nova entrada `snake` reaproveitando capa/cor/categoria do card `serpentine` removido pela SPEC 05 (`cat: "ARCADE"`, `cover: "cover-snake"`, `color: "green"`), com `id: "snake"` / `title: "SNAKE"`, `short: "Grow without biting your own tail."` (mantido do card antigo) e `long` adaptado para citar frutas em vez de "magenta cores", que não descreve mais o jogo.
- Seed de `public.games` no Supabase com a linha `('snake', 'SNAKE')`, mesma migration/abordagem da SPEC 03.

**Fora (para specs futuras ou já decidido não fazer):**

- Pontuação diferente por tipo de fruta e raridade no sorteio — decidido manter todas iguais; vira spec própria se quiserem profundidade.
- Modo _wrap_ (atravessar a parede e voltar do outro lado) — decidido que parede mata.
- Níveis discretos e HUD de "Level" — a aceleração é contínua, por fruta.
- Som — não existe nenhum asset de áudio para este jogo (diferente do Arkanoid, que trouxe os `.mp3` do protótipo).
- Obstáculos, power-ups, modo dois jogadores e controles touch/mobile.
- Otimizar/recortar `fruits.png` (585 KB para desenhar um sprite pequeno) — ver Riscos.

## Modelo de dados

Nenhum modelo novo no Supabase. Reaproveita `scores`/`getTopScores`/`submitScore` da SPEC 03, com `game_id = "snake"`.

`length` (tamanho da cobra) é estado de HUD em memória durante a partida e **não é persistido** — o schema `scores` continua sendo `game_id`/`player_name`/`score`, como nas SPECs 06 e 07.

## Plano de implementação

1. Copiar `references/snake-assets/fruits.png` para `public/games/snake/fruits.png`.
2. Criar `src/components/games/snake-sprites.ts`: portar o mapa de 22 frutas de `references/snake-assets/sprites.js` para um módulo TypeScript tipado (`FruitName`, `SpriteRect`), com `loadFruitSheet()` devolvendo `Promise<HTMLImageElement>` e `drawFruit(...)` — mesmo formato de `arkanoid-sprites.ts`.
3. Criar `src/components/games/snake-game.tsx`: estado em refs (cobra como array de células, direção atual, direção pendente, fruta atual, score, tick atual); um único loop `requestAnimationFrame` que acumula tempo e avança a cobra quando o acumulado atinge o tick corrente; listeners de teclado registrados e limpos em `useEffect`; `ResizeObserver` calculando o tamanho da célula; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart`; só desenha depois da folha de frutas carregar.
4. Criar `src/components/games/snake-play.tsx`: HUD real (Player/Score/Length), botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT; `GameOverModal` condicional ao estado `gameOver` — copiar a estrutura de `arkanoid-play.tsx` trocando o motor e as stats.
5. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `SnakePlay` quando `game.id === "snake"`.
6. Adicionar a entrada `snake` em `src/data/games.ts` (`GAMES`).
7. Aplicar migration de seed em `public.games` (`insert ... ('snake', 'SNAKE') on conflict do nothing`) via Supabase MCP.
8. Validar manualmente via Playwright MCP contra `/games/snake/play`: cobra anda sozinha, setas mudam a direção, reversão de 180° é bloqueada, comer fruta soma 10 e cresce, bater na parede e no próprio corpo encerra, `GameOverModal` salva no Supabase.

## Critérios de aceite

- [ ] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [ ] `/games/snake/play` renderiza a grade 32x24 com a cobra de 4 segmentos e uma fruta visível, desenhada a partir de `fruits.png`.
- [ ] A cobra avança sozinha no tick, sem nenhuma tecla pressionada.
- [ ] As quatro setas mudam a direção; pressionar a direção oposta à atual **não** inverte a cobra sobre si mesma.
- [ ] Comer uma fruta soma exatamente 10 pontos, aumenta `Length` em 1 e faz nascer uma nova fruta em célula vazia (nunca sobre a cobra).
- [ ] Frutas diferentes aparecem ao longo da partida (sorteio entre as 22 do atlas), todas valendo os mesmos 10 pontos.
- [ ] O intervalo entre passos diminui a cada fruta (140 ms iniciais × 0,98 por fruta) e nunca fica abaixo de 60 ms.
- [ ] Bater em qualquer uma das quatro paredes encerra a partida imediatamente.
- [ ] Encostar a cabeça em um segmento do próprio corpo encerra a partida imediatamente.
- [ ] HUD (Score/Length) reflete o estado real do jogo em tempo real, sem stats de vidas ou nível.
- [ ] Botão PAUSE congela a cobra e vira RESUME; botão END força o game over imediatamente.
- [ ] Ao terminar, `GameOverModal` mostra a pontuação final real e salva em `scores` com `game_id = "snake"`.
- [ ] "PLAY AGAIN" reinicia do zero (score 0, 4 segmentos, tick 140 ms) sem recarregar a página.
- [ ] `snake` aparece na Home, na Library (`/games`) e no Hall of Fame, com pontuações reais assim que houver partidas salvas.

## Decisões

- **Sim:** reaproveitar o padrão de port das SPECs 04/06/07 (refs + `requestAnimationFrame`, `useImperativeHandle`, HUD fora do canvas, `GameOverModal` sem mudança), mesmo este jogo não sendo um port. É o que mantém os quatro jogos com o mesmo contrato.
- **Sim:** `snake`/`SNAKE` como id/título, não `serpentine`/`SERPENTINE` do card mockado — mesmo critério já aplicado ao Tetris (SPEC 06) e ao Arkanoid (SPEC 07). Capa, cor e categoria do card antigo são reaproveitadas; o `long` é adaptado porque falava em "magenta cores", e o jogo come frutas.
- **Sim:** parede mata (sem _wrap_) e aceleração contínua por fruta, em vez de níveis discretos — escolha explícita do usuário na geração desta spec.
- **Sim:** 22 frutas sorteadas só por variedade visual, todas valendo 10 pontos — escolha explícita do usuário. Mantém a regra de pontuação trivial de verificar e usa o atlas inteiro.
- **Sim:** um único loop `requestAnimationFrame` com acumulador de tempo para o tick, em vez do par `setInterval` + RAF usado no Tetris. Motivo: aquele par existia para ser fiel ao protótipo do Tetris; aqui não há protótipo, e o acumulador deixa o jogo independente de taxa de quadros (os ports de Tetris e Arkanoid herdaram física por frame, que roda mais rápido em telas de 120 Hz).
- **Sim:** cobra desenhada com primitivas de canvas — o atlas de `references/snake-assets/` só tem frutas.
- **Não:** estender o schema `scores` para guardar `length`. Consistente com as SPECs 06 e 07; `length` fica só no HUD.
- **Não:** som. Não há asset de áudio para este jogo.

## Riscos

| Risco                                                                                                                 | Mitigação                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.games` ainda não tem a linha `snake` — `submitScore` falha com violação de FK até a migration de seed rodar   | Passo 7 do plano; mesmo padrão já resolvido para `rocks` (SPEC 03), `tetris` (SPEC 06) e `arkanoid` (SPEC 07).                                                                                            |
| Mecânica sem protótipo de referência: não há um "original" para comparar o resultado e decidir se o _feel_ está certo | Os critérios de aceite acima são a fonte da verdade (valores concretos de tick, pontuação, tamanho da grade); qualquer ajuste de _feel_ depois vira revisão desta spec, não mudança silenciosa no código. |
| `fruits.png` tem 585 KB e 3790x442 px para desenhar um sprite de ~1 célula — peso desnecessário no bundle estático    | Aceito nesta spec (é o asset que existe, e é servido estaticamente, fora do JS). Recortar só a linha usada (`y=136..296`) é otimização para uma spec futura.                                              |
| Aceleração contínua sem piso deixaria o jogo injogável e impossível de testar                                         | Piso explícito de 60 ms por tick, verificado nos critérios de aceite.                                                                                                                                     |
| Sorteio de fruta em célula ocupada faria a fruta nascer "dentro" da cobra                                             | O sorteio é sobre a lista de células vazias, não sobre a grade inteira — critério de aceite explícito.                                                                                                    |
