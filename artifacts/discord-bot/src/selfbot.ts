import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { Client: SelfbotClient, RichPresence } = require("discord.js-selfbot-v13");

export interface RpcOptions {
  iconUrl?: string;
  statusType: "playing" | "watching" | "streaming";
  title: string;
  subtitle: string;
  detail: string;
  customUrl: string;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  global_name?: string;
  discriminator?: string;
  code?: number;
  message?: string;
}

const selfbotClients = new Map<string, InstanceType<typeof SelfbotClient>>();
const activeRpcOptions = new Map<string, RpcOptions>();
const rpcIntervals = new Map<string, ReturnType<typeof setInterval>>();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "1500071757925584996";
const RPC_REFRESH_MS = 4 * 60 * 1000; // re-aplica a cada 4 minutos

async function validateTokenHttp(token: string): Promise<DiscordUserResponse> {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: token },
  });
  const data = (await res.json()) as DiscordUserResponse;
  if (!res.ok || data.code) {
    throw new Error("token inválido ou sem permissão");
  }
  return data;
}

async function getSelfbotClient(token: string, userId: string): Promise<InstanceType<typeof SelfbotClient>> {
  if (selfbotClients.has(userId)) {
    const existing = selfbotClients.get(userId)!;
    if (existing.user) return existing;
    existing.destroy();
    selfbotClients.delete(userId);
  }

  return new Promise((resolve, reject) => {
    const client = new SelfbotClient({ checkUpdate: false });

    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("timeout ao conectar ao discord — tente novamente"));
    }, 20000);

    client.once("ready", () => {
      clearTimeout(timeout);
      selfbotClients.set(userId, client);
      resolve(client);
    });

    client.once("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });

    client.login(token).catch((err: Error) => {
      clearTimeout(timeout);
      const msg = err?.message ?? String(err);
      if (msg.includes("TOKEN_INVALID") || msg.includes("Improper token")) {
        reject(new Error("token inválido — verifique e tente novamente"));
      } else {
        reject(new Error(`erro ao conectar: ${msg}`));
      }
    });
  });
}

export async function validateToken(token: string, userId: string): Promise<{ username: string; id: string }> {
  const data = await validateTokenHttp(token);
  const username = data.global_name || data.username || "desconhecido";

  getSelfbotClient(token, userId).catch((err) => {
    console.warn(`[selfbot] pré-conexão falhou para ${userId}:`, err?.message);
  });

  return { username, id: data.id };
}

export async function clearDm(token: string, userId: string, targetId: string): Promise<void> {
  const client = await getSelfbotClient(token, userId);
  const channel = await client.users.createDM(targetId);
  if (!channel) throw new Error("dm não encontrada com esse usuário");

  const messages = await channel.messages.fetch({ limit: 100 });
  const own = messages.filter((m: any) => m.author.id === client.user.id);

  for (const [, msg] of own) {
    await msg.delete().catch(() => null);
    await new Promise((r) => setTimeout(r, 400));
  }
}

export async function leaveAllServers(token: string, userId: string): Promise<number> {
  const client = await getSelfbotClient(token, userId);
  const guilds = [...client.guilds.cache.values()];

  let count = 0;
  for (const guild of guilds) {
    await guild.leave().catch(() => null);
    count++;
    await new Promise((r) => setTimeout(r, 500));
  }

  return count;
}

async function buildRichPresence(
  client: InstanceType<typeof SelfbotClient>,
  opts: RpcOptions
): Promise<InstanceType<typeof RichPresence>> {
  const typeMap: Record<string, number> = {
    playing: 0,
    streaming: 1,
    watching: 3,
  };

  const rp = new RichPresence(client)
    .setApplicationId(CLIENT_ID)
    .setName(opts.title || "faren")
    .setType(typeMap[opts.statusType] ?? 0);

  if (opts.subtitle) rp.setDetails(opts.subtitle);
  if (opts.detail) rp.setState(opts.detail);

  if (opts.statusType === "streaming") {
    rp.setURL(opts.customUrl || "https://twitch.tv/faren");
  }

  if (opts.iconUrl) {
    try {
      const externalAssets = await RichPresence.getExternal(client, CLIENT_ID, opts.iconUrl);
      if (externalAssets[0]?.external_asset_path) {
        rp.setAssetsLargeImage(externalAssets[0].external_asset_path);
        // hover text: usa subtitle se existir, senão detalhe — nunca duplica o título
        const hoverText = opts.subtitle || opts.detail || "";
        if (hoverText) rp.setAssetsLargeText(hoverText);
      }
    } catch (e: any) {
      console.warn("[rpc] getExternal falhou, usando fallback:", e?.message);
      rp.setAssetsLargeImage(`mp:external/${opts.iconUrl}`);
      const hoverText = opts.subtitle || opts.detail || "";
      if (hoverText) rp.setAssetsLargeText(hoverText);
    }
  }

  return rp;
}

function stopRpcInterval(userId: string): void {
  const existing = rpcIntervals.get(userId);
  if (existing) {
    clearInterval(existing);
    rpcIntervals.delete(userId);
  }
}

function startRpcInterval(token: string, userId: string): void {
  stopRpcInterval(userId);

  const interval = setInterval(async () => {
    const opts = activeRpcOptions.get(userId);
    if (!opts) {
      stopRpcInterval(userId);
      return;
    }

    try {
      const client = await getSelfbotClient(token, userId);
      const rp = await buildRichPresence(client, opts);
      await client.user.setActivity(rp);
      console.log(`[rpc] keep-alive re-aplicado para ${userId}`);
    } catch (e: any) {
      console.warn(`[rpc] keep-alive falhou para ${userId}:`, e?.message);
    }
  }, RPC_REFRESH_MS);

  rpcIntervals.set(userId, interval);
}

export async function activateRpc(token: string, userId: string, opts: RpcOptions): Promise<void> {
  const client = await getSelfbotClient(token, userId);
  const rp = await buildRichPresence(client, opts);
  await client.user.setActivity(rp);

  activeRpcOptions.set(userId, opts);
  startRpcInterval(token, userId);
}

export async function deactivateRpc(token: string, userId: string): Promise<void> {
  stopRpcInterval(userId);
  activeRpcOptions.delete(userId);

  const client = await getSelfbotClient(token, userId);
  await client.user.setActivity(null);
}

export async function sendSelfDm(token: string, userId: string, content: string): Promise<void> {
  const client = await getSelfbotClient(token, userId);
  const dmChannel = await client.users.createDM(userId);
  await dmChannel.send(content);
}
