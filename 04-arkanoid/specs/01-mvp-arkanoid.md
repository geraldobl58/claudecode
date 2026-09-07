# SPEC 01 — MVP do Arkanoid jogável

> **Status:** Aprovado
> **Date:** 2026-09-07
> **Objective:** Implementar um MVP jogável do Arkanoid em HTML/Canvas/JavaScript puro, com um nível fixo de blocos, raquete controlada por teclado, física de rebote com ângulo variável, pontuação por cor de bloco, 3 vidas, telas de início/pausa/fim, efeitos sonoros com opção de mudo, e recorde salvo em localStorage.

---

## Scope

**In:**

- Canvas fixo 800x600 renderizado em `index.html`, com lógica em `game.js` e estilos em `style.css`, todos na raiz do repositório, sem bundler/build step.
- Reutilização de `assets/spritesheet.js` (`loadSpritesheet`, `drawSprite`, `drawFrame`) e `assets/spritesheet-breakout.png` para desenhar raquete, bola e blocos.
- Um único nível fixo com grade de blocos 7 fileiras x 10 colunas (70 blocos), uma cor por fileira, usando as 7 cores do sprite sheet (`gray`, `cyan`, `green`, `yellow`, `magenta`, `red`, `hotpink`).
- Pontuação variável por cor de bloco: `gray`=10, `cyan`=20, `green`=30, `yellow`=40, `magenta`=50, `red`=60, `hotpink`=70.
- Raquete controlada pelo teclado (setas ← →), movendo-se horizontalmente dentro dos limites do canvas.
- Bola com velocidade constante; inicia presa à raquete e é lançada com a tecla Espaço; após perder uma vida, volta a ficar presa à raquete.
- Física de colisão: ângulo de rebote variável conforme o ponto de impacto na raquete; rebote simples (espelhado) nas paredes e no teto.
- Sistema de 3 vidas; a bola caindo abaixo da raquete decrementa uma vida.
- Estados do jogo: tela inicial (título + recorde + "pressione Espaço para começar"), jogo em andamento, pausa (tecla P ou Esc), tela de fim (Game Over ao zerar vidas, ou Vitória ao quebrar todos os blocos) com pontuação final e reinício via Espaço/Enter.
- HUD durante a partida mostrando pontuação atual e vidas restantes.
- Efeitos sonoros: `ball-bounce.mp3` ao rebater em parede/raquete, `break-sound.mp3` ao quebrar um bloco; botão/tecla de mudo que silencia ambos.
- Recorde (high score) persistido em `localStorage`, exibido nas telas inicial e de fim.

**Out of scope (for future specs):**

- Múltiplos níveis ou progressão de nível.
- Power-ups (bola múltipla, raquete maior/menor, etc.).
- Controles por mouse ou touch/mobile.
- Aumento de velocidade da bola ao longo da partida.
- Multiplayer.
- Canvas responsivo/redimensionável.
- Qualquer bundler, framework ou TypeScript.
- Configuração de volume além do mudo (ex: slider de volume).

---

## Data model

```js
// Estado do jogo (em memória; só highScore é persistido)
const state = {
  screen: "start", // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  highScore: 0, // carregado de localStorage ao iniciar
  muted: false,
  paddle: { x: 320, y: 560, width: 162, height: 14, speed: 8 },
  ball: {
    x: 401,
    y: 546,
    radius: 8,
    dx: 0,
    dy: 0, // 0,0 enquanto presa à raquete
    speed: 5,
    attached: true,
  },
  blocks: [
    // 70 elementos: 7 fileiras x 10 colunas
    // { x, y, width: 32, height: 16, color: 'red', points: 60, alive: true }
  ],
};
```

Convenções:

