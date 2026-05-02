import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalSubmitInteraction,
} from "discord.js";
import { getToken, setToken, setRpc, getRpc, setSession, getSession } from "../store.js";
import { activateRpc } from "../selfbot.js";

export function buildConnectModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId("modal_connect_token")
    .setTitle("conectar conta")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("token_input")
          .setLabel("token do discord")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("informe seu token aqui")
          .setRequired(true)
      )
    );
}

export function buildClearDmModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId("modal_clear_dm")
    .setTitle("limpar dm")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("user_id_input")
          .setLabel("id do usuário")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("id do usuário com dm aberta")
          .setRequired(true)
      )
    );
}

export function buildRpcFieldsModal(
  statusType: "playing" | "watching" | "streaming",
  existing?: {
    title?: string;
    subtitle?: string;
    detail?: string;
    customUrl?: string;
  }
): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId("modal_rpc_fields")
    .setTitle("configurar rpc");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rpc_title")
        .setLabel("título")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("título do rpc")
        .setValue(existing?.title ?? "")
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rpc_subtitle")
        .setLabel("subtítulo")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("subtítulo do rpc")
        .setValue(existing?.subtitle ?? "")
        .setRequired(false)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rpc_detail")
        .setLabel("detalhe")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("detalhe adicional")
        .setValue(existing?.detail ?? "")
        .setRequired(false)
    )
  );

  if (statusType !== "streaming") {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("rpc_url")
          .setLabel("url personalizada (opcional)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("https://")
          .setValue(existing?.customUrl ?? "")
          .setRequired(false)
      )
    );
  }

  return modal;
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  const { customId, user } = interaction;

  if (customId === "modal_connect_token") {
    await interaction.deferReply({ ephemeral: true });
    const token = interaction.fields.getTextInputValue("token_input").trim();

    try {
      const { validateToken } = await import("../selfbot.js");
      const info = await validateToken(token, user.id);
      setToken(user.id, token);
      await interaction.editReply({
        content: `conectado como **${info.username}** (\`${info.id}\`). token salvo para uso nesta sessão.`,
      });
    } catch {
      await interaction.editReply({
        content: "token inválido ou expirado. verifique e tente novamente.",
      });
    }
    return;
  }

  if (customId === "modal_clear_dm") {
    await interaction.deferReply({ ephemeral: true });
    const token = getToken(user.id);
    if (!token) {
      await interaction.editReply({ content: "conecte primeiro usando a opção **conectar**." });
      return;
    }
    const targetId = interaction.fields.getTextInputValue("user_id_input").trim();
    try {
      const { clearDm } = await import("../selfbot.js");
      await clearDm(token, user.id, targetId);
      await interaction.editReply({ content: `dm com \`${targetId}\` limpa.` });
    } catch (e: any) {
      await interaction.editReply({ content: `erro: ${e.message}` });
    }
    return;
  }

  if (customId === "modal_rpc_fields") {
    await interaction.deferReply({ ephemeral: true });

    const session = getSession(user.id);
    const token = getToken(user.id);

    if (!token) {
      await interaction.editReply({ content: "conecte primeiro usando a opção **conectar**." });
      return;
    }

    const statusType = session.pendingStatusType ?? "playing";
    const title = interaction.fields.getTextInputValue("rpc_title").trim();
    const subtitle = interaction.fields.getTextInputValue("rpc_subtitle").trim();
    const detail = interaction.fields.getTextInputValue("rpc_detail").trim();

    let customUrl = "";
    if (statusType !== "streaming") {
      try {
        customUrl = interaction.fields.getTextInputValue("rpc_url").trim();
      } catch {}
    } else {
      const saved = getRpc(user.id);
      customUrl = saved?.customUrl || "https://twitch.tv/twitch";
    }

    const iconUrl = session.pendingIconUrl ?? getRpc(user.id)?.iconUrl;

    const rpcConfig = { statusType, title, subtitle, detail, customUrl, iconUrl };

    try {
      await activateRpc(token, user.id, rpcConfig);
      setRpc(user.id, rpcConfig);
      setSession(user.id, { pendingStatusType: undefined, pendingIconUrl: undefined });

      const statusEmoji = statusType === "streaming" ? "🟣" : statusType === "watching" ? "🔵" : "🔴";
      await interaction.editReply({
        content: `rpc ativado ${statusEmoji}\n\n> **título:** ${title}\n> **subtítulo:** ${subtitle || "—"}\n> **detalhe:** ${detail || "—"}\n> **status:** ${statusType}${iconUrl ? `\n> **icon:** ${iconUrl}` : ""}`,
      });
    } catch (e: any) {
      await interaction.editReply({ content: `erro ao ativar rpc: ${e.message}` });
    }
    return;
  }
}
