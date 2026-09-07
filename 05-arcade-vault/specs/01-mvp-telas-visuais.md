# 01 — MVP: telas visuais do Arcade Vault

- **Estado:** Aprovado
- **Depende de:** —
- **Data:** 2026-09-07
- **Objetivo:** Portar as seis telas visuais do protótipo em `references/templates/` (Library, Detail, Player, Sign In/Sign Up, Hall of Fame e Nav) para rotas reais do App Router, usando apenas dados mockados, sessão de usuário simulada e sem implementar a lógica de nenhum jogo — toda a cópia da UI e as rotas em inglês.

## Escopo

**Dentro:**

- Rotas do App Router:
  - `/` — Library (grid de jogos, busca, chips de categoria)
  - `/games/[id]` — Detail do jogo (capa, descrição, stats, leaderboard lateral)
  - `/games/[id]/play` — Player, como **mockup estático** (HUD, tela CRT decorativa, modal de fim de jogo)
  - `/hall-of-fame` — Hall of Fame (pódio + tabela por jogo)
  - `/sign-in` — Sign in / sign up / guest
- `Nav` (desktop + painel mobile) compartilhado via `layout.tsx`, incluindo o fundo fixo (`av-bg`, `av-noise`) e o footer.
- Dados mockados portados de `data.jsx` para TypeScript: `GAMES`, `CATS` e a função determinística `seededScores` (já traduzidos para inglês no protótipo: ids como `block-buster`, `descent`, `serpentine`, `glutton`, `invaders`, `rocks`, `crossing`, `pixel-duel`).
- Sessão de usuário mockada (sign in, sign up, "play as guest") 100% client-side, persistida em `localStorage`, sem backend real.
- Reaproveitamento do `globals.css` já existente na árvore de trabalho — o design já foi portado quase 1:1 de `styles.css` (diff de 39 linhas, todas relacionadas ao Tailwind v4) — não há novo CSS/design a criar.

**Fora (para specs futuros):**

- Qualquer jogo jogável de verdade (motor de jogo, input, colisões, física, etc.) para os 8 jogos do catálogo.
- Autenticação real (backend, banco de dados, OAuth funcional com Google/GitHub — os botões sociais ficam decorativos).
- Persistência real de pontuações ou um leaderboard dinâmico alimentado por partidas reais.
- Sistema de créditos/moedas funcional — o contador "CREDITS · 03" no nav permanece decorativo e fixo, igual ao protótipo.
- Testes automatizados (não há test runner configurado no repositório).
- Qualquer texto em espanhol ou português na UI, rotas, nomes de arquivo ou dados — tudo em inglês, sem i18n (idioma único).

## Modelo de dados

Novo arquivo `src/data/games.ts`, portando `data.jsx`:

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameAccent = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // sufixo da classe CSS, ex: "cover-bricks"
  color: GameAccent;
  best: number;
  plays: string;
}

export const GAMES: Game[]; // os 8 jogos, portados 1:1 do protótipo (ids e textos em inglês)
export const CATS: Array<"ALL" | GameCategory>;

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

Sessão mockada — `src/context/auth-context.tsx` (client component):

```ts
export interface MockUser {
  name: string;
}
```

Persistida em `localStorage` na chave `av_user` (mesma chave do protótipo, só por consistência — não há migração/versionamento porque o formato é trivial e descartável).

## Plano de implementação