- Origem das coordenadas: canto superior esquerdo do canvas.
- Velocidades em pixels por frame (`requestAnimationFrame`).
- `color` de cada bloco corresponde às chaves de `SPRITES.blocks` em `assets/spritesheet.js` (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
- Chave do `localStorage`: `arkanoid-highscore`, valor numérico serializado como string.

---

## Implementation plan

1. Criar `index.html` com `<canvas id="game" width="800" height="600">`, carregando `assets/spritesheet.js` e `game.js` (nessa ordem) e `style.css`. `game.js` chama `loadSpritesheet` e, no callback, desenha uma cena estática: grade de 70 blocos (7x10, uma cor por fileira), raquete e bola nas posições iniciais. Teste manual: abrir `index.html` no navegador e ver a cena estática sem erros no console.
2. Implementar o loop de renderização (`requestAnimationFrame`) e o movimento da raquete com as setas ← →, respeitando os limites do canvas. Teste manual: segurar ← e → move a raquete sem sair da tela.
3. Implementar a física da bola: presa à raquete no início, lançamento com Espaço, movimento com velocidade constante, rebote simples nas paredes/teto, rebote com ângulo variável na raquete, e perda de vida (bola cai abaixo da raquete) que reseta a bola presa à raquete. Teste manual: lançar a bola, vê-la rebater em paredes e raquete; deixá-la cair reduz vidas e ela volta a ficar presa.
4. Implementar colisão bola-bloco: ao colidir, remover o bloco (`alive = false`), somar os pontos da cor ao score, e reproduzir `break-sound.mp3`. Detectar condição de vitória (todos os blocos com `alive: false`). Teste manual: quebrar um bloco aumenta o score pela pontuação correta da cor; quebrar todos os blocos aciona a tela de vitória.
5. Implementar o HUD (score e vidas) e as telas de início, Game Over e Vitória, incluindo reinício com Espaço/Enter a partir das telas de fim. Teste manual: fluxo completo tela inicial → jogo → Game Over (perdendo todas as vidas) e tela inicial → jogo → Vitória (quebrando todos os blocos), com reinício funcional em ambos os casos.
6. Implementar pausa (tecla P ou Esc) com overlay "Pausado" que congela o loop de atualização. Teste manual: pausar durante o jogo congela bola e raquete; despausar retoma exatamente de onde parou.
7. Integrar `ball-bounce.mp3` (rebote em parede/raquete) e adicionar botão/tecla de mudo que silencia os dois efeitos sonoros. Teste manual: os sons tocam nos eventos corretos; ativar o mudo silencia ambos.
8. Persistir e carregar o recorde via `localStorage` (`arkanoid-highscore`), atualizando-o ao final da partida (Game Over ou Vitória) quando o score superar o valor salvo, e exibindo-o nas telas inicial e de fim. Teste manual: bater um recorde, recarregar a página, ver o novo recorde na tela inicial.

---

## Acceptance criteria

- [ ] Abrir `index.html` no navegador renderiza um canvas 800x600 com a tela inicial mostrando título e recorde (0 se ainda não houver nenhum).
- [ ] Pressionar Espaço na tela inicial começa o jogo; a grade de 70 blocos (7 fileiras x 10 colunas) é desenhada com a cor correta por fileira.
- [ ] As setas ← e → movem a raquete horizontalmente sem sair dos limites do canvas.
- [ ] A bola começa presa à raquete; Espaço a lança em uma direção inicial fixa.
- [ ] A bola rebate nas paredes esquerda/direita, no teto e na raquete; o ângulo de rebote na raquete varia conforme o ponto de impacto.
- [ ] A colisão da bola com um bloco remove o bloco, soma o valor de pontos daquela cor ao placar, e reproduz `break-sound.mp3`.
- [ ] O rebote da bola em parede ou raquete reproduz `ball-bounce.mp3`.
- [ ] O HUD mostra a pontuação atual e as vidas restantes durante a partida.
- [ ] A bola caindo abaixo da raquete decrementa uma vida e volta a ficar presa à raquete (ou encerra o jogo se as vidas chegarem a zero).
- [ ] Vidas chegando a zero mostra a tela de Game Over com a pontuação final, atualizando o recorde em `localStorage` se ele for superado.
- [ ] Quebrar todos os 70 blocos mostra a tela de Vitória com a pontuação final, atualizando o recorde em `localStorage` se ele for superado.
- [ ] Pressionar P ou Esc durante a partida alterna um overlay "Pausado" que congela o loop do jogo.
- [ ] Um botão/tecla de mudo silencia todos os efeitos sonoros quando ativado.
- [ ] Recarregar a página após jogar mostra o recorde salvo anteriormente na tela inicial.
- [ ] Pressionar Espaço/Enter na tela de Game Over ou Vitória reinicia o jogo a partir da tela inicial (ou diretamente para uma nova partida).

---

## Decisions

- **Sim:** nível único fixo em vez de múltiplos níveis ou geração procedural. Escopo de MVP, valida o loop principal mais rápido.
- **Não:** múltiplos níveis / progressão. Fica para uma spec futura.
- **Não:** geração procedural de layout. Complexidade desnecessária para o MVP.
- **Sim:** controles só por teclado (setas), sem mouse/touch. Implementação mais simples, sem precisar mapear coordenadas do mouse no canvas.
- **Sim:** pontuação variável por cor de bloco em vez de pontuação fixa. Dá propósito às 7 cores do sprite sheet e recompensa alcançar as fileiras mais difíceis.
- **Sim:** `localStorage` para o recorde. Cabe em poucos bytes, não precisa de queries, alinhado com a recomendação do `CLAUDE.md` de preferir a ferramenta mais simples.
- **Sim:** rebote com ângulo variável na raquete (clássico de Arkanoid) em vez de reflexão simples espelhada. É o principal fator de "diversão" tática do jogo.
- **Sim:** arquivos separados (`index.html` + `game.js` + `style.css`) em vez de um único HTML monolítico. Zero build tooling, mas mantém a lógica organizada à medida que o jogo cresce.
- **Não:** bundler, framework ou TypeScript. Repositório ainda não tem nenhum desses; `CLAUDE.md` instrui a não assumir convenções e preferir HTML/canvas/JS puro.
- **Não:** power-ups, múltiplos níveis, controles touch/mobile e aumento de velocidade da bola. Cada um implica decisões próprias de dados/UX; ficam para specs futuras.

---

## Risks

| Risco                                                                  | Mitigação                                                                                                                                   |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Bola "atravessando" blocos/raquete em frames longos (tunneling)        | Usar detecção de colisão por posição discreta a cada frame; velocidade da bola mantida baixa/constante o suficiente para o MVP.             |
| Políticas de autoplay do navegador bloqueando áudio antes de interação | Sons só tocam após o jogador pressionar Espaço na tela inicial, que já conta como gesto do usuário.                                         |
| `localStorage` indisponível (modo privado/navegador restrito)          | Se a leitura/escrita falhar, o jogo continua funcionando normalmente, apenas sem persistir o recorde (assume-se `highScore = 0` na sessão). |

---

## What is **not** in this spec

- Múltiplos níveis ou progressão de nível.
- Power-ups.
- Controles por mouse ou touch/mobile.
- Multiplayer.
- Canvas responsivo.
- Bundler, framework ou TypeScript.

Cada um desses, se for implementado, vai em sua própria spec.
