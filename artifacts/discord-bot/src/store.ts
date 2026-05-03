import { persistUser } from "./persistence.js";

export interface RpcConfig {
  iconUrl?: string;
  statusType: "playing" | "watching" | "streaming";
  title: string;
  subtitle: string;
  detail: string;
  customUrl: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export interface UserSession {
  token?: string;
  rpc?: RpcConfig;
  awaitingImage?: boolean;
  pendingRpcFields?: Omit<RpcConfig, "iconUrl">;
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
  persistUser(userId, { token });
}

export function getToken(userId: string): string | undefined {
  return getSession(userId).token;
}

export function setRpc(userId: string, rpc: RpcConfig): void {
  setSession(userId, { rpc });
  persistUser(userId, { rpc });
}

export function getRpc(userId: string): RpcConfig | undefined {
  return getSession(userId).rpc;
}

export function loadSessionFromPersisted(
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
