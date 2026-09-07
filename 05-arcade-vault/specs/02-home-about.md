# 02 — Home page e About page

- **Estado:** Aprovado
- **Depende de:** SPEC 01
- **Data:** 2026-09-07
- **Objetivo:** Portar as telas `home.jsx` e `about.jsx` de `references/home-about/` para duas novas rotas do App Router — uma landing page `/` (hero, features, uma nova seção "How to Play", preview de jogos, stats e atividade calculados a partir dos dados mockados reais, pricing/FAQ e CTA final) e `/about` (missão + formulário de contato 100% mockado) — movendo a Library atual de `/` para `/games` e atualizando o Nav e todos os links internos afetados.

## Escopo

**Dentro:**

- Nova rota `/` — Home (landing page): hero, seção "WHY ARCADE VAULT" (feature grid), nova seção **"HOW TO PLAY"** (inventada nesta spec, não existe no protótipo de referência), preview de jogos, stats, "LIVE ACTIVITY" (ticker de pontuações recentes + top jogadores), pricing/FAQ e CTA final.
- Nova rota `/about` — About: hero de missão, "highlight row" (3 destaques) e formulário de contato (nome, e-mail, mensagem) 100% mockado, com a animação de "terminal de sucesso" do protótipo.
- Mover a Library (grid de jogos, busca, chips de categoria) de `src/app/page.tsx` para `src/app/games/page.tsx` — nova rota `/games`, sem alterar seu conteúdo ou comportamento.
- Atualizar todo link/redirect interno que hoje assume que `/` é a Library, para apontar para `/games`.
- Atualizar `Nav` (desktop + painel mobile) para incluir "Home" e "About", na ordem Home → Library → Hall of Fame → About.
- Portar para `src/app/globals.css` apenas as seções de CSS do protótipo (`references/home-about/styles.css`) necessárias para Home e About: `.reveal`/`.reveal.in`, `ACTIVITY`, `PRICING`, `HOME PAGE`, `ABOUT PAGE`.
- Componentes decorativos novos: silhuetas SVG flutuantes do hero, ícones pixelados (feature icons, highlight icons) e o mini-card de preview de jogos — todos portados 1:1 do protótipo.

**Fora (para specs futuros):**

- Qualquer envio real de e-mail pelo formulário de contato (precisaria de serviço de e-mail/API route — fora de escopo).
- Qualquer jogo jogável de verdade, autenticação real ou persistência real de pontuação (já fora de escopo desde a SPEC 01).
- A seção `GAMEPAD` presente em `references/home-about/styles.css` (controle/gamepad ilustrado com D-pad, botões A/B, temas de cor) — não é usada por `home.jsx` nem `about.jsx`, não será portada nesta spec.
- Qualquer texto em espanhol ou português na UI, rotas ou dados — tudo em inglês, conforme já estabelecido no projeto.
- Testes automatizados (não há test runner configurado no repositório).

## Modelo de dados

Sem novo modelo de dados. Esta spec reaproveita 100% o que já existe em `src/data/games.ts` (`GAMES`, `CATS`, `seededScores`) — nenhuma struct nova é introduzida. A seção "LIVE ACTIVITY" da Home gera suas linhas combinando `seededScores(seed, n)` (já existente) com os títulos de `GAMES`, de forma determinística; não há timestamps relativos fabricados (nada como "há 2 min") porque isso implicaria uma noção de "tempo real" que a plataforma mockada não tem — cada linha mostra o `date` já retornado por `seededScores`.

## Plano de implementação

