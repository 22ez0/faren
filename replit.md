# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: Faren

**Faren** is a personalized profile platform inspired by guns.lol with the visual design of keefnow.com.br. Pure black backgrounds, massive bold uppercase typography, solid + outline text, minimal tracked-letter buttons.

### Key Features
- Personalized user profiles with custom colors, backgrounds, badges, social links
- **Live preview** while editing profile (split-screen editor with 4 tabs)
- **Particle effects** — snow, stars, sakura, fireflies, bubbles, rain
- **Click effects** — hearts, stars, sparkles, explosions on cursor click
- **Custom fonts** — default (Inter), mono, cursive, serif, pixel (8-bit)
- **Typewriter text** — cycles through custom texts with animated typing
- **Layout styles** — centered or left-aligned profile layout
- **Background types** — image/GIF, video/GIF, or solid color with opacity + blur controls
- **Avatar/banner media** — image, GIF, or video; videos autoplay muted in loop
- **Discord rich integration** — status badge, activity, avatar sync, Nitro/boost flags, visibility toggles
- **Music tracking** — Now Playing widget with Spotify/Last.fm integration plus custom title/icon/GIF/private mode for live music
- **Social links** — public profile displays links as transparent logo-only icons
- Followers, likes, views social system (show/hide view count toggle)
- Badge system — predefined badges plus custom emoji/color badges, max 6 user-selected badges active
- Analytics dashboard (views by day/week/month, top countries)
- Trending profiles discovery page
- Dark mode, pure black theme (keefnow.com.br aesthetic)
- Admin moderation panel at `/devkeefnow` and `/keefaren`
- Footer credits Faren and links Keefnow to `https://keefnow.com.br`
- **3-tier verification badges**: blue (verified), gold (verified_gold), white (verified_white) — Instagram-style SVG badges with glow
- **Open Graph meta tags**: site-level in index.html + dynamic per-profile on page load + `/api/og/:username` endpoint for bots/crawlers
- **Save login**: token stored in both localStorage AND a 30-day cookie (`faren_token`) for redundancy
- **Spotify player**: height=152 (full player, not compact) with support for tracks, playlists, and albums
- **Follow button**: transparent with rounded-full borders (both Follow and Following states)

### Routes
- `/` — Landing page with hero and trending profiles
- `/login` — Auth login (glassmorphism card)
- `/register` — Registration with username validation
- `/:username` — Public profile page
- `/dashboard` — Stats & analytics dashboard
- `/dashboard/edit` — Live profile editor (split-screen)
- `/discover` — Trending profiles grid
- `/devkeefnow` — Private admin/moderation panel (not linked in nav)
- `/keefaren` — Alias for admin panel (faren.com.br/keefaren)
- GitHub Pages custom domain is configured with `artifacts/faren/public/CNAME` as `faren.com.br`
- GitHub Pages SPA deep links use `artifacts/faren/public/404.html` + `index.html` redirect script to preserve routes like `/keefaren`

### Deployment (GitHub + Render)
- **GitHub repo**: https://github.com/22ez0/faren
- **GitHub username**: 22ez0
- **Frontend**: GitHub Pages → faren.com.br (auto-deploys on push to main via `.github/workflows/deploy-frontend.yml`)
- **Backend (API)**: Render → https://faren-api.onrender.com (auto-deploys via `.github/workflows/deploy-backend.yml` + `render.yaml`)
- **Render setup**: Import repo at render.com/new, pick "Blueprint" and select `render.yaml` — it will create the web service + PostgreSQL database automatically
- **GitHub Actions secrets needed**: `RENDER_DEPLOY_HOOK_URL` (from Render dashboard → service → deploy hook URL)
- **DNS for faren.com.br**: Add CNAME record pointing `www` → `22ez0.github.io` and A records for apex (185.199.108-111.153.153.153) → GitHub Pages IP addresses
- **Portability**: All configuration is in env vars (`.env.example`). Switching hosts = change `DATABASE_URL`, `SESSION_SECRET`, `CORS_ALLOWED_ORIGINS`, `VITE_API_URL`

