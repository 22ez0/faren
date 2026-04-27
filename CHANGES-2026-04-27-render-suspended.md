# Render suspendeu o `faren-api` — Free Tier Usage Exceeded

**Data:** 2026-04-27 10:26 UTC (descoberto às ~12:00 UTC do mesmo dia)
**Severidade:** 🔴 site fora do ar (`api.faren.com.br` → HTTP 503)
**Banco de dados:** ✅ intacto (`faren-db` continua `available`, **sem suspensão**)

---

## 1. Sintoma

`https://api.faren.com.br/api/healthz` e
`https://faren-api-wn1z.onrender.com/api/healthz` retornam **HTTP 503**. Como
o frontend (GitHub Pages) depende 100% dessa API pra login, perfis, likes,
etc., o site faren.com.br fica praticamente fora do ar (carrega o shell mas
nenhuma chamada API responde).

## 2. Causa raiz

Eventos do `faren-api` lidos via Render API:

```
2026-04-27T10:26:39Z  service_suspended    {}
2026-04-27T10:26:39Z  suspender_added      {"actor":"Free Tier Usage Exceeded"}
```

E todos os **23 outros serviços** da mesma conta Render aparecem com
`suspended` + `suspenders: ["billing"]`. Lista (com prefixo `srv-`):

```
faren-api, adilsonstore, seru, selfbot-discord-purge, discord-rich-presence,
discord-bot-nuke, discord-bot-nuke-1, nuke cupula, mitmproxy-telegram-notifier,
telegram-spotify-bot (×4), spotify-oauth-server, laveyanism-telegram-bot (×2),
discord-bot-clp, discord-bot-render-2025, discord-bot-eixo, eixobot (×3),
471-bot
```

**Por que isso acontece:** o plano Free do Render dá **750h/mês de compute por
conta** (não por serviço). A conta tem 23 web services rodando. Mesmo que cada
um durma rapidamente, somando 23 serviços que ficam de pé pelo menos parte do
tempo, é trivial estourar 750h num mês. Quando estoura, **o Render suspende
TODOS os web services da conta de uma vez** até o próximo ciclo de cobrança
ou até o usuário adicionar um cartão.

## 3. O que NÃO dá pra fazer via API

- `POST /v1/services/{id}/resume` retorna **400** com `"only services
  suspended by a user can be resumed"` — suspensão por billing/usage só pode
  ser desfeita do dashboard do Render pelo dono da conta.
- Não existem endpoints públicos `/owners/.../usage`, `/owners/.../billing`,
  `/owners/.../payment-methods` nem `/owners/.../invoices` (todos retornam 404).
- Render não expõe quanto da cota foi consumido via API.

## 4. O que dá pra fazer (pelo dono da conta)

Em ordem do mais simples ao mais robusto:

### Opção A — Reativar agora, mantendo plano Free
1. Entra em https://dashboard.render.com
2. Vai em **Billing** → adiciona um cartão de crédito (não cobra nada
   imediatamente, só desbloqueia o limite Free).
3. Os serviços voltam automaticamente. **Mas** vai suspender de novo no fim
   do mês se não fizer mais nada — o limite Free continua valendo.

### Opção B — Upgrade só do `faren-api` (mais barato e estável)
1. Mesmo passo da Opção A pra cartão.
2. Em `faren-api` → Settings → **Instance Type: Starter ($7/mês)**.
3. Resultado: o `faren-api` deixa de contar pro limite Free e **não suspende
   mais nem por inatividade** (cold start some também).
4. **Faltaria também o Postgres**: o `faren-db` Free expira em **2026-05-16**
   (~19 dias) e some com tudo dentro. Upgrade pra Postgres Starter ($7/mês)
   resolve isso. Total: **~$14/mês** pra ter o Faren rodando 24/7 sem risco
   de expiração ou suspensão.

### Opção C — Sair do Render
- **Backend** → migrar pra Fly.io (free tier permite 1 app pequeno grátis,
  Postgres incluso) ou Railway ($5 grátis/mês). Já temos `Dockerfile`-friendly
  setup e `pnpm` build no api-server, dá pra portar em algumas horas.
- **Postgres** → migrar pra Neon (free tier permanente, sem expiração de 30
  dias) — restore do dump em `backups/faren-db-*.sql.gz` que o pipeline diário
  já gera.
- **Frontend** continua igual no GitHub Pages.

### Opção D — Hospedar o api-server no próprio Replit
- Replit tem deployments próprios (Reserved VM ou Autoscale) que rodam o
  monorepo direto. Custo similar ao Render Starter mas tudo num lugar só
  (mesmo workspace que o agente já enxerga).

## 5. Estado atual

| Componente | Estado |
|---|---|
| `faren-api` (Render web) | 🔴 suspended (Free Tier Usage Exceeded) — site fora do ar |
| `faren-db` (Render postgres) | 🟢 available, **dados intactos** — mas expira 2026-05-16 |
| Frontend `faren.com.br` (GitHub Pages) | 🟡 carrega, mas todas as chamadas pra API dão 503 |
| Cloudflare Worker `faren-og-worker` | 🟢 rodando, mas só passa 503 do origin adiante |
| Backup mais recente | `backups/faren-db-20260426T103629Z.sql.gz` (21 MB, 19 users + 19 profiles) |

## 6. O que **não** posso resolver daqui

A suspensão é decisão da plataforma Render contra a conta inteira. **Nenhuma
mudança de código no Faren resolve isso** — precisa ação do dono da conta no
dashboard do Render. Documentei todas as opções aqui pra o dono escolher e
agir.
