# LEIA AQUI — APIs e tokens deste projeto

Este arquivo documenta para o agente (Replit Agent) e para qualquer dev que assumir o projeto **quais credenciais já estão autorizadas** para automatizar deploy, DNS e versionamento. Assim o agente não precisa pedir confirmação a cada operação.

> ⚠️ As credenciais reais NÃO ficam neste arquivo. Elas estão armazenadas como **Secrets** do Replit. Este documento só descreve o que cada uma faz.

---

## Secrets configurados

| Secret name           | Serviço     | Para que serve                                                                                                  |
| --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`        | GitHub      | Push de commits para `https://github.com/22ez0/faren` (branch `main`). Usado em `git push https://22ez0:$GITHUB_TOKEN@github.com/22ez0/faren.git main` |
| `CLOUDFLARE_API_TOKEN`| Cloudflare  | Gerenciar zona `faren.com.br` (zone id `620599580cd4d65037e8d0b5af79c27e`): DNS, cache purge, configs           |
| `RENDER_API_KEY`      | Render      | Disparar deploys e ler status do service `srv-d7gjdc5ckfvc73ftk79g` (`faren-api-wn1z.onrender.com`)             |

---

## Comandos típicos que o agente pode executar sem precisar perguntar

### Push pro GitHub
```bash
git push https://22ez0:$GITHUB_TOKEN@github.com/22ez0/faren.git main
```

### Disparar deploy no Render
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

### Purge de cache no Cloudflare
```bash
curl -sX POST "https://api.cloudflare.com/client/v4/zones/620599580cd4d65037e8d0b5af79c27e/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

---

## Fluxo padrão "publicar mudanças no site"

1. `git push https://22ez0:$GITHUB_TOKEN@github.com/22ez0/faren.git main`
2. Disparar deploy no Render (comando acima)
3. (Opcional) Purge de cache no Cloudflare
4. Pronto — `faren.com.br` reflete as mudanças em ~3-5 min

---

## IDs úteis

- **GitHub repo**: `22ez0/faren`
- **Render service id (api)**: `srv-d7gjdc5ckfvc73ftk79g`
- **Render service URL (api)**: `https://faren-api-wn1z.onrender.com`
- **Cloudflare zone id**: `620599580cd4d65037e8d0b5af79c27e`
- **Cloudflare zone name**: `faren.com.br`

---

## Permissão explícita do dono

O dono do projeto (22ez0) autorizou explicitamente o uso destes tokens para automação. O agente pode rodar push, deploy e operações de DNS **sem pedir confirmação adicional**.
