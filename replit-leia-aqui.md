# LEIA AQUI — Deploy, APIs e tokens deste projeto

Este arquivo documenta para o agente (Replit Agent) e para qualquer dev que assumir o projeto **como o deploy do Faren funciona** e **quais credenciais já estão autorizadas** para automatizar deploy, DNS e versionamento. Assim o agente não precisa pedir confirmação a cada operação.

> ⚠️ As credenciais reais NÃO ficam neste arquivo. Elas estão armazenadas como **Secrets** do Replit. Este documento só descreve o que cada uma faz.

---

## Como o deploy funciona (visão geral)

O Faren tem duas peças em produção:

| Peça        | Onde roda                  | Como é deployado                                                              |
| ----------- | -------------------------- | ------------------------------------------------------------------------------ |
| **Frontend** (`artifacts/faren`) | **GitHub Pages** (CNAME `faren.com.br`) | GitHub Action `.github/workflows/deploy-frontend.yml` builda e publica em todo push pra `main` |
| **API / Backend** (`artifacts/api-server`) | **Render** (`faren-api-wn1z.onrender.com`) | Render está conectado ao repo e tem `autoDeploy: true` no `render.yaml` — auto-deploya em todo push pra `main` que toque `artifacts/api-server/**`, `lib/**`, `pnpm-lock.yaml` ou `render.yaml` |

**Cloudflare** é usado **apenas como DNS + CDN/proxy** da zona `faren.com.br`. **Não há Cloudflare Worker** — a única coisa que rodamos no Cloudflare é o DNS apontando `faren.com.br` → GitHub Pages e `api.faren...` → Render. Por isso, depois de um deploy, geralmente basta um **purge de cache** no Cloudflare pra a mudança aparecer rápido.

### Fluxo padrão "publicar mudanças no site"

1. **Commit + push pra `main`** no GitHub → dispara automaticamente:
   - GitHub Action que builda o frontend e publica no GitHub Pages
   - Webhook do Render que rebuilda e republica a API (se mexeu em arquivos de backend)
2. **(Opcional)** Purge de cache no Cloudflare pra o `faren.com.br` atualizar imediatamente
3. Pronto — em ~2-5 min `faren.com.br` reflete as mudanças

---

## Secrets configurados

| Secret name           | Serviço     | Para que serve                                                                                                  |
| --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`        | GitHub      | Push de commits para `https://github.com/22ez0/faren` (branch `main`). Usado em `git push https://22ez0:$GITHUB_TOKEN@github.com/22ez0/faren.git main` |
| `CLOUDFLARE_API_TOKEN`| Cloudflare  | Gerenciar zona `faren.com.br` (zone id `620599580cd4d65037e8d0b5af79c27e`): DNS, cache purge, configs           |
| `RENDER_API_KEY`      | Render      | Disparar deploys e ler status do service `srv-d7gjdc5ckfvc73ftk79g` (`faren-api-wn1z.onrender.com`)             |

---

## Comandos típicos que o agente pode executar sem precisar perguntar

> ⚠️ **Importante:** comandos de **git que escrevem** (`git add`, `git commit`, `git push`, `git reset`, etc.) são **bloqueados pelo agente principal** por segurança. Pra fazer um push, o agente precisa criar uma **Project Task** em background — só ela tem permissão pra essas operações. Os comandos `curl` pra Render/Cloudflare abaixo funcionam normalmente.

### Push pro GitHub (via Project Task em background)
```bash
git add -A
git commit -m "mensagem"
git push https://22ez0:$GITHUB_TOKEN@github.com/22ez0/faren.git main
```
Após o push:
- O workflow `deploy-frontend.yml` builda e publica `faren.com.br` no GitHub Pages
- Se o push tocou `artifacts/api-server/**`, `lib/**`, `pnpm-lock.yaml` ou `render.yaml`, o Render auto-deploya a API

### Disparar deploy manual no Render (sem precisar de novo push)
```bash
curl -sX POST "https://api.render.com/v1/services/srv-d7gjdc5ckfvc73ftk79g/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache":"do_not_clear"}'
```

### Ver status do último deploy do Render
```bash
curl -s "https://api.render.com/v1/services/srv-d7gjdc5ckfvc73ftk79g/deploys?limit=1" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Listar registros DNS no Cloudflare
```bash
curl -s "https://api.cloudflare.com/client/v4/zones/620599580cd4d65037e8d0b5af79c27e/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### Purge de cache no Cloudflare (após deploy)
```bash
curl -sX POST "https://api.cloudflare.com/client/v4/zones/620599580cd4d65037e8d0b5af79c27e/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

---

## Arquivos de configuração de deploy (no repo)

- **`.github/workflows/deploy-frontend.yml`** — builda `@workspace/faren` com `VITE_API_URL=https://faren-api-wn1z.onrender.com` e publica em `gh-pages` com CNAME `faren.com.br`
- **`.github/workflows/deploy-backend.yml`** — só notifica que o Render auto-deploya (o deploy real é via webhook nativo do Render); roda quando muda `artifacts/api-server/**`, `lib/**`, `pnpm-lock.yaml` ou `render.yaml`
- **`render.yaml`** — define o service `faren-api` (Node, região Oregon, plano free, healthcheck `/api/healthz`, banco Postgres `faren-db` e todas as env vars de produção)

---

## IDs úteis

- **GitHub repo**: `22ez0/faren` (branch principal: `main`)
- **GitHub Pages CNAME**: `faren.com.br`
- **Render service id (api)**: `srv-d7gjdc5ckfvc73ftk79g`
- **Render service URL (api)**: `https://faren-api-wn1z.onrender.com`
- **Render Postgres (db)**: `faren-db` (definido no `render.yaml`)
- **Cloudflare zone id**: `620599580cd4d65037e8d0b5af79c27e`
- **Cloudflare zone name**: `faren.com.br` (uso: DNS + CDN — **não** há Worker)

---

## Permissão explícita do dono

O dono do projeto (22ez0) autorizou explicitamente o uso destes tokens para automação. O agente pode rodar push (via Project Task), deploy manual no Render e operações de DNS/purge no Cloudflare **sem pedir confirmação adicional**.