1. Mover a Library de `src/app/page.tsx` para `src/app/games/page.tsx` (nova rota `/games`), sem alterar seu conteúdo ou lógica.
2. Atualizar todos os pontos que hoje apontam para `/` esperando a Library, para apontarem para `/games`: `src/app/sign-in/page.tsx` (os dois `router.push("/")` após login/guest), `src/app/games/[id]/page.tsx` (botão "back to library"), `src/components/game-over-modal.tsx` (botão "back to library"), `src/app/hall-of-fame/page.tsx` (CTA "explore games").
3. Criar `src/hooks/use-reveal.ts`: hook client (`useEffect` + `IntersectionObserver`) que adiciona a classe `in` aos elementos `.reveal` visíveis e faz `unobserve` — portado de `useReveal`/`useEffectH` (`home.jsx`) e `useEffectAb` (`about.jsx`), unificando os dois em um só hook reutilizável.
4. Criar `src/components/floating-silhouettes.tsx` (server component, sem interatividade): os 8 SVGs decorativos pixelados do hero (`FloatingSilhouettes`), portados 1:1 de `home.jsx`.
5. Criar `src/components/feature-icon.tsx` e `src/components/highlight-icon.tsx`: ícones SVG pixelados portados de `FeatureIcon` (`home.jsx`) e `HighlightIcon` (`about.jsx`).
6. Criar `src/components/mini-game-card.tsx`: card compacto (capa quadrada + título + categoria), portado de `MiniCard` em `home.jsx`, reaproveitando `Game.cover`.
7. Adicionar ao `src/app/globals.css` as seções que faltam do protótipo (`references/home-about/styles.css`): `.reveal`/`.reveal.in`, `ACTIVITY` (ticker + leaderboard preview), `PRICING`, `HOME PAGE` e `ABOUT PAGE` — pulando a seção `GAMEPAD`, que não é usada.
8. Implementar `src/app/page.tsx` (Home, client component) com as seções, na ordem:
   - **Hero**: `FloatingSilhouettes`, título, CTAs "EXPLORE GAMES" (→ `/games`) e "CREATE ACCOUNT" (→ `/sign-in`).
   - **"WHY ARCADE VAULT"**: feature grid com os 4 cards do protótipo (classic games, 100% free, ladder boards, always growing).
   - **"HOW TO PLAY"** (nova, inventada nesta spec — não existe no `home.jsx` de referência): 3–4 passos numerados explicando o fluxo do site, ex.: 1. Pick a game from the library → 2. Play as guest or sign in to save your score → 3. Use the keyboard or touch controls → 4. Climb the Hall of Fame.
   - **"GAMES AVAILABLE NOW"**: mini rail com `GAMES.slice(0, 6)` usando `MiniGameCard`, CTA "VIEW ALL GAMES" (→ `/games`).
   - **Stats**: primeiro bloco calculado com `GAMES.length` (jogos reais no catálogo); os outros dois blocos ("thousands of matches played", "global ranking") permanecem como slogans qualitativos, sem número fabricado.
   - **"LIVE ACTIVITY"**: ticker de pontuações recentes e lista dos top 5 jogadores, ambos gerados com `seededScores` e pareados deterministicamente com jogos de `GAMES`; link "VIEW HALL OF FAME" (→ `/hall-of-fame`).
   - **Pricing/FAQ**: copy fixa do protótipo (plano único gratuito + 3 perguntas frequentes), CTA "START FREE" (→ `/sign-in`).
   - **CTA final**: "INSERT COIN" (→ `/games`).
9. Implementar `src/app/about/page.tsx` (About, client component): hero de missão, "highlight row" (3 destaques: made with love, runs in any browser, always growing) e formulário de contato (nome, e-mail, mensagem) 100% mockado — validação simples com efeito de shake em campo vazio, sem envio real; ao submeter, mostra a animação de "terminal de sucesso" portada de `about.jsx`.
10. Atualizar `src/components/nav.tsx`: adicionar links "Home" (`/`) e "About" (`/about`) no desktop e no painel mobile; reordenar para Home → Library → Hall of Fame → About; trocar a lógica de `isLibraryActive` para `pathname.startsWith("/games")` (deixa de incluir `/`); adicionar `isHomeActive = pathname === "/"` e `isAboutActive = pathname === "/about"`.
11. Rodar `npm run lint` e `npm run build`; revisar visualmente `/`, `/games` e `/about` via `npm run dev`, comparando com `references/home-about/arcade-vault-standalone.html`, e ajustar detalhes finos (responsividade, animações de reveal, hover states).

## Critérios de aceite

