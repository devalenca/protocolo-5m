# Deploy — GitHub + Vercel + Convex (free tier)

Esse doc é o passo a passo pra subir o Protocolo 5M em produção
**100% grátis**:

- **GitHub**: hosting do repo (público ou privado, ambos free)
- **Vercel**: hosting do frontend (plano Hobby — 100GB/mês)
- **Convex**: backend + DB + auth (free tier — 1M function calls/mês)

Total estimado: **R$ 0,00/mês** pra uso pessoal.

---

## Pré-requisitos

- [x] Conta GitHub
- [x] Conta Vercel (use "Continue with GitHub" pra economizar passos)
- [x] Conta Convex (já criada — você rodou `pnpm convex:dev` localmente)

---

## 1. Subir o projeto no GitHub

Como o repo ainda não foi inicializado:

```bash
cd D:\projects\Protocolo-5M

git init -b main
git add .
git commit -m "Protocolo 5M — Fase 4 completa"

# Crie um repo novo em https://github.com/new
# Sugestão de nome: protocolo-5m (privado se quiser, público pro portfólio)

git remote add origin https://github.com/<SEU_USUARIO>/protocolo-5m.git
git push -u origin main
```

> **Importante**: o `.gitignore` já está configurado pra não subir
> `node_modules`, `.next`, `.env.local`, `.convex/`, e o `_generated/`
> do Convex (que é regenerado em cada build).

---

## 2. Provisionar deployment de produção do Convex

Antes de conectar no Vercel, crie um deployment de **produção** separado
do seu dev:

```bash
npx convex deploy
```

Isso:
1. Pergunta se você quer criar um deployment prod (sim)
2. Faz push do schema + funções pro novo deployment
3. Imprime a URL prod (`https://<algo>.convex.cloud`)

Depois, pega a deploy key:

1. Vá em [dashboard.convex.dev](https://dashboard.convex.dev)
2. Selecione o projeto **protocolo-5m**
3. Settings → **Deploy Keys** → "Generate Production Deploy Key"
4. Copie a key — você vai colar no Vercel logo abaixo

---

## 3. Conectar no Vercel

1. Abra [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → selecione `protocolo-5m`
3. **Framework Preset**: Next.js (auto-detectado pelo `vercel.json`)
4. **Build Settings**: deixe os defaults (o `vercel.json` já tem o build
   command com `convex deploy`)
5. **Environment Variables** → adicione:

   | Name | Value | Environments |
   | --- | --- | --- |
   | `CONVEX_DEPLOY_KEY` | (cole a key do passo 2) | Production, Preview, Development |

   > Não precisa setar `NEXT_PUBLIC_CONVEX_URL` — o `convex deploy --cmd`
   > injeta automaticamente no build.

6. Clique **Deploy**

Primeiro build leva ~2-3min. Quando terminar, você ganha uma URL tipo:
`https://protocolo-5m.vercel.app`

---

## 4. Configurar SITE_URL no Convex prod

O Convex Auth precisa saber a URL final pra montar redirects de OAuth e
links de callback. Volte no dashboard Convex:

1. Selecione o deployment **prod** (não dev)
2. Settings → **Environment Variables**
3. Adicione `SITE_URL` = a URL do Vercel (`https://protocolo-5m.vercel.app`)
4. Se for usar domínio próprio depois, atualiza esse valor

Você também precisa setar `JWT_PRIVATE_KEY` e `JWKS` em prod. A forma mais
rápida é rodar localmente apontando pra produção:

```bash
npx @convex-dev/auth --prod
```

Isso gera novas keys (não reutiliza as de dev) e seta automaticamente.

---

## 5. Testar

Abra `https://protocolo-5m.vercel.app`:

- Modo anônimo deve funcionar (gera `deviceId` no localStorage)
- Marque um item do checklist → deve salvar no Convex prod
- Vá em **/login**, crie conta, valide que os dados foram claimados
- Logout / re-login → dados reaparecem

---

## 6. Adicionar à tela de início do iPhone

No Safari mobile, abra a URL:

1. Toque no botão **Compartilhar**
2. **Adicionar à Tela de Início**
3. O ícone aparece como app nativo

> Pra ficar **idêntico a app nativo** (splash screen, ícone arredondado,
> offline), precisamos da Fase 5 — manifest.json + service worker.
> Por enquanto abre com chrome do Safari mínimo (graças às meta tags
> `apple-mobile-web-app-capable`).

---

## 7. Domínio próprio (opcional)

Vercel permite adicionar domínio custom grátis:

1. Vercel project → **Settings** → **Domains**
2. Adicione o domínio (ex: `protocolo.suamarca.com.br`)
3. Aponte o DNS (CNAME → `cname.vercel-dns.com`)
4. Atualize `SITE_URL` no Convex pro novo domínio
5. Faça redeploy (Vercel → Deployments → ⋯ → Redeploy)

---

## 8. CI / preview environments

Sem nenhuma config extra:

- **Cada push em `main`** → deploy de produção
- **Cada PR** → deploy de preview com URL única
- Convex **não** faz auto-deploy em preview por padrão. Pra ter convex
  por branch, configure no [dashboard Convex → Settings → Branch
  Deployments](https://dashboard.convex.dev/) (já está no free tier).

---

## Troubleshooting

**Build falha: "Convex deploy failed"**
→ Verifique se `CONVEX_DEPLOY_KEY` está nas env vars do Vercel e usa o
deployment de **prod** (não dev).

**"NEXT_PUBLIC_CONVEX_URL is not defined" no runtime**
→ O `convex deploy --cmd` injeta essa var no processo do build. Se você
sobrescreveu o build command no Vercel, certifique que ainda usa
`npx convex deploy --cmd 'pnpm build'`.

**Auth: "INVALID_TOKEN" depois do login**
→ `SITE_URL` no Convex prod está errado. Deve ser exatamente a URL onde
o usuário acessa (incluindo `https://`, sem trailing slash).

**Performance baixa no Brasil**
→ `vercel.json` já tem `"regions": ["gru1"]` (São Paulo). Convex roda em
us-east-1 — latência fixa ~120ms via internet, normal.

**Free tier acabou (improvável em uso pessoal)**
→ Convex: dashboard → Usage. Vercel: dashboard → Usage. Você recebe
warning email antes de qualquer cobrança. Pra reduzir, debounce mutations
no client ou cache mais agressivo no Next.
