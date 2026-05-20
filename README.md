# Protocolo 5M

> PWA pessoal de protocolo de recomposição corporal — checklist diário, treinos com tracking de cargas/PR, dieta, suplementação. Pensado pra instalar como app no iPhone (Add to Home Screen) e, em fases futuras, ganhar coach com LLM para sugerir cargas, repetições e intensidade do próximo treino.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · (em breve) Convex · (em breve) Anthropic Claude API

---

## Status

| Fase | Descrição | Status |
| --- | --- | --- |
| 0 | Scaffold Next.js + tooling profissional | ✅ |
| 1 | Port do design system (tokens, layout, navegação) | ✅ |
| 2 | Domínio completo + light/dark + responsive desktop | ✅ |
| 3 | Backend Convex — schema + queries + mutations + migration | ✅ |
| 4 | Convex Auth + claim/merge + UI completa + E2E validado | ✅ |
| 5 | PWA real (manifest, service worker, ícones, splash) | ⏳ |
| 6 | Deploy Vercel — `vercel.json` + guia [VERCEL_SETUP.md](VERCEL_SETUP.md) | ✅ pronto pra push |
| 7 | Coach LLM (sugestão de cargas, análise semanal, RPE) | ⏳ |

A versão original single-file está preservada em [`legacy/Protocolo-5M-App_1.html`](legacy/Protocolo-5M-App_1.html) como referência.

---

## Quick start