- [ ] `npm run build` completa sem erros.
- [ ] `npm run lint` não reporta erros.
- [ ] `/` renderiza a Home com hero, "WHY ARCADE VAULT", "HOW TO PLAY", preview de jogos, stats, "LIVE ACTIVITY", pricing/FAQ e CTA final, com animação de reveal ao rolar a página.
- [ ] `/games` renderiza a Library (grid, busca e chips de categoria) com o mesmo comportamento que tinha em `/` antes desta spec.
- [ ] `/about` renderiza o hero de missão, os 3 highlights e o formulário de contato.
- [ ] Submeter o formulário de contato com todos os campos preenchidos mostra a animação de "terminal de sucesso"; submeter com algum campo vazio dispara o efeito de shake e não avança.
- [ ] O formulário de contato não envia nenhuma requisição de rede e não persiste nada em `localStorage`.
- [ ] O stat de contagem de jogos na Home reflete `GAMES.length` (8), não um número fixo inventado.
- [ ] `Nav` mostra, nesta ordem, Home / Library / Hall of Fame / About, com o estado "ativo" correto em cada rota (`/`, `/games` e `/games/[id]` e `/games/[id]/play`, `/hall-of-fame`, `/about`).
- [ ] Nenhum link ou redirect do app aponta mais para `/` esperando encontrar a Library (sign-in, botão "back to library" na Detail e no modal de game over, CTA da Hall of Fame) — todos apontam para `/games`.
- [ ] O menu mobile (hamburger) inclui Home e About e continua abrindo/fechando corretamente abaixo de 840px.
- [ ] Nenhuma rota depende de rede/backend — todos os dados vêm de `src/data/games.ts` e do contexto de sessão mockado já existente.
- [ ] Nenhum texto em espanhol ou português aparece em `/`, `/about` ou em qualquer componente/dado novo criado nesta spec.

## Decisões tomadas e descartadas

- **Home assume a rota `/` e a Library move para `/games`** — decisão explícita do usuário nesta sessão, em vez de colocar a Home numa sub-rota (`/home`) e manter a Library na raiz. Casa com a ordem do nav do protótipo (Home, Library, Hall of Fame, About) e com a expectativa comum de landing page na raiz do site.
- **Seção "HOW TO PLAY" nova, inventada nesta spec** — o `home.jsx` de referência não tem um passo-a-passo explícito de como jogar; decisão explícita do usuário foi adicionar essa seção mesmo sem existir no protótipo, com conteúdo definido nesta spec (não no protótipo).
- **Formulário de contato 100% mockado, sem envio real** — consistente com o resto do projeto (SPEC 01 já mocka autenticação); enviar e-mail de verdade exigiria um serviço externo e uma API route, o que mereceria spec própria caso seja necessário no futuro.
- **Stats computados a partir de dados reais onde existe um número real** (`GAMES.length` para contagem de jogos) **em vez da cópia estática do protótipo** ("12+ JOGOS", que não bate com o catálogo real de 8 jogos). Os outros dois stat-blocks (partidas jogadas, ranking global) não têm um número real correspondente nos dados mockados existentes, então permanecem como slogans qualitativos em vez de inventar uma métrica falsa.
- **Ticker de "LIVE ACTIVITY" sem timestamps relativos fabricados** ("há 2 min", etc.) — usa apenas o campo `date` já determinístico de `seededScores`, evitando reforçar uma falsa sensação de atividade em tempo real numa plataforma inteiramente mockada.
- **Seção `GAMEPAD` do `styles.css` de referência não é portada** — não é usada por nenhum dos dois componentes desta spec (`home.jsx`, `about.jsx`); portar CSS morto não tem valor.
- **Hook `useReveal` unificado em `src/hooks/use-reveal.ts`** em vez de duplicar a mesma lógica de `IntersectionObserver` em `home.jsx` e `about.jsx` como no protótipo — mesmo comportamento, sem duplicação de código.
- **`MiniGameCard` como componente novo**, em vez de reaproveitar `GameCard` (usado na Library) — o protótipo já usa um card visualmente distinto (`MiniCard`, capa 1:1, mais compacto) para o preview da Home; reaproveitar o card grande da Library, com padding/proporções diferentes, exigiria props condicionais que tornariam o componente mais confuso do que dois componentes simples.

## Riscos identificados

- Mover a Library de `/` para `/games` toca vários arquivos que hoje assumem `/` como a Library (`sign-in`, Detail, modal de game over, Hall of Fame, `Nav`). Mitigação: todos os pontos afetados já foram identificados nesta spec (passo 2 do plano) via busca no código atual — nenhum deve ser esquecido.
- Este projeto usa `next@16.3.4` / `react@19.2.8`, mais novos que o conhecimento de treinamento do modelo. Mitigação: consultar `node_modules/next/dist/docs/01-app/` antes de escrever as novas rotas `/games` e `/about`, conforme já indicado em `AGENTS.md`.
