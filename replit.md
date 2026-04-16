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
- Token is stored in `localStorage` as `adminToken`
- Admin panel can search users, ban/unban, grant/revoke verified badge, and view registration/last-login IPs.

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
