import {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
} from "discord.js";
import { registerInteractionHandlers } from "./handlers/interactions.js";
import { registerMessageCollector } from "./handlers/collectors.js";
import { loadPersistence, getPersistedData } from "./persistence.js";
import { loadSessionFromPersisted } from "./store.js";
import { activateRpc } from "./selfbot.js";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN não definido");

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

registerInteractionHandlers(client);
registerMessageCollector(client);

client.once("ready", async () => {
  console.log(`[bot] conectado como ${client.user?.tag}`);

  client.user?.setPresence({
    status: "online",
    activities: [
      {
        name: "/k",
        type: ActivityType.Streaming,
        url: "https://twitch.tv/faren",
      },
    ],
  });

  console.log("[bot] status de streaming definido: /k");

  const saved = loadPersistence();
  const entries = Object.entries(saved);

  if (entries.length === 0) return;

  console.log(`[persist] restaurando ${entries.length} sessão(ões)...`);

  let delay = 3000;
  for (const [userId, data] of entries) {
    loadSessionFromPersisted(userId, data);

    if (data.token && data.rpc) {
      const capturedDelay = delay;
      const capturedUserId = userId;
      const capturedData = data;

      setTimeout(async () => {
        try {
          await activateRpc(capturedData.token!, capturedUserId, capturedData.rpc!);
          console.log(`[persist] rpc restaurado: ${capturedUserId}`);
        } catch (e: any) {
          console.warn(`[persist] falha ao restaurar rpc ${capturedUserId}:`, e?.message);
        }
      }, capturedDelay);

      delay += 2000;
    }
  }
});

export async function startBot(): Promise<void> {
  await client.login(BOT_TOKEN);
}