Requisitos: **Node 22+** e **pnpm 11+** (habilitado via `corepack enable pnpm`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Outros scripts:

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm lint:fix     # eslint --fix
pnpm format       # prettier --write .
pnpm build        # build de produção
```

---

## Arquitetura

```
app/                    # rotas (App Router)
  layout.tsx            # shell: ThemeProvider + ToastProvider + Sidebar/TopBar/TabBar
  page.tsx              # /         (Home / dashboard / streak / stats)
  checklist/page.tsx    # /checklist (12 hábitos diários + ring progress)
  treino/page.tsx       # /treino    (picker + active workout + PRs + histórico)
  protocolo/page.tsx    # /protocolo (7 seções accordion: dieta, suplementos, ...)
  globals.css           # tokens light/dark + @theme do Tailwind v4
components/
  layout/               # Sidebar (desktop) · TopBar/TabBar (mobile) · theme-provider · nav-items
  ui/                   # Panel · StatCard · ScreenHeader · Button · Modal · Toast · RingProgress · WeekGrid
  checklist/            # ChecklistItem
  treino/               # ExerciseLogger · RestTimerFloat
  animate-ui/           # vendored animate-ui (theme-toggler com View Transitions)
lib/
  types.ts              # tipos do domínio
  constants.ts          # CHECKLIST_ITEMS · WORKOUTS · ACHIEVEMENTS
  dates.ts              # todayStr · formatDateBR · addDays · greetingFor
  domain.ts             # getStreak · isPR · getAllPRs · suggestNextWorkout · ...
  plates.ts             # calcPlates · formatPlates (barra 20kg)
  storage.ts            # localStorage versionado (v2) + export/import
  useStore.ts           # hook reativo entre abas (storage event + custom)
  useRestTimer.ts       # timer de descanso com vibração
  protocol-content.tsx  # conteúdo das 7 seções
  utils.ts              # cn (clsx + tailwind-merge)
public/                 # ícones, manifest.json (Fase 5)
convex/                 # backend (Fase 3) — schema + queries + mutations
  schema.ts             # 4 tabelas: profiles, checklistEntries, workouts, achievementsUnlocked
  profiles.ts           # ensureProfile, getProfile (deviceId-based até Fase 4)
  checklist.ts          # getDay, getRange, getStreak, getWeekAdherence, toggleItem
  workouts.ts           # listRecent, getAllPRs, getPreviousBest, suggestNext, finishWorkout
  achievements.ts       # list, checkAndUnlock
  migrations.ts         # importLocalStorage (one-shot, idempotente)
  lib/                  # constants + dates replicados pro runtime do Convex
legacy/                 # versão single-file original
```

**Setup do Convex:** veja [CONVEX_SETUP.md](CONVEX_SETUP.md). Em resumo:
`pnpm convex:dev` na primeira vez (autentica + provisiona deployment + gera tipos).

### Design system

Dual theme: **light** (paper #faf8f3 / café gold #a47648) e **dark** (carbon #0a0a0a / wheat gold #d4a574). Serifa EB Garamond para títulos/números, Inter para microlabels. O toggler usa View Transitions API com clip-path animado.

Naming dos tokens (em `app/globals.css`):

- `--bg`, `--bg-card`, `--bg-elev`, `--bg-deep` — superfícies
- `--text`, `--text-soft`, `--text-dim`, `--text-mute`, `--text-faint` — hierarquia textual
- `--line`, `--line-strong`, `--line-faint` — bordas
- `--brand`, `--brand-bright`, `--brand-deep` — gold (não use `--accent`, está reservado pro shadcn)
- `--success`, `--danger`, `--warning`, `--info` — semânticos
- Tokens shadcn (`--primary`, `--accent`, `--ring`, ...) estão bridged pro mesmo sistema, então `bg-primary`/`bg-brand` funcionam.

Use no Tailwind como `bg-bg-card`, `text-brand`, `border-line`, `text-text-dim`, etc.

### Responsive

- **< 1024px (mobile)**: TopBar no topo (logo + theme toggle), TabBar no bottom (4 ícones + safe-area).
- **≥ 1024px (desktop)**: Sidebar fixa de 260px à esquerda (logo + nav + theme toggle no rodapé), conteúdo centrado a até 2xl.

### Persistência (intermediária — Fase 2)

Todos os dados ficam em `localStorage` sob a chave `protocolo5m_v2` (schema versionado). O hook `useStore()` re-renderiza automaticamente quando outra aba grava (event `storage`) ou quando a mesma aba grava (custom event `protocolo:change`). Esse contrato será trocado pelo Convex na Fase 3 sem reescrever páginas — só substitui o hook.

### Por que essa stack

- **Next.js App Router + RSC** — código de servidor por padrão, menor JS no client, ótimo pra performance em mobile
- **TypeScript estrito** — `strict: true` no tsconfig
- **Tailwind v4** — tokens no CSS, sem `tailwind.config.ts`, build mais rápido
- **Convex (planejado)** — type-safe end-to-end, queries reativas (ideal pra streak/PR ao vivo), free tier generoso

---

## Roadmap detalhado

### Fase 2 — Domínio (próxima)

- Tipos compartilhados (`lib/types.ts`): `ChecklistEntry`, `Workout`, `Exercise`, `Set`, `PR`, `Achievement`
- Funções puras em `lib/`: `getStreak`, `getWeekStats`, `isPR`, `suggestNextWorkout`, `calcPlates`
- Componentes interativos: `ChecklistItem`, `ExerciseLogger` (com timer de descanso), `WeekGrid`, `RingProgress`
- Persistência intermediária via `localStorage` (com schema versionado)

### Fase 3 — Convex

- `convex/schema.ts` com `users`, `checklistEntries`, `workouts`, `personalRecords`, `achievements`
- Queries: `getDay`, `getWeek`, `getNextWorkout`, `getAllPRs`
- Mutations: `toggleChecklistItem`, `finishWorkout`, `recordSet`
- Migração one-shot do `localStorage` → Convex no primeiro login

### Fase 5 — PWA

- `app/manifest.ts` (Next 16 nativo) com nome, ícones 192/512, `display: standalone`
- Service worker via `@serwist/next` ou `next-pwa`
- `apple-touch-icon` 180×180 + splash screens
- Documentação no app sobre "Adicionar à Tela de Início" no iOS

### Fase 7 — Coach LLM

API route `/api/coach` recebendo:
- `{ task: "next-load", exercise: "Supino reto barra" }` → sugere +2.5kg, manter, ou deload
- `{ task: "week-review" }` → análise narrativa de adesão e padrões
- `{ task: "next-intensity" }` → RPE sugerido baseado em sono/recovery do checklist

Provider via env var (`LLM_PROVIDER=anthropic|google|groq`). Provider neutro pra trocar entre Claude (pago, melhor qualidade) e Gemini/Groq (free tier) sem reescrever.

---

## Deploy (Fase 6)

Plano: **Vercel** (frontend, free tier Hobby) + **Convex Cloud** (backend, free tier).

1. Push pro GitHub
2. `vercel link` → conectar repo
3. Adicionar env vars (`CONVEX_DEPLOY_KEY`, `ANTHROPIC_API_KEY`, etc.)
4. Push to `main` = deploy de produção; qualquer PR = preview environment

CI sugerido (GitHub Actions): `typecheck` + `lint` + `format:check` + `build` em todo PR.

---

## Licença

Projeto pessoal. Sem licença pública por enquanto.