### Admin Access
- Admin route: `/devkeefnow`
- Default admin login: `keefaren`
- Default admin password: `Hungria2021@`
- Token is stored in `localStorage` as `adminToken` (expires 7 days — auto-clears on 401 and forces re-login)
- Admin panel can search users, ban/unban, grant/revoke 3 types of verified badge (blue/gold/white), and view registration/last-login IPs.

### Media Uploads — Cloudflare R2 (IMPORTANT)
**Todos os uploads de mídia do Faren vão para Cloudflare R2.** Nada de mídia é salvo em base64 no Postgres.

- **What goes to R2**: avatars, banners, profile backgrounds, music files (mp3/m4a/ogg/wav/webm), and custom music icons. Anything the user uploads via the editor.
- **Server**: `artifacts/api-server/src/lib/r2.ts` configures an S3 client pointing to `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`. `uploadBuffer({ buffer, mime, prefix })` uses sha256 of the file contents to produce a content-addressed key (`<prefix>/<userId>/<sha256>.<ext>`) — same file = same key, no duplicate uploads. `Cache-Control: public, max-age=31536000, immutable` is set since URLs change when content changes.
- **Upload route**: `POST /api/profile/upload?prefix=avatars|banners|backgrounds|music|icons` (multipart/form-data, requires JWT). Max 50MB per file. Returns `{ url }` pointing to `R2_PUBLIC_URL/<key>`.
- **Public URLs**: served from the public R2 bucket URL configured in `R2_PUBLIC_URL` (e.g. `https://cdn.faren.com.br` or `https://pub-xxxx.r2.dev`).
- **Required env vars** (Render + local): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`. If `R2_BUCKET` or `R2_ACCESS_KEY_ID` is missing, the upload route returns 503 and the legacy `maybeUploadDataUri` fallback keeps any inline data URI as-is in the DB.
- **Frontend**: `artifacts/faren/src/pages/dashboard/edit.tsx` uses the `FileOnlyUpload` component which `POST`s the file to `/api/profile/upload` and writes only the resulting R2 URL into the form state. The hidden `<input type="file">` is reset (`value = ''`) both when the picker is opened and after `handleChange` so re-picking the same file always re-triggers the upload.
- **Legacy migration**: existing base64 data URIs in `profiles.banner_url`, `profiles.background_url`, `users.avatar_url`, `profiles.music_url`, `profiles.music_icon_url` can be migrated to R2 with `tsx artifacts/api-server/src/scripts/migrate-base64-to-r2.ts` (reads each row, decodes the data URI, uploads to R2, replaces the column with the public URL).

### Security Notes
- Express JSON/body limit is 75mb to allow larger profile media saves.
- Registration is IP-rate-limited to 5 accounts/hour per IP.
- User registration and last login IPs are stored.
- Banned users cannot log in and public banned profiles return not found.
- Email verification and password reset token endpoints exist; outbound email still needs an email provider integration.
- `profile_views` stores IP address and user agent for analytics/moderation.
- API supports production CORS allowlisting via `CORS_ALLOWED_ORIGINS` and defaults to `https://faren.com.br,https://www.faren.com.br`.
- API includes production security headers, IP-based request throttling, and optional bot/user-agent blocking (`ENABLE_BOT_BLOCKING=false` disables it).

