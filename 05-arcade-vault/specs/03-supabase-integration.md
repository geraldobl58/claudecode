# 03 — Supabase Integration

- **Estado:** Em revisão
- **Depende de:** —
- **Data:** 2026-09-08
- **Objetivo:** Conectar o Arcade Vault a um projeto Supabase real (cliente, variáveis de ambiente e schema `games`/`scores`) para servir de base de persistência a qualquer jogo do catálogo.

## Por que esta spec existe

Até aqui o projeto era 100% mockado (`localStorage` para auth, `seededScores()` para pontuações). Esta spec introduz a primeira dependência externa real do projeto — um banco Postgres gerenciado pelo Supabase — para que pontuações de jogo sobrevivam a reload e sejam compartilhadas entre jogadores. Documentada retroativamente: o código já foi escrito e mergeado direto em `main` (commit `a2a342d`), fora do fluxo `spec-impl` (branch `spec-NN-slug` + PR) que o projeto normalmente segue — ver Decisões.

## Escopo

**Dentro:**

- Cliente Supabase singleton em `src/lib/supabase.ts`, criado com `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
- Variáveis de ambiente em `.env`: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (adicionadas a partir da `SUPABASE_API_KEY` — uma publishable key `sb_publishable_...` — já existente no arquivo, que não era exposta ao browser por não ter o prefixo `NEXT_PUBLIC_`).
- Schema Postgres no projeto Supabase (`project_ref: ooflghnlgfwfnkupoqpd`): tabelas `public.games` (catálogo) e `public.scores` (pontuações, uma linha por partida salva), com RLS habilitado, leitura pública em ambas e insert público em `scores` validado por `check`.
- Camada de dados genérica e reutilizável por qualquer jogo, em `src/lib/scores.ts`: `getTopScores(gameId, limit)` e `submitScore(gameId, playerName, score)`, ambas parametrizadas por `game_id` — nenhum código específico de um jogo.

**Fora (para specs futuros):**

- Autenticação real via Supabase Auth — o app continua com auth mockada em `localStorage` (`src/context/auth-context.tsx`); `player_name` é texto livre digitado pelo jogador, sem vínculo com um usuário estável.
- Qualquer painel de moderação, rate limiting ou anti-cheat nas pontuações enviadas.
- Migrations versionadas em arquivo `.sql` no repositório — a migration foi (será) aplicada diretamente via Supabase MCP, sem arquivo de histórico commitado. Ver Riscos.

## Modelo de dados

```sql
create table if not exists public.games (
  id text primary key,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  player_name text not null,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists scores_game_id_score_idx on public.scores (game_id, score desc);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games are publicly readable" on public.games for select using (true);
create policy "scores are publicly readable" on public.scores for select using (true);
create policy "anyone can submit a score" on public.scores
  for insert with check (length(trim(player_name)) > 0 and score >= 0);
```

`games` é populada com o(s) `id`/`title` de `GAMES` em `src/data/games.ts` (hoje só `rocks` — ver SPEC 05), para que `getTopScores` nunca dependa de uma linha inexistente.

## Plano de implementação

1. Instalar `@supabase/supabase-js` (`npm install`).
2. Adicionar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` ao `.env` (não versionado — confirmado no `.gitignore`).
3. Criar `src/lib/supabase.ts` com o cliente singleton.
4. Criar `src/lib/scores.ts` com `getTopScores`/`submitScore`, mapeando linhas de `scores` para o tipo `ScoreRow` já existente em `src/data/games.ts` (`{rank, name, score, date}`), para minimizar mudanças nos componentes que já consumiam `seededScores`.
5. Aplicar a migration acima via Supabase MCP (`apply_migration`) contra o projeto `ooflghnlgfwfnkupoqpd`, incluindo o seed de `games`. **Pendente** — ver Riscos.

## Critérios de aceite

- [x] `npm run build` completa sem erros com o cliente Supabase importado.
- [x] `getTopScores`/`submitScore` tratam erro de rede/consulta sem lançar exceção não capturada (retornam `[]` / propagam erro tipado para a UI mostrar estado de falha).
- [ ] As tabelas `public.games` e `public.scores` existem no projeto Supabase.
- [ ] Um `insert` em `scores` via `submitScore` retorna sucesso (sem erro `PGRST205`).
- [ ] Um `select` em `scores` via `getTopScores` retorna as linhas inseridas, ordenadas por `score desc`.

## Decisões

- **Sim:** RLS pública para `insert`/`select`, sem exigir sessão autenticada. Motivo: o app não tem Supabase Auth, só auth mockada; exigir sessão real quebraria o fluxo atual. Aceitável para este estágio do projeto.
- **Sim:** expor a chave publishable (`sb_publishable_...`) no client via `NEXT_PUBLIC_*`. É o modelo do Supabase — a chave é pública por design, a proteção real é a RLS acima.
- **Sim:** camada de dados genérica por `game_id`, não específica de Asteroids, para que Arkanoid/Tetris reaproveitem sem mudança quando forem portados.
- **Não:** migration versionada em `.sql` no repo. Motivo: aplicada via MCP interativo nesta sessão; ver risco abaixo.
- **Não:** deploy do MCP do Supabase automatizado — depende de o usuário reiniciar o Claude Code e aprovar o servidor de projeto (`.mcp.json`, escopo `project`) manualmente a cada ambiente.

## Riscos

| Risco | Mitigação |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| MCP do Supabase não conectado nesta sessão → migration não aplicada | Usuário reinicia o Claude Code no projeto e aprova o servidor `supabase` de `.mcp.json`; assim que conectado, a migration do modelo de dados acima é aplicada e os critérios de aceite pendentes são revalidados. |
| Sem migration versionada em arquivo, o schema só existe "na cabeça" do MCP | Documentado nesta spec (fonte da verdade textual); considerar exportar a migration para `supabase/migrations/` em uma spec futura se o projeto crescer. |
| `.env` com a URL/chave do projeto sendo usado tanto localmente quanto por qualquer outro colaborador do repo | Chave é publishable/RLS-protegida, não é segredo de servidor — risco baixo, mas documentado. |
