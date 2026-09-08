# 04 — Asteroids Game (ROCKS)

- **Estado:** Implementado
- **Depende de:** SPEC 03
- **Data:** 2026-09-08
- **Objetivo:** Portar o protótipo standalone `started-games/asteroids/` para um componente React jogável dentro da rota `/games/rocks/play`, substituindo a arena decorativa mockada por gameplay real.

## Por que esta spec existe

`started-games/asteroids/` é um jogo funcional em HTML/Canvas/JS puro, sem framework, feito fora do app Next.js. O card "ROCKS" (`Pulverize asteroids in zero gravity`) já existia em `src/data/games.ts` como o slot temático para esse jogo. Esta spec documenta a adaptação do motor do protótipo (estado em `let` de módulo, `window` listeners, HUD desenhado no canvas) para um componente React idiomático (estado em refs, listeners com cleanup em `useEffect`, HUD real em JSX) — documentada retroativamente junto com a SPEC 03, no mesmo commit direto em `main`.

## Escopo

**Dentro:**

- `src/components/games/asteroids-game.tsx`: motor do jogo portado de `started-games/asteroids/game.js` — nave, tiros, asteroides, wrap de tela, divisão de asteroides (`large → medium(x2) → small(x2)`), ondas, vidas, invulnerabilidade pós-respawn — mesmas constantes de física do protótipo.
- Canvas dimensionado ao contêiner (`.crt-screen`, `aspect-ratio: 4/3`) via `ResizeObserver`, em vez de `window.innerWidth/innerHeight` do protótipo original (que assumia página cheia).
- HUD (Score/Lives/Level) e tela de "GAME OVER" **não** são mais desenhados no canvas — o componente reporta `{score, lives, wave}` via `onStateChange` e chama `onGameOver(score)` uma única vez; a UI real (`.player-hud`, `GameOverModal`) já existente no app consome esses dados.
- `src/components/games/rocks-play.tsx`: wrapper client component que monta `AsteroidsGame`, liga o HUD real, os botões PAUSE/END/EXIT já existentes na página, e mostra `GameOverModal` só quando o jogo termina — com "PLAY AGAIN" reiniciando via remount (`key` incrementada) em vez de depender de navegação para a mesma URL.
- `src/app/games/[id]/play/page.tsx`: renderiza `RocksPlay` quando `id === "rocks"`; qualquer outro `id` continua com o placeholder estático anterior (hoje inatingível — ver SPEC 05, catálogo reduzido a só ROCKS).
- `src/components/game-over-modal.tsx`: passa a receber `finalScore` (prop obrigatória, sem mais `DEMO_FINAL_SCORE` fixo), pré-preenche o nome com `useAuth().user?.name`, e chama `submitScore` (SPEC 03) ao salvar.

**Fora (para specs futuros):**

- Arkanoid e Tetris (`started-games/arkanoid/`, `started-games/tetris/`) — mesma abordagem de port será reaplicada quando entrarem em escopo.
- Controles touch/mobile — só teclado (`ArrowLeft/Right/Up`, `Space`), como no protótipo original.
- Som/música.
- Placar de UFOs mencionado no texto de flavor do card ("Watch out for UFOs on the horizon") — não existe no protótipo original nem foi adicionado aqui.

## Modelo de dados

Nenhum modelo novo. Reaproveita `submitScore`/`getTopScores` da SPEC 03.

## Plano de implementação

1. Criar `src/components/games/asteroids-game.tsx`: portar entidades/física/constantes de `started-games/asteroids/game.js` para refs de componente; loop `requestAnimationFrame` e listeners de teclado registrados/limpos em `useEffect`; `useImperativeHandle` expondo `pause`/`resume`/`end`/`restart` para o wrapper controlar o jogo a partir dos botões do HUD.
2. Criar `src/components/games/rocks-play.tsx`: HUD real (Player/Score/Lives/Level), botões PAUSE (chama `pause`/`resume`), END (chama `end`), EXIT (link existente); `GameOverModal` condicional ao estado `gameOver`.
3. Atualizar `src/app/games/[id]/play/page.tsx` para renderizar `RocksPlay` quando `game.id === "rocks"`.
4. Atualizar `src/components/game-over-modal.tsx`: prop `finalScore`, prop opcional `onPlayAgain` (usada pelo `rocks-play.tsx` para reiniciar sem depender de navegação Link-para-mesma-URL), estados `idle/saving/saved/error` ao chamar `submitScore`.
5. Texto em inglês em toda a UI portada (HUD, Game Over) — o protótipo original usa PT-BR (`index.html` com `lang="pt-BR"`), mas essa regra é do protótipo standalone, não do app Next.js (que é 100% inglês por convenção do projeto, ver `CLAUDE.md`).

## Critérios de aceite

- [x] `npm run build`/`npm run lint`/`tsc --noEmit` sem erros novos.
- [x] `/games/rocks/play` renderiza um canvas jogável: nave rotaciona (setas), acelera (seta cima), atira (espaço), sofre wraparound nas bordas do `.crt-screen`.
- [x] Colisão nave-asteroide reduz vidas e respawna a nave (com invulnerabilidade temporária); ao zerar vidas, o jogo termina.
- [x] Atirar em um asteroide grande o divide em 2 médios, médio em 2 pequenos, pequeno o destrói — pontuação soma conforme o tamanho.
- [x] HUD (Score/Lives/Level) reflete o estado real do jogo em tempo real, não valores fixos.
- [x] Botão PAUSE congela o jogo e vira RESUME; botão END força o game over imediatamente.
- [x] Ao terminar, `GameOverModal` mostra a pontuação final real (não mais `15780` fixo) e permite salvar com um nome.
- [x] "PLAY AGAIN" reinicia o jogo do zero (score 0, 3 vidas, onda 1) sem recarregar a página.

Verificado manualmente via Playwright MCP nesta sessão (navegação, teclado, screenshots) contra `http://localhost:3000/games/rocks/play`.

## Decisões

- **Sim:** estado do jogo em `useRef`, não `useState`, para o loop de 60fps não re-renderizar React a cada frame — só `onStateChange`/`onGameOver` cruzam para o mundo React, e só quando o valor reportado muda.
- **Sim:** `ResizeObserver` no contêiner em vez de `window.innerWidth/innerHeight`. O jogo agora vive dentro de um frame de CRT decorativo, não ocupa a tela inteira.
- **Sim:** HUD/game-over desenhados no canvas do protótipo foram removidos — o app já tinha essa UI em JSX/CSS, duplicar seria redundante e inconsistente visualmente.
- **Sim:** "PLAY AGAIN" virou um `<button onClick>` com remount por `key`, não mais um `<Link>` para a mesma URL — um `Link` para a rota atual não força reinício de estado no App Router.
- **Não:** preservar o texto em PT-BR do protótipo — o app é 100% inglês por convenção já estabelecida no `CLAUDE.md` do `05-arcade-vault`.

## Riscos

| Risco | Mitigação |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Tecla `Space` (atirar) também ativa botões HTML focados na página (comportamento padrão do browser para `<button>`) | `CONTROL_KEYS` já chama `preventDefault()` no `keydown` para `Space`/setas, o que bloqueia a ação padrão do elemento focado; não observado em testes controlados, mas vale reteste se o layout da página `/play` ganhar mais elementos focáveis. |
| Resize a meio de partida não re-escala posições de entidades já existentes (mesma limitação do protótipo original) | Aceito como está — mesmo comportamento do jogo de referência; não é regressão introduzida por esta spec. |