### Demo Accounts (password: `password123`)
- `demo@faren.com` → username: `xdemo`
- `neon@faren.com` → username: `neonwolf` (with Discord: idle, "Playing Valorant")
- `pixel@faren.com` → username: `pixeldream`
- `cyber@faren.com` → username: `cyberkat` (with Discord: dnd)
- `void@faren.com` → username: `voidwalker`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/faren run dev` — run frontend locally

## Important Notes

- After running codegen, fix `lib/api-zod/src/index.ts` to only export from `./generated/api` (not `./generated/types` — this causes conflicts)
- Dark mode is applied via `document.documentElement.classList.add("dark")` in `main.tsx`
- JWT auth token stored in `localStorage` via `setAuthTokenGetter` from api-client-react
- Frontend supports external production API hosting through `VITE_API_URL`; this is required for GitHub Pages because GitHub Pages cannot run the Express API or PostgreSQL database.
- After any DB schema change, run `pnpm --filter @workspace/db run push`
- Pending production integrations: Discord OAuth, Spotify OAuth, and email sending provider for verification/reset emails

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Workflows ativos no workspace (configurados 2026-04-26)

- **`API Server (dev-proxy)`** — `node artifacts/api-server/dev-proxy.mjs` na porta `8080`. Proxy HTTP local que repassa `/api/*` para `https://api.faren.com.br` (Cloudflare → Render) com `User-Agent: faren-replit-dev-proxy/1.0`. **Não sobe o Express real** — só repassa, então o preview enxerga dados reais da prod.
- **`Faren Web`** — `PORT=5000 pnpm --filter @workspace/faren run dev` na porta `5000`. Vite dev server do frontend. Como o `vite.config.ts` tem proxy `/api → https://api.faren.com.br`, qualquer request da UI vai pra prod via Cloudflare também.

Resultado: o preview do workspace mostra o site **igual `faren.com.br`** com dados ao vivo (perfis, trending, likes, views) lendo do Postgres do Render através do Cloudflare. Sem schema local, sem seed, sem dependência da R2 local.

## Live Cloud Inventory (verified 2026-04-26 via Cloudflare global key + Render API)

### Cloudflare account
- **Account**: `Vgss.lly@gmail.com's Account` (id `5a9a17dc69ada45f32c4aa36d4e8fdd9`, owner `vgss.lly@gmail.com`, 2FA OFF, plan Free)
- **Single zone**: `faren.com.br` (id `620599580cd4d65037e8d0b5af79c27e`, status active, type full, NS `gannon.ns.cloudflare.com` + `shubhi.ns.cloudflare.com`, original NS at `b/c.sec.dns.br`)
- **DNS** (10 records): apex `faren.com.br` → 4× GitHub Pages A records (proxied), `www` → `22ez0.github.io` (proxied), `api.faren.com.br` → `faren-api-wn1z.onrender.com` (proxied), plus Resend email (`send.faren.com.br` MX/TXT, `resend._domainkey` DKIM) and `_discord.faren.com.br` TXT
- **Cloudflare Worker (DEPLOYED, contradicts older docs)**: `faren-og-worker` running on route `faren.com.br/*`. Code (compatibility 2024-01-01, no bindings) does THREE things:
  1. Proxies `/api/*` to `https://faren-api-wn1z.onrender.com` with edge cache (90s for `/api/discover/trending`, 20s for `/api/users/:u`, fixes CORS for `*.faren.com.br` origins, uses `X-Edge-Cache: HIT/MISS` header)
  2. Detects social-bot UAs on `/{username}` profile paths and SSR-fetches `${API}/${username}` for OG previews (`cache-control: public, max-age=60, swr=300`)
  3. `scheduled()` keep-alive ping every ~14 min to `${API}/api/discover/trending?limit=1` to dodge Render free cold start
- **Cache Rules ruleset** (id `92b59739dd254ee8813db04ed79f6e0d`, exposed as env `CACHE_RULESET_ID`): 2 rules — `/api/users/*` (edge 20s, browser bypass) and `/api/discover/*` (edge 60s, browser 30s). NOTE: the Worker's per-path cache mostly supersedes these, but they coexist.
- **R2**: bucket `faren-media` (location ENAM, created 2026-04-23). Public domain `pub-49759bd8e09c4e0b89e475d23d273d2f.r2.dev` enabled. CORS not configured. R2 access keys are NOT in Replit Secrets — backend in production has them via Render env (DATABASE_URL/RESEND_API_KEY/TURNSTILE_SECRET_KEY/etc are all set), but local backend cannot upload to R2 without them.
- **Pages**: 1 project `faren` at `faren.pages.dev` (created 2026-04-19) — appears unused (deployment metadata returns null). Production frontend serves via GitHub Pages, not this.
- **Turnstile**: 1 widget `faren-prod`, sitekey `0x4AAAAAADCou66RkKmd1DwX` (managed mode, world region), domains `faren.app`, `faren.com.br`, `www.faren.com.br`. Secret is set in Render as `TURNSTILE_SECRET_KEY`.
- **Email Routing**: zone has the routing config object created but `enabled: false` and `status: unconfigured` (missing MX/SPF/DKIM Cloudflare records — the existing email DNS is for Resend/SES, not CF Routing). Default rule "drop all" is disabled.
- **Zone settings worth noting**: SSL `full`, TLS 1.3 on, HTTP/3 on, IPv6 on, brotli on, automatic_https_rewrites on. **Security gaps**: `min_tls_version=1.0` (should be 1.2+), `always_use_https=off` (should be on for production), `security_level=medium`. No legacy Page Rules, no Firewall Rules, no Lockdowns, no Rate Limits — all caching/security goes through the new Rulesets engine and Worker.
- **No** KV namespaces, **no** D1 databases, **no** Stream videos, **no** Workers AI bindings, **no** custom Workers Routes besides `faren.com.br/*` → `faren-og-worker`.
- **Existing API tokens** (4 total, listable but values not retrievable): `atualização faren 1` (DNS+Zone+Cache+Pages+Workers Write, last used 2026-04-24), `Cloudflare Agent Token - 2026-04-23` (×2, broad read-only across account), `faren-deploy-agent` (Cache Purge + DNS Write on faren.com.br only — this is the dedicated `CLOUDFLARE_PURGE_TOKEN` value used in GitHub Actions).

### Render account
- **Single team**: `My Workspace` (id `tea-d2s4fh3e5dus73cpehkg`, owner `vgss.lly@gmail.com`)
- **23 services total** (all free tier, all in Oregon). Faren-related: `faren-api` (id `srv-d7gjdc5ckfvc73ftk79g`, slug `faren-api-wn1z`, Node, autoDeploy ON from `22ez0/faren#main`, healthcheck `/api/healthz`, custom domains `api.faren.com.br` verified + `faren.com.br`/`www.faren.com.br` unverified-with-redirect-to-apex, last deploy `live` for commit `64fd5630` at 2026-04-26 04:05 UTC, ssh `srv-d7gjdc5ckfvc73ftk79g@ssh.oregon.render.com`).
- **Other services in this account** (NOT part of Faren — bots/experiments owned by 22ez0): `adilsonstore`, `seru`, `selfbot-discord-purge`, `discord-rich-presence`, `discord-bot-nuke` (×3 incl. `nuke-cupula` rust + `discord-bot-nuke-1` python), `mitmproxy-telegram-notifier` (docker), `telegram-spotify-bot` family (×4), `laveyanism-telegram-bot` (×2), `discord-bot-clp`, `discord-bot-render-2025`, `eixobot` family (×3, mostly suspended). 6 are currently `suspended` (`spotify-oauth-server`, `discord-bot-eixo`, `eixobot`, `eixobot-1`, `471-bot`).
- **Postgres `faren-db`** (id `dpg-d7gjd1tckfvc73ftjvr0-a`, free, region oregon, version 18, status `available`, db `faren`, user `faren`, IP allowlist `0.0.0.0/0`). **⚠️ EXPIRES 2026-05-16** (~20 days from now — Render free Postgres lasts 30 days then is deleted; need to upgrade or back up + recreate).
- **No** Redis/KV stores, **no** env groups.
- **`faren-api` production env vars** (15 total): `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_SECRET`, `ADMIN_LOGIN=keefaren`, `ADMIN_PASSWORD`, `NODE_ENV=production`, `PORT=10000`, `CORS_ALLOWED_ORIGINS` (includes the Replit picard.replit.dev preview URL — should be cleaned out for prod hygiene), `RATE_LIMIT_WINDOW_MS=60000`, `RATE_LIMIT_MAX=300`, `ENABLE_BOT_BLOCKING=true`, `EMAIL_FROM=Faren <no-reply@faren.com.br>`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`. NOTE: **R2_* env vars are NOT in `render.yaml` nor in the live env** — the production backend currently does not have R2 credentials wired in either. Either R2 uploads are silently failing in prod (503 path) or the env was set outside `render.yaml` and dropped, or it's added at runtime somewhere else. Worth verifying before adding new upload features.

### GitHub
- **Repo**: `22ez0/faren` (default branch `main`, public Pages built with CNAME `faren.com.br`, https enforced, custom 404 enabled)
- **Repo secrets** (3): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_PURGE_TOKEN`, `CLOUDFLARE_ZONE_ID`. Notably **`RENDER_API_KEY` is NOT set as a repo secret** — `deploy-backend.yml` already handles this gracefully (just emits a warning and skips the polling-for-failure step), but if you want the auto-issue-on-Render-deploy-failure feature, that secret needs to be added.
- **3 workflows** active: `deploy-backend.yml`, `deploy-frontend.yml`, `monitor-api-health.yml`. Latest 3 runs all `Monitor API Health` → success.
- **Open issues**: 0 (no `api-down`, `render-deploy-failure`, or `cloudflare-purge-failure` alerts at the moment).

### Fixes applied 2026-04-26 (see `CHANGES-2026-04-26.md` for the full report)
- **TLS hardened**: `min_tls_version=1.2`, `always_use_https=on`, `tls_1_3=on`, `opportunistic_encryption=on` (verified — TLS 1.0/1.1 connections now refused).
- **R2 CORS configured** on bucket `faren-media` (faren.com.br + dev origins, methods GET/HEAD/PUT/POST/DELETE).
- **Render `CORS_ALLOWED_ORIGINS` cleaned** to `https://faren.com.br,https://www.faren.com.br` (removed picard.replit.dev).
- **`render.yaml` rewritten** to match live env and add R2/Resend/Turnstile placeholders as `sync: false`.
- **`cloudflare-worker.js` synced** in repo (was a 40-line stub; now matches the deployed `faren-og-worker` doing API proxy + edge cache + OG SSR + cron keepalive).
- **GitHub repo secrets added** (libsodium-encrypted PUTs): `RENDER_API_KEY`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID`, `PROD_DATABASE_URL`. Now 8 total.
- **DB backup pipeline**: `scripts/db-backup.sh` + `scripts/db-restore.sh` + `.github/workflows/db-backup.yml` (daily 03:00 UTC, retention 30 days, uses `postgresql-client-18` since the server is pg18). First manual backup saved at `backups/faren-db-20260426T103629Z.sql.gz` (21 MB, 13 tables, 18 users, 18 profiles, real prod data — gitignored, kept locally).
- **Push + redeploys triggered**: pushed `cf85600` to `origin/main` → GH Pages build + Render auto-deploy. Cloudflare cache purged (zone-wide).
- **R2 S3 keys — DONE 2026-04-26**: usuário criou o token no dashboard da Cloudflare e colou os valores. `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `CLOUDFLARE_R2_TOKEN` foram salvos como Replit Secrets (disponíveis em qualquer sessão deste workspace). As duas chaves S3 também foram aplicadas no Render via API (`PUT /v1/services/.../env-vars`) — preservando os 23 env vars existentes — e um redeploy foi disparado (`dep-d7mvo1cvikkc73b0rf6g`). Validei as credenciais com `HEAD /faren-media` na R2 (`200 OK`, `x-amz-bucket-region: ENAM`).
- **Upload bug fixed (race condition no Busboy) — DONE 2026-04-26**: rota `POST /api/profile/upload` (em `artifacts/api-server/src/routes/profiles.ts`) sempre devolvia `400 "Nenhum arquivo enviado."` mesmo quando o R2 recebia o arquivo. Causa: o handler `bb.on('finish')` checava só a flag `responded`, que só virava `true` **depois** do `await uploadBuffer()` resolver — ou seja, durante o upload assíncrono o `finish` corria e enviava `400` antes de o R2 terminar. Corrigi separando `fileReceived` (síncrono, marcado dentro de `bb.on('file')`) de `responded` (resposta já enviada), e fazendo o `bb.on('finish')` aguardar a `uploadInFlight` Promise quando há arquivo. Validado localmente (api-server em `:8090` com env de prod): PNG válido → 200 + URL R2; sem arquivo → 400 com mensagem certa; MIME inválido → 415. Fix está no commit local, ainda não pushado.
- **Migração base64 → R2 — DONE 2026-04-26**: rodei `tsx artifacts/api-server/src/scripts/migrate-base64-to-r2.ts all` contra o Postgres de prod. Tive que **remover** `import "dotenv/config"` do script (dotenv não é dependência do api-server) e usar `DATABASE_URL=…?sslmode=require` (lib/db usa `new Pool({connectionString})` sem config SSL extra). Resultado: 1/19 user avatars migrado, 0/19 profile backgrounds (já estavam todos como URLs externas). Banco agora tem 0 entradas em `data:` base64.
- **Fix de upload deployado em prod — DONE 2026-04-26 12:13 UTC**: commit `a0096224` empurrado para `origin/main` (push autenticado via `GITHUB_TOKEN` do workspace). Render disparou auto-deploy `dep-d7n01qt8nd3s73eb6hj0` que ficou `live` em ~1m30s. Smoke test em `https://api.faren.com.br/api/profile/upload?prefix=avatars` com JWT forjado (SESSION_SECRET de 44 bytes lido via Render API) e PNG real de 75 bytes: **HTTP 200**, devolveu `https://pub-49759bd8e09c4e0b89e475d23d273d2f.r2.dev/avatars/1/b201e2de7fd1a6ee.png`. HEAD na URL retornou 200 com `Content-Type: image/png` e `Cache-Control: public, max-age=31536000, immutable`. O caminho de erro "sem arquivo" continua devolvendo 400 com mensagem correta. Detalhes do diagnóstico em `CHANGES-2026-04-26-upload-fix.md`.
- **🔴 Render suspendeu o `faren-api` — 2026-04-27 10:26 UTC**: a conta inteira do Render foi marcada com `suspenders: ["billing"]` e o evento do `faren-api` mostra `actor: "Free Tier Usage Exceeded"`. Todos os 23 serviços da conta (`faren-api` + 22 bots de Discord/Telegram do mesmo dono) estão suspensos. `api.faren.com.br/api/healthz` → **HTTP 503**. `POST /v1/services/.../resume` da Render API retorna 400 (`"only services suspended by a user can be resumed"`) — suspensão por usage só pode ser revertida pelo dono da conta no dashboard. Postgres `faren-db` continua `available` (dados intactos), mas continua expirando em 2026-05-16. **Para nunca mais suspender**: opção mais barata é upgrade do `faren-api` pra Starter ($7/mês) + Postgres Starter ($7/mês) = ~$14/mês. Alternativas (migrar pra Fly.io+Neon, ou pra Replit Deployments) detalhadas em `CHANGES-2026-04-27-render-suspended.md`. **Ação requerida pelo dono da conta** — não dá pra resolver do Replit.

### Local env vars saved (shared environment, this workspace)
The non-sensitive metadata IDs above are now exposed as shared env vars so any local script can use them without hardcoding: `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_PUBLIC_URL`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID`, `RENDER_SERVICE_ID`, `RENDER_DB_ID`, `RENDER_OWNER_ID`, `GITHUB_OWNER`, `GITHUB_REPO`, `VITE_TURNSTILE_SITE_KEY`, `CACHE_RULESET_ID`. Plus the existing dev defaults: `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `ENABLE_BOT_BLOCKING=false`, `NODE_ENV=development`, `BASE_PATH=/`, `VITE_API_URL=https://faren-api-wn1z.onrender.com`, `CORS_ALLOWED_ORIGINS=*`.

Sensitive values that exist as Replit Secrets: `GITHUB_TOKEN`, `RENDER_API_KEY`, `CLOUDFLARE_GLOBAL_API_KEY` + `EMAIL_CLOUDFLARE` (used as the X-Auth-Email/X-Auth-Key pair — full-account access by design), `SESSION_SECRET`, `PROD_DATABASE`, `DATABASE_URL` (Replit-managed local Postgres), `PG*` (local Postgres connection split), **`R2_ACCESS_KEY_ID`**, **`R2_SECRET_ACCESS_KEY`**, **`CLOUDFLARE_R2_TOKEN`** (R2 S3 keys salvas em 2026-04-26 — também aplicadas no Render). **Not present locally** but used in production: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `ADMIN_SECRET` (prod value), `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_PURGE_TOKEN`.
