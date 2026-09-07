# SPEC 03 — Níveis de som

> **Status:** Aprovado
> **Depends on:** SPEC 01
> **Date:** 2026-09-07
> **Objective:** Substituir o mudo simples (tecla M) por três níveis de volume (Desligado / Médio / Alto) que o jogador cicla com a mesma tecla M, aplicados a `ball-bounce.mp3` e `break-sound.mp3`, persistidos em `localStorage` entre sessões.

---

## Scope

**In:**

- Três níveis de som: `off` (volume 0), `medium` (volume 0.5) e `high` (volume 1.0), aplicados igualmente aos dois efeitos sonoros existentes (`ball-bounce.mp3`, `break-sound.mp3`). Não há trilha musical no jogo, então não há distinção entre volume de música e de efeitos.
- Tecla `M` cicla os níveis em ordem fixa: `high → medium → off → high → ...`. Reaproveita a mesma tecla física usada pelo mudo na SPEC 01, apenas muda o comportamento (cicla 3 estados em vez de alternar 2).
- Remoção de `state.muted` e da lógica de mudo binário da SPEC 01, substituída por `state.soundLevel`.
- Persistência do nível escolhido em `localStorage`, mesmo padrão usado para o recorde (`arkanoid-highscore`), com nova chave `arkanoid-sound-level`. O nível é carregado ao iniciar o jogo e salvo a cada alteração.
- Indicador textual do nível atual nos dois lugares onde o mudo já aparecia hoje: no HUD durante a partida (`drawHUD`) e na tela de pausa/tela inicial (`drawStartScreen`) — texto trocado de `Mudo (M): ON/OFF` para `Som (M): Desligado/Médio/Alto`.

**Out of scope (for future specs):**

- Volume contínuo/slider (ex: 0–100% em passos de 10%). Só os 3 níveis fixos definidos acima.
- Volumes independentes por efeito sonoro (ex: bounce mais baixo que break).
- Trilha musical de fundo.
- Controle por mouse/slider clicável no canvas.

---

## Data model

```js
// Substitui `muted: false` em `state`
state.soundLevel = "high"; // 'off' | 'medium' | 'high' — carregado de localStorage ao iniciar

// Constantes novas em game.js
const SOUND_LEVELS = ["off", "medium", "high"];
const SOUND_VOLUMES = { off: 0, medium: 0.5, high: 1.0 };
const SOUND_LEVEL_KEY = "arkanoid-sound-level";
const SOUND_LEVEL_LABELS = { off: "Desligado", medium: "Médio", high: "Alto" };
```

Convenções:

- Chave do `localStorage`: `arkanoid-sound-level`, valor sendo uma das strings `'off' | 'medium' | 'high'` (mesmo padrão de leitura/escrita defensiva com `try/catch` já usado por `loadHighScore`/`saveHighScore`).
- Se o valor salvo em `localStorage` for inválido ou ausente, o padrão é `'high'`.
- `state.explosions` e `resetGame()` não são afetados — o nível de som, assim como o mudo antes dele, sobrevive a reinícios de partida (só muda por ação explícita do jogador ou reload com valor salvo).

---

## Implementation plan

1. Em `game.js`, adicionar as constantes `SOUND_LEVELS`, `SOUND_VOLUMES`, `SOUND_LEVEL_KEY`, `SOUND_LEVEL_LABELS`, e as funções `loadSoundLevel()`/`saveSoundLevel(value)` (mesmo padrão try/catch de `loadHighScore`/`saveHighScore`, linhas 51-68). Substituir `muted: false` por `soundLevel: loadSoundLevel()` em `state` (linha 75). Teste manual: abrir o jogo sem nada salvo ainda mostra o comportamento de antes (som tocando normalmente), sem erros no console.
2. Atualizar `playSound(audio)` (linha 93-97) para setar `audio.volume = SOUND_VOLUMES[state.soundLevel]` antes de `audio.play()`, removendo o `if (state.muted) return;`. Teste manual: com o nível padrão (`high`), os sons continuam tocando no volume normal ao rebater e quebrar blocos.
3. No handler de `keydown` (linha 207-210), trocar a alternância de `state.muted` por um ciclo de `state.soundLevel` pelo array `SOUND_LEVELS` (índice anterior, voltando ao final do array quando chega a 0) e chamar `saveSoundLevel(state.soundLevel)` a cada mudança. Teste manual: pressionar M repetidamente cicla Alto → Médio → Desligado → Alto; em Desligado nenhum som toca, em Médio o som toca mais baixo (perceptível ao comparar com Alto).
4. Atualizar os dois textos de exibição (`drawHUD` linha 137 e `drawStartScreen` linha 152) de `Mudo (M): ${state.muted ? 'ON' : 'OFF'}` para `Som (M): ${SOUND_LEVEL_LABELS[state.soundLevel]}`. Teste manual: o texto no HUD durante o jogo e na tela inicial reflete corretamente o nível atual após cada toque em M.
5. Confirmar que recarregar a página após mudar o nível preserva a escolha (via `arkanoid-sound-level` no `localStorage`). Teste manual: mudar para Médio, recarregar a página, ver "Som (M): Médio" já na tela inicial e o volume médio aplicado desde o primeiro som tocado.

