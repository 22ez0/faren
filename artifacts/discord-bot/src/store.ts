export interface RpcConfig {
  iconUrl?: string;
  statusType: "playing" | "watching" | "streaming";
  title: string;
  subtitle: string;
  detail: string;
  customUrl: string;
}

export interface UserSession {
  token?: string;
  rpc?: RpcConfig;
  awaitingImage?: boolean;
  pendingRpcFields?: Omit<RpcConfig, "iconUrl">;
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
}

export function getToken(userId: string): string | undefined {
  return getSession(userId).token;
}

export function setRpc(userId: string, rpc: RpcConfig): void {
  setSession(userId, { rpc });
}

export function getRpc(userId: string): RpcConfig | undefined {
  return getSession(userId).rpc;
}
