#!/bin/bash
# Runs automatically after a task-agent merge into main.
# Keeps the workspace + production database schemas in sync with the code.
set -e

echo "[post-merge] installing dependencies..."
pnpm install --frozen-lockfile

echo "[post-merge] pushing schema to LOCAL sandbox DB (DATABASE_URL)..."
pnpm --filter @workspace/db run push

if [ -n "${NEON_DATABASE_URL:-}" ]; then
  echo "[post-merge] pushing schema to PRODUCTION Neon DB (NEON_DATABASE_URL)..."
  # Override DATABASE_URL just for this command so drizzle.config.ts targets Neon.
  DATABASE_URL="$NEON_DATABASE_URL" pnpm --filter @workspace/db run push
  echo "[post-merge] production schema in sync."
else
  echo "[post-merge] NEON_DATABASE_URL not set — skipping production schema push."
fi
