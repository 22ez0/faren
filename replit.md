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
- **Background types** — image, video, or solid color with opacity + blur controls
- **Discord rich integration** — status badge, activity, avatar sync, Nitro/boost flags, visibility toggles
- **Music tracking** — Now Playing widget with Spotify/Last.fm integration plus custom title/icon/private mode for live music
- Followers, likes, views social system (show/hide view count toggle)
- Badge system — Verified, Creator, Gamer, Developer, Streamer, Artist, etc.
- Analytics dashboard (views by day/week/month, top countries)
- Trending profiles discovery page
- Dark mode, pure black theme (keefnow.com.br aesthetic)
- Admin moderation panel at `/devkeefnow`

### Routes
- `/` — Landing page with hero and trending profiles
- `/login` — Auth login (glassmorphism card)
- `/register` — Registration with username validation
- `/:username` — Public profile page
- `/dashboard` — Stats & analytics dashboard
- `/dashboard/edit` — Live profile editor (split-screen)
- `/discover` — Trending profiles grid
- `/devkeefnow` — Private admin/moderation panel (not linked in nav)

### Admin Access
- Admin route: `/devkeefnow`
- Default admin login: `keefaren`
- Default admin password: `Hungria2021@`
- Token is stored in `localStorage` as `adminToken`
- Admin panel can search users, ban/unban, grant/revoke verified badge, and view registration/last-login IPs.

### Security Notes
- Express JSON/body limit is 25mb to allow large profile media saves.
- Registration is IP-rate-limited to 5 accounts/hour per IP.
- User registration and last login IPs are stored.
- Banned users cannot log in and public banned profiles return not found.
- Email verification and password reset token endpoints exist; outbound email still needs an email provider integration.
- `profile_views` stores IP address and user agent for analytics/moderation.

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
- After any DB schema change, run `pnpm --filter @workspace/db run push`
- Pending production integrations: Discord OAuth, Spotify OAuth, and email sending provider for verification/reset emails

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