1. Criar `src/data/games.ts` portando `GAMES`, `CATS`, `PLAYERS` e `seededScores` de `data.jsx` para TypeScript tipado (ids e textos já em inglês).
2. Criar `src/context/auth-context.tsx` (client component) expondo `user`, `signIn(name)` e `signOut()`, lendo/escrevendo `localStorage["av_user"]`; envolver o `RootLayout` com esse provider.
3. Portar `Nav` para `src/components/nav.tsx` (client component), incluindo o painel mobile; usar `next/link` e `usePathname` para o estado "ativo" no lugar do `route` do hash-router do protótipo. Labels: "Library", "Hall of Fame", "Sign In" / nome do usuário.
4. Ajustar `src/app/layout.tsx`: adicionar as divs de fundo fixo (`av-bg`, `av-noise`), o `Nav` e o footer ("© 2026 ARCADE VAULT · MADE WITH PIXELS AND NEON · v2.6.0"); garantir que o conteúdo (`Nav` + `main` + footer) renderize acima do fundo fixo, substituindo o `#root { position:relative; z-index:2 }` do protótipo por um wrapper equivalente no `body`. `<html lang="en">`.
5. Implementar `/` (Library) em `src/app/page.tsx`, com `src/components/game-card.tsx` (client, efeito de tilt no mouse) — substituindo a tela padrão do `create-next-app` — com busca por nome ("Search a game by name…") e chips de categoria ("ALL", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS") filtrando a grid.
6. Implementar `/games/[id]/page.tsx` (Detail): capa, tags ("1 PLAYER", "KEYBOARD / TOUCH", "RETRO 1985"), descrição, stats ("Plays", "Global Best", "Difficulty") e leaderboard lateral ("TOP SCORES") com `seededScores`; usar `notFound()` para IDs inexistentes.
7. Implementar `/games/[id]/play/page.tsx` (Player) como **mockup estático**: HUD com valores fixos (Score `0`, `3` Lives, Level `01`), tela CRT decorativa, e o modal "GAME OVER" exibido como estado estático de demonstração — sem `setInterval` nem qualquer lógica de jogo. O botão "SAVE SCORE" é puramente decorativo (mostra o toast "SCORE SAVED" mas não grava nada).
8. Implementar `/sign-in/page.tsx` (Auth): abas "SIGN IN" / "CREATE ACCOUNT", botão "PLAY AS GUEST" e botões sociais decorativos ("GOOGLE" / "GITHUB"), chamando `signIn` do contexto mockado ao submeter e redirecionando para `/`.
9. Implementar `/hall-of-fame/page.tsx`: abas por jogo, pódio (top 3, label "CHAMPION") e tabela ("RANK" / "PLAYER" / "SCORE" / "DATE") usando `seededScores`; mostrar a linha "YOUR BEST SCORE IN {game}" apenas quando existe um usuário mockado logado.
10. Rodar `npm run lint` e `npm run build`; revisar visualmente cada rota via `npm run dev`, comparando com `references/templates/Arcade Vault.html`, e ajustar detalhes finos (responsividade, hover states, animações).

## Critérios de aceite

- [ ] `npm run build` completa sem erros.
- [ ] `npm run lint` não reporta erros.
- [ ] `/` renderiza a Library com busca funcional, chips de categoria filtrando a grid, e cards com efeito hover/tilt.
- [ ] `/games/[id]` renderiza para todos os IDs em `GAMES`, mostrando capa, descrição, stats e leaderboard lateral com 10 linhas.
- [ ] `/games/[id]/play` renderiza o HUD, a tela CRT decorativa e o modal "GAME OVER" como mockup estático, sem nenhum `setInterval` ou lógica de jogo real.
- [ ] `/sign-in` permite entrar (sign in, sign up ou guest) e isso atualiza o `Nav` para mostrar o nome do usuário.
- [ ] Recarregar a página (F5) mantém o usuário logado, via `localStorage["av_user"]`.
- [ ] `/hall-of-fame` mostra pódio + tabela para cada jogo, com a linha extra "YOUR BEST SCORE IN {game}" aparecendo apenas quando há usuário logado.
- [ ] O menu mobile (hamburger) abre/fecha o painel lateral abaixo de 840px de largura.
- [ ] Nenhuma rota depende de rede/backend — todos os dados vêm de `src/data/games.ts` e do contexto de sessão mockado.
- [ ] O botão "SAVE SCORE" mostra o toast de confirmação mas não grava nada em `localStorage`.
- [ ] Nenhum texto em espanhol ou português aparece em nenhuma rota, componente, dado mockado ou metadado (`<html lang="en">`, `metadata.description`, etc.).

## Decisões tomadas e descartadas

- **Tudo em inglês** — rotas (`/games/[id]`, `/hall-of-fame`, `/sign-in`), cópia da UI, dados mockados (títulos, descrições, ids dos jogos) e metadados (`lang="en"`). Decisão revista nesta sessão: a versão anterior da spec usava rotas e textos em espanhol (para manter a "identidade" do protótipo original); o usuário pediu explicitamente para não haver nada em espanhol, incluindo os próprios arquivos de referência em `references/templates/`, que já foram traduzidos.
- **GamePlayer como mockup estático**, em vez de manter o placar falso incrementando sozinho do protótipo — evita introduzir qualquer "lógica de jogo", mesmo que decorativa, conforme pedido explícito de não implementar jogos.
- **Sessão mockada persistida em `localStorage`** (chave `av_user`) — replica a UX do protótipo (usuário continua logado após F5) com esforço mínimo, sem precisar de backend.
- **Botão de salvar pontuação puramente decorativo** (não grava em `localStorage`) — não existe pontuação real nem tela que leia esse dado depois; gravar seria um dado morto.
- **`seededScores` portado com a mesma lógica pseudo-aleatória determinística** do protótipo, em vez de `Math.random()` puro — mantém os rankings visualmente idênticos e estáveis entre navegações.
- **Reaproveitar o `globals.css` já existente** na árvore de trabalho, em vez de recriar os estilos — o design já foi portado quase 1:1 de `styles.css` nesta mesma cópia de trabalho (diff de 39 linhas, todas relacionadas ao Tailwind v4); as classes CSS já eram nomeadas em inglês/genérico (`av-hall`, `hall-tabs`, etc.), então nenhuma classe precisou mudar.
- **Créditos/moedas ("CREDITS · 03") decorativos e fixos** no nav, sem lógica — fora de escopo deste MVP visual.
- **Sem testes automatizados** — não há test runner configurado no repositório.

## Riscos identificados

- O fundo fixo (`av-bg`/`av-noise`) dependia de `#root { position:relative; z-index:2 }` no protótipo para o conteúdo ficar por cima. Sem esse elemento no App Router, o conteúdo pode renderizar atrás do fundo se o empilhamento não for replicado no `layout.tsx`. Mitigação: aplicar `position:relative; z-index:2` no wrapper que envolve `Nav` + `main` + footer dentro do `body`.
- Este projeto usa `next@16.3.4` / `react@19.2.8`, mais novos que o conhecimento de treinamento do modelo — convenções de rota dinâmica, `params` assíncronos, tipagem de rotas (`LayoutProps<"/">"`) etc. podem diferir do Next.js "clássico". Mitigação: consultar `node_modules/next/dist/docs/01-app/` antes de escrever cada rota, conforme já indicado em `AGENTS.md`.
