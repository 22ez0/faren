import {
  type Client,
  type Message,
  Events,
} from "discord.js";
import { getSession, setSession, setRpc, getToken } from "../store.js";
import { uploadToCatbox } from "../catbox.js";
import { activateRpc } from "../selfbot.js";
import { buildRpcModal } from "./modals.js";

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

    const typing = message.channel.isSendable()
      ? message.channel.sendTyping().catch(() => null)
      : null;

    try {
      const catboxUrl = await uploadToCatbox(attachment.url);

      const pendingFields = session.pendingRpcFields;
      const token = getToken(userId);

      if (pendingFields && token) {
        const rpcConfig = { ...pendingFields, iconUrl: catboxUrl };
        await activateRpc(token, userId, rpcConfig);
        setRpc(userId, rpcConfig);

        await message.reply(
          `icon hospedado: ${catboxUrl}\n\nrpc ativado com sucesso.\n\n> **título:** ${rpcConfig.title}\n> **subtítulo:** ${rpcConfig.subtitle || "—"}\n> **detalhe:** ${rpcConfig.detail || "—"}\n> **status:** ${rpcConfig.statusType}`
        );
      } else {
        setSession(userId, { pendingRpcFields: undefined });
        await message.reply(
          `icon hospedado: ${catboxUrl}\n\nagora selecione **ativar rpc** no menu novamente para configurar os demais campos.`
        );
        setRpc(userId, { iconUrl: catboxUrl } as any);
      }
    } catch (e: any) {
      await message.reply(`erro ao processar imagem: ${e.message}`);
    }
  });
}
