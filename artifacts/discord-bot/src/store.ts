import { dbSetToken, dbSetRpc, dbClearRpc } from "./db.js";
import type { RpcRow } from "./db.js";

export type RpcConfig = RpcRow;

export interface UserSession {
  token?: string;
  rpc?: RpcConfig;
  awaitingImage?: boolean;
  pendingIconUrl?: string;
  pendingStatusType?: "playing" | "watching" | "streaming";
}

const sessions = new Map<string, UserSession>();

export function getSession(userId: string): UserSession {
  if (!sessions.has(userId)) sessions.set(userId, {});
  return sessions.get(userId)!;
}

export function setSession(userId: string, data: Partial<UserSession>): void {
  const current = getSession(userId);
  sessions.set(userId, { ...current, ...data });
}

export function clearSession(userId: string): void {
  sessions.delete(userId);
}

export function setToken(userId: string, token: string): void {
  setSession(userId, { token });
  dbSetToken(userId, token).catch((e) =>
    console.warn("[store] dbSetToken falhou:", e?.message)
  );
}

export function getToken(userId: string): string | undefined {
  return getSession(userId).token;
}

export function setRpc(userId: string, rpc: RpcConfig): void {
  setSession(userId, { rpc });
  dbSetRpc(userId, rpc).catch((e) =>
    console.warn("[store] dbSetRpc falhou:", e?.message)
  );
}

export function clearRpc(userId: string): void {
  setSession(userId, { rpc: undefined });
  dbClearRpc(userId).catch((e) =>
    console.warn("[store] dbClearRpc falhou:", e?.message)
  );
}

export function getRpc(userId: string): RpcConfig | undefined {
  return getSession(userId).rpc;
}

export function loadSessionFromDb(
  userId: string,
  data: { token?: string; rpc?: RpcConfig }
): void {
  const current = getSession(userId);
  sessions.set(userId, {
    ...current,
    token: data.token ?? current.token,
    rpc: data.rpc ?? current.rpc,
  });
}
