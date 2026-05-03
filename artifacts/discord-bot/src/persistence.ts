import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DATA_FILE = resolve(
  process.env.DATA_PATH ?? "./data/sessions.json"
);

export interface PersistedUser {
  token?: string;
  rpc?: {
    iconUrl?: string;
    statusType: "playing" | "watching" | "streaming";
    title: string;
    subtitle: string;
    detail: string;
    customUrl: string;
    buttonLabel?: string;
    buttonUrl?: string;
  };
}

type PersistedData = Record<string, PersistedUser>;

let cache: PersistedData = {};

export function loadPersistence(): PersistedData {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      cache = JSON.parse(raw) as PersistedData;
      console.log(`[persist] carregado: ${Object.keys(cache).length} usuário(s)`);
    }
  } catch (e: any) {
    console.warn("[persist] erro ao carregar:", e?.message);
    cache = {};
  }
  return cache;
}

export function getPersistedData(): PersistedData {
  return cache;
}

export function persistUser(userId: string, data: Partial<PersistedUser>): void {
  cache[userId] = { ...cache[userId], ...data };
  _save();
}

export function clearPersistedUser(userId: string): void {
  delete cache[userId];
  _save();
}

function _save(): void {
  try {
    const dir = dirname(DATA_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e: any) {
    console.warn("[persist] erro ao salvar:", e?.message);
  }
}
