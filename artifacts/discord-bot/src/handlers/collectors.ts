import {
  type Client,
  type Message,
  Events,
} from "discord.js";
import { getSession, setSession, setRpc, getToken } from "../store.js";
import { uploadToCatbox } from "../catbox.js";
import { activateRpc, sendSelfDm } from "../selfbot.js";

export function registerMessageCollector(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const session = getSession(userId);

    if (!session.awaitingImage) return;

    if (message.content?.toLowerCase() === "pular") {
      setSession(userId, { awaitingImage: false });
      await message.reply(
        "ok. agora configure o rpc respondendo ao menu novamente com a opção **ativar rpc**."
      );
      return;
    }

    const attachment = message.attachments.first();
    if (!attachment) return;

    setSession(userId, { awaitingImage: false });

    if (message.channel.isSendable()) {
      message.channel.sendTyping().catch(() => null);
    }

    try {
      const catboxUrl = await uploadToCatbox(attachment.url);
      const mpExternalUrl = `mp:external/${catboxUrl}`;
      const token = getToken(userId);

      if (token) {
        try {
          await sendSelfDm(
            token,
            userId,
            `**link da mídia:** ${catboxUrl}\n**mp:external:** \`${mpExternalUrl}\``
          );
        } catch {
          if (message.channel.isSendable()) {
            await message.channel.send(
              `**link da mídia:** ${catboxUrl}\n**mp:external:** \`${mpExternalUrl}\``
            );
          }
        }
      } else {
        if (message.channel.isSendable()) {
          await message.channel.send(
            `**link da mídia:** ${catboxUrl}\n**mp:external:** \`${mpExternalUrl}\``
          );
        }
      }

      const pendingFields = session.pendingRpcFields;

      if (pendingFields && token) {
        const rpcConfig = { ...pendingFields, iconUrl: catboxUrl };
        await activateRpc(token, userId, rpcConfig);
        setRpc(userId, rpcConfig);

        await message.reply(
          `rpc ativado.\n\n> **título:** ${rpcConfig.title}\n> **subtítulo:** ${rpcConfig.subtitle || "—"}\n> **detalhe:** ${rpcConfig.detail || "—"}\n> **status:** ${rpcConfig.statusType}`
        );
      } else {
        setSession(userId, { pendingRpcFields: undefined });
        setRpc(userId, { iconUrl: catboxUrl } as any);
        await message.reply(
          `icon salvo. agora selecione **ativar rpc** no menu para configurar os demais campos.`
        );
      }
    } catch (e: any) {
      await message.reply(`erro ao processar imagem: ${e.message}`);
    }
  });
}