---

## Acceptance criteria

- [ ] A tecla M cicla o som em três níveis, na ordem Alto → Médio → Desligado → Alto → ...
- [ ] No nível Desligado, nenhum som toca ao rebater a bola ou quebrar um bloco.
- [ ] No nível Médio, os sons tocam em volume perceptivelmente mais baixo que no nível Alto.
- [ ] No nível Alto, os sons tocam no volume máximo (comportamento equivalente ao "não-mudo" da SPEC 01).
- [ ] O HUD durante a partida mostra o nível de som atual (`Som (M): Desligado/Médio/Alto`).
- [ ] A tela inicial (e a tela de pausa, se aplicável) mostra o mesmo indicador de nível de som atual.
- [ ] O nível de som escolhido é salvo em `localStorage` a cada mudança e recuperado ao recarregar a página.
- [ ] Se `localStorage` estiver indisponível (ex: modo privado), o jogo continua funcionando normalmente com o nível padrão `Alto`, sem lançar erros no console.
- [ ] `state.muted` e qualquer referência a ele deixam de existir no código.

---

## Decisions

- **Sim:** reaproveitar a tecla M em vez de introduzir uma nova tecla. O jogador já associa M a controle de som pela SPEC 01; ciclar 3 estados na mesma tecla é a menor mudança de UX possível.
- **Sim:** 3 níveis fixos (Desligado/Médio/Alto) em vez de um slider contínuo. Cobre a necessidade de "diferentes níveis de som" sem exigir input de mouse/touch, que o jogo não usa em nenhum outro lugar (SPEC 01 é só teclado).
- **Sim:** um único multiplicador de volume aplicado igualmente a `ball-bounce.mp3` e `break-sound.mp3`, em vez de volumes independentes por efeito. Só existem dois efeitos sonoros e nenhum pedido de diferenciá-los; menor complexidade de estado e UI.
- **Sim:** persistir em `localStorage` com o mesmo padrão defensivo (try/catch) já usado para o recorde. Consistência com a SPEC 01 e mesma garantia de que a falta de `localStorage` não quebra o jogo.
- **Não:** manter `state.muted` como estado paralelo. Um único `state.soundLevel` cobre o caso de mudo (nível `off`) sem duplicar estado.
- **Não:** slider clicável no canvas ou qualquer input por mouse. Fora do padrão de controles do jogo (só teclado, decisão já tomada na SPEC 01) e desnecessário para o objetivo pedido.

---

## Risks

| Risco                                                                                           | Mitigação                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valor inválido/corrompido salvo em `arkanoid-sound-level` (ex: edição manual do `localStorage`) | `loadSoundLevel()` valida que o valor lido pertence a `SOUND_LEVELS`; caso contrário, usa o padrão `'high'`.                                                               |
| `localStorage` indisponível (modo privado/navegador restrito)                                   | Mesma mitigação da SPEC 01: leitura/escrita em try/catch; o jogo continua funcionando normalmente, apenas sem persistir o nível entre sessões (assume `'high'` na sessão). |

---

## What is **not** in this spec

- Volume contínuo/slider.
- Volumes independentes por efeito sonoro.
- Trilha musical de fundo.
- Controle por mouse/slider clicável no canvas.

Cada um desses, se for implementado, vai em sua própria spec.
