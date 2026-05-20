# Convex setup — Protocolo 5M

Esse documento explica como ativar o backend Convex (Fase 3) na sua máquina.
A Fase 3 entrega **todo o servidor pronto** (schema, queries, mutations, migration).
O wiring client-side acontece na Fase 4 junto com auth.

> **Por que duas fases separadas?** O comando `convex dev` precisa autenticar
> na sua conta Convex e provisionar um deployment de dev. Esses passos exigem
> ação humana — não posso fazer no seu lugar.

---

## 1. Criar conta + deployment

```bash
# Cria conta gratuita (se ainda não tem)
# https://convex.dev/

# A partir da raiz do projeto:
pnpm convex:dev
```

Na primeira execução o CLI vai:

1. Abrir o navegador pra login no convex.dev
2. Perguntar o nome do projeto — sugiro `protocolo-5m`
3. Escolher um deployment de dev (free tier)
4. Gerar `convex/_generated/` com os tipos TS dos seus schemas/funções
5. Escrever `NEXT_PUBLIC_CONVEX_URL` e `CONVEX_DEPLOY_KEY` no `.env.local`
6. Iniciar o servidor de dev em watch mode (mantém `_generated/` em sincronia)

Deixe o `pnpm convex:dev` rodando numa aba — ele observa mudanças em `convex/*.ts`
e re-gera tipos automaticamente.

---

## 2. Conferir que o schema deu push

Abra o [dashboard Convex](https://dashboard.convex.dev/), selecione o projeto e veja
as 4 tabelas em **Data**:

- `profiles` (vazia)
- `checklistEntries` (vazia)
- `workouts` (vazia)
- `achievementsUnlocked` (vazia)

Em **Functions** você deve ver as queries e mutations agrupadas por arquivo:

- `profiles:ensureProfile`, `profiles:getProfile`
- `checklist:getDay`, `checklist:getRange`, `checklist:getStreak`, `checklist:getWeekAdherence`, `checklist:toggleItem`
- `workouts:listRecent`, `workouts:getPreviousBest`, `workouts:getAllPRs`, `workouts:suggestNext`, `workouts:finishWorkout`
- `achievements:list`, `achievements:checkAndUnlock`
- `migrations:importLocalStorage`

---

## 3. Modelo de dados

```
profiles (1) ──< checklistEntries (N)
              \─< workouts (N)
              \─< achievementsUnlocked (N)
```

**Identidade temporária:** cada profile é chaveado por `deviceId` (string gerada
no client, persistida no localStorage). Quando a Fase 4 chegar, adicionamos
`userId` (vindo do Convex Auth) e migramos o `deviceId` → `userId`. Os dados
permanecem porque o `profileId` (PK interna) não muda.

**Validação de input:** todas as funções validam `deviceId` via `v.string()`,
mas como qualquer cliente conhece o ID, isso **não é segurança** — só sanidade
de schema. A segurança real vem na Fase 4 com auth.

---

## 4. Variáveis de ambiente

`.env.local` (gitignored):

```env
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=...
```

Em produção (Vercel — Fase 6), as mesmas vars vão como **Project Settings →
Environment Variables**. O `CONVEX_DEPLOY_KEY` é só pro CLI fazer deploy; o
runtime do app usa só o `NEXT_PUBLIC_CONVEX_URL`.

---

## 5. Próximos passos (Fase 4)

Quando avançarmos pra Fase 4:

1. Adicionar provider Convex no `app/layout.tsx` (`ConvexProvider`)
2. Criar `lib/useConvexStore.ts` espelhando a API de `useStore.ts`
3. Criar `lib/useDataStore.ts` — switch entre localStorage e Convex
   dependendo se `NEXT_PUBLIC_CONVEX_URL` está setado
4. Botão "Migrar dados deste dispositivo" no settings (chama `migrations:importLocalStorage`)
5. Auth via Convex Auth ou Clerk

---

## 6. Comandos úteis

```bash
pnpm convex:dev      # watch mode, gera _generated/ e faz push
pnpm convex:codegen  # só regenera _generated/ sem push (offline)
pnpm convex:deploy   # push pro deployment de produção
```

---

## 7. Troubleshooting

**"Cannot find module './_generated/server'"**
→ Rode `pnpm convex:dev` ao menos uma vez pra gerar o folder.

**"Schema validation failed"**
→ Edite `convex/schema.ts`. Convex emite o erro exato (tabela, campo, tipo).

**Quero resetar o banco**
→ Dashboard → Data → ⋯ → "Clear all tables". Ou `npx convex run --type=mutation`
pra rodar mutations ad-hoc.

**Convex tá lento em dev**
→ O free tier tem limite de 1M function calls/mês. Em desenvolvimento normal
não chega perto. Se chegar, veja `dashboard.convex.dev/[project]/usage`.
