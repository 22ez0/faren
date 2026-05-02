import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { registerInteractionHandlers } from "./handlers/interactions.js";
import { registerMessageCollector } from "./handlers/collectors.js";

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

client.once("ready", () => {
  console.log(`[bot] conectado como ${client.user?.tag}`);
});

export async function startBot(): Promise<void> {
  await client.login(BOT_TOKEN);
}
