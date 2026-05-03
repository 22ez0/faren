import {
  type Client,
  type Message,
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { getSession, setSession, getToken } from "../store.js";
import { uploadToCatbox } from "../catbox.js";
import { sendSelfDm } from "../selfbot.js";

function buildStatusSelectRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("rpc_status_select")
    .setPlaceholder("escolha o tipo de status")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("playing")
        .setDescription("status vermelho")
        .setValue("playing")
        .setEmoji("🔴"),
      new StringSelectMenuOptionBuilder()
        .setLabel("watching")
        .setDescription("status azul")
        .setValue("watching")
        .setEmoji("🔵"),
      new StringSelectMenuOptionBuilder()
        .setLabel("streaming")
        .setDescription("status roxo — url da twitch preenchida automaticamente")
        .setValue("streaming")
        .setEmoji("🟣")
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function registerMessageCollector(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const session = getSession(userId);

    if (!session.awaitingImage) return;

    // garantir que o canal DM está disponível mesmo quando parcial
    if (message.channel.partial) {
      try {
        await message.channel.fetch();
      } catch {
        return;
      }
    }

    if (message.content?.toLowerCase() === "pular") {
      setSession(userId, { awaitingImage: false, pendingIconUrl: undefined });
      try {
        await message.reply({
          content: "ok, sem ícone. agora escolha o tipo de status do rpc:",
          components: [buildStatusSelectRow()],
        });
      } catch (e: any) {
        console.warn("[collector] reply falhou:", e?.message);
      }
      return;
    }

    const attachment = message.attachments.first();
    if (!attachment) return;

    setSession(userId, { awaitingImage: false });

    try {
      if (message.channel.isSendable()) {
        message.channel.sendTyping().catch(() => null);
      }
    } catch {}

    try {
      const catboxUrl = await uploadToCatbox(attachment.url);
      const mpExternalUrl = `mp:external/${catboxUrl}`;

      setSession(userId, { pendingIconUrl: catboxUrl });

      const token = getToken(userId);
      if (token) {
        sendSelfDm(
          token,
          userId,
          `**link da mídia:** ${catboxUrl}\n**mp:external:** \`${mpExternalUrl}\``
        ).catch(() => null);
      }

      await message.reply({
        content: `ícone hospedado ✓ agora escolha o tipo de status do rpc:`,
        components: [buildStatusSelectRow()],
      });
    } catch (e: any) {
      console.error("[collector] erro ao processar imagem:", e?.message);
      try {
        await message.reply(`erro ao hospedar imagem: ${e?.message ?? e}`);
      } catch {}
    }
  });
}
