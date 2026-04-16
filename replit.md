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
- **Discord rich integration** — status badge (online/idle/dnd/offline), activity, avatar sync
- **Music tracking** — Now Playing widget with Spotify/Last.fm integration
- Followers, likes, views social system (show/hide view count toggle)
- Badge system — Verified, Creator, Gamer, Developer, Streamer, Artist, etc.
- Analytics dashboard (views by day/week/month, top countries)
- Trending profiles discovery page
- Dark mode, pure black theme (keefnow.com.br aesthetic)

### Routes
- `/` — Landing page with hero and trending profiles
- `/login` — Auth login (glassmorphism card)
- `/register` — Registration with username validation
- `/:username` — Public profile page
- `/dashboard` — Stats & analytics dashboard
- `/dashboard/edit` — Live profile editor (split-screen)
- `/discover` — Trending profiles grid

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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
