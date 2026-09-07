# SPEC 02 — Animação de explosão ao destruir blocos

> **Status:** Finalizado
> **Depends on:** SPEC 01
> **Date:** 2026-09-07
> **Objective:** Ao destruir um bloco, exibir uma animação de explosão de 4 frames (na cor do bloco destruído) na posição do bloco, reaproveitando `EXPLOSION_FRAMES`/`EXPLOSION_DURATION` já mapeados em `assets/spritesheet.js`, sem bloquear a física do jogo.

---

## Scope

**In:**

- Reaproveitar `EXPLOSION_FRAMES` (4 frames por cor), `EXPLOSION_DURATION` e a função `drawFrame` já existentes em `assets/spritesheet.js` — nenhum asset novo é necessário.
- Ao um bloco ser destruído em `checkBlockCollision` (`game.js`), registrar uma explosão ativa na posição e tamanho do bloco (`x`, `y`, `width: 32`, `height: 16`), com a cor daquele bloco.
- A animação percorre os 4 frames de `EXPLOSION_FRAMES[color]` ao longo de `EXPLOSION_DURATION` (150ms de duração **total**, ~37.5ms por frame), medida com `performance.now()` — independente da taxa de frames do `requestAnimationFrame`.
- Suporte a múltiplas explosões simultâneas: uma lista de explosões ativas em `state.explosions`, cada uma progredindo e sendo removida de forma independente ao terminar.
- Efeito **não-bloqueante**: bola, raquete e demais blocos continuam se movendo e colidindo normalmente enquanto uma ou mais explosões estão em andamento.
- Zerar explosões ativas ao reiniciar a partida (`resetGame`), para não deixar animações residuais de uma partida anterior.

**Out of scope (for future specs):**

- Novos efeitos sonoros — `break-sound.mp3` continua sendo o único som de destruição de bloco, sem alteração.
- Animações de explosão para outros elementos (raquete, bola, colisão com paredes).
- Configuração de duração/velocidade da animação pelo jogador (ex: opção de desativar efeitos visuais).
- Partículas, shake de tela ou qualquer efeito que não use os frames já existentes no sprite sheet.

---

## Data model

```js
// Nova propriedade em `state`, lista de explosões ativas
state.explosions = [
  // { x, y, width: 32, height: 16, color: 'red', startTime: 1234.5 }
  // startTime em performance.now() no momento em que o bloco foi destruído
];
```

Convenções:

- `x`, `y`, `width`, `height` copiados diretamente do bloco destruído (mesma posição/tamanho do sprite do bloco).
- `color` corresponde às chaves de `EXPLOSION_FRAMES` (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`) — as mesmas cores usadas em `SPRITES.blocks`.
- Índice do frame atual: `frameIndex = Math.min(3, Math.floor((performance.now() - startTime) / (EXPLOSION_DURATION / 4)))`.
- Uma explosão é removida da lista quando `performance.now() - startTime >= EXPLOSION_DURATION`.

---

## Implementation plan

1. Em `checkBlockCollision`, ao marcar `block.alive = false`, adicionar um novo objeto de explosão a `state.explosions` (`x`, `y`, `width`, `height`, `color: block.color`, `startTime: performance.now()`), mantendo o restante da função (score, `break-sound.mp3`, checagem de vitória) inalterado. Teste manual: destruir um bloco continua funcionando exatamente como antes (score sobe, som toca), sem nenhuma mudança visual ainda.
2. Criar `updateExplosions()`, chamada dentro de `update()`, que percorre `state.explosions` e remove (via `filter`) as que já ultrapassaram `EXPLOSION_DURATION` desde seu `startTime`. Teste manual: inspecionar `state.explosions` no console mostra o array esvaziando sozinho ~150ms após cada destruição.
3. Criar `drawExplosions()`, chamada dentro de `drawPlayingScene()` logo após desenhar os blocos (e antes ou depois da raquete/bola, tanto faz visualmente), que para cada explosão ativa calcula o `frameIndex` e chama `drawFrame(ctx, EXPLOSION_FRAMES[explosion.color][frameIndex], explosion.x, explosion.y, explosion.width, explosion.height)`. Teste manual: destruir um bloco mostra visualmente a animação de 4 frames na posição exata do bloco, na cor correta, antes de desaparecer.
4. Adicionar `state.explosions = []` em `resetGame()`. Teste manual: reiniciar o jogo logo após destruir um bloco (antes da animação terminar) não deixa nenhum frame de explosão "grudado" na tela da nova partida.

---

## Acceptance criteria

- [ ] Ao destruir um bloco, aparece uma animação de explosão de 4 frames na posição exata do bloco destruído, usando a cor correspondente de `EXPLOSION_FRAMES`.
- [ ] A animação dura aproximadamente 150ms no total e desaparece sozinha ao final, sem deixar nenhum frame residual na tela.
- [ ] A bola, a raquete e os demais blocos continuam se movendo e colidindo normalmente enquanto a explosão está em andamento (nenhuma pausa perceptível no jogo).
- [ ] Destruir dois ou mais blocos em sucessão rápida exibe as explosões correspondentes simultaneamente, cada uma progredindo e desaparecendo de forma independente.
- [ ] Reiniciar o jogo (Espaço/Enter a partir de Game Over/Vitória, ou nova partida pela tela inicial) nunca mantém uma explosão de uma partida anterior visível na tela.
- [ ] `break-sound.mp3` continua tocando no momento da destruição do bloco, sem alteração de comportamento sonoro em relação à SPEC 01.

---

## Decisions

- **Sim:** reaproveitar `EXPLOSION_FRAMES`/`EXPLOSION_DURATION`/`drawFrame`, já definidos em `assets/spritesheet.js` mas não usados por nenhum código ainda, em vez de criar novo asset ou animação desenhada via formas de canvas. Zero trabalho de arte extra; a infraestrutura já existia pronta para isso.
- **Sim:** interpretar `EXPLOSION_DURATION = 150` como duração **total** da animação (~37.5ms por frame), não duração por frame. Mantém a explosão rápida, alinhada ao ritmo ágil do MVP já implementado (SPEC 01).
- **Sim:** efeito não-bloqueante — a física de bola/raquete/blocos nunca pausa por causa de uma explosão. Preserva a jogabilidade fluida já validada; é o comportamento padrão em jogos arcade clássicos do gênero.
- **Sim:** suportar múltiplas explosões simultâneas via lista `state.explosions`, em vez de um único slot de explosão. Custo de implementação baixo e evita cortar a animação de um bloco quando outro é destruído logo em seguida.
- **Sim:** medir o progresso da animação com `performance.now()` em vez de contar frames de `requestAnimationFrame`. Mantém a duração real em milissegundos estável independentemente de variações na taxa de quadros.
- **Não:** som novo, shake de tela, partículas ou configuração de duração pelo jogador. Fora do escopo desta spec; `break-sound.mp3` já cobre o feedback sonoro da SPEC 01.

---

## What is **not** in this spec

- Novos efeitos sonoros para a explosão.
- Animações de explosão para raquete, bola ou colisões com paredes.
- Configuração de duração/velocidade da animação pelo jogador.
- Partículas, shake de tela ou efeitos que não usem os frames do sprite sheet.

Cada um desses, se for implementado, vai em sua própria spec.
