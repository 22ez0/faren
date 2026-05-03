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

export function buildCloneServerModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId("modal_clone_server")
    .setTitle("clonar servidor")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("source_guild_id")
          .setLabel("id do servidor de origem")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("id do servidor a ser clonado")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("target_guild_id")
          .setLabel("id do servidor de destino")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("id do servidor que vai receber a clonagem")
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
    buttonLabel?: string;
    buttonUrl?: string;
  }
): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId("modal_rpc_fields")
    .setTitle("configurar rpc");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rpc_title")
        .setLabel("nome da atividade")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("ex: assistindo anime, ouvindo música...")
        .setValue(existing?.title ?? "")
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rpc_subtitle")
        .setLabel("linha 1 (subtítulo)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("primeira linha de descrição")
        .setValue(existing?.subtitle ?? "")
        .setRequired(false)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("rpc_detail")
        .setLabel("linha 2 (detalhe)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("segunda linha de descrição")
        .setValue(existing?.detail ?? "")
        .setRequired(false)
    )
  );

  if (statusType === "streaming") {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("rpc_stream_url")
          .setLabel("url da stream (twitch/youtube)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("https://twitch.tv/seucanal")
          .setValue(existing?.customUrl ?? "")
          .setRequired(false)
      )
    );
  } else {
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("rpc_button")
          .setLabel("botão: nome | url (opcional)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("ex: meu perfil | https://faren.com.br/user")
          .setValue(
            existing?.buttonLabel && existing?.buttonUrl
              ? `${existing.buttonLabel} | ${existing.buttonUrl}`
              : ""
          )
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
        content: `conectado como **${info.username}** (\`${info.id}\`). token salvo.`,
      });
    } catch (e: any) {
      console.error("[modal_connect_token] erro:", e?.message ?? e);
      const msg = e?.message ?? String(e);
      await interaction.editReply({
        content: `erro ao conectar: ${msg}`,
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
      await interaction.editReply({ content: `erro: ${e?.message ?? e}` });
    }
    return;
  }

  if (customId === "modal_clone_server") {
    await interaction.deferReply({ ephemeral: true });
    const token = getToken(user.id);
    if (!token) {
      await interaction.editReply({ content: "conecte primeiro usando a opção **conectar**." });
      return;
    }

    const sourceId = interaction.fields.getTextInputValue("source_guild_id").trim();
    const targetId = interaction.fields.getTextInputValue("target_guild_id").trim();

    await interaction.editReply({ content: "⏳ clonando servidor... isso pode levar alguns minutos." });

    try {
      const { cloneServer } = await import("../selfbot.js");
      const result = await cloneServer(token, user.id, sourceId, targetId);

      const errLine = result.errors.length
        ? `\n> **erros (${result.errors.length}):** ${result.errors.slice(0, 3).join(", ")}${result.errors.length > 3 ? "..." : ""}`
        : "";

      await interaction.editReply({
        content:
          `clonagem concluída!\n\n` +
          `> **cargos criados:** ${result.roles}\n` +
          `> **categorias criadas:** ${result.categories}\n` +
          `> **canais criados:** ${result.channels}` +
          errLine,
      });
    } catch (e: any) {
      await interaction.editReply({ content: `erro ao clonar: ${e?.message ?? e}` });
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

    // ícone: usa o arquivo enviado antes, ou o rpc salvo anteriormente
    const iconUrl = session.pendingIconUrl ?? getRpc(user.id)?.iconUrl ?? "";

    let customUrl = "";
    let buttonLabel = "";
    let buttonUrl = "";

    if (statusType === "streaming") {
      try {
        customUrl = interaction.fields.getTextInputValue("rpc_stream_url").trim();
      } catch {}
      if (!customUrl) customUrl = getRpc(user.id)?.customUrl || "https://twitch.tv/twitch";
    } else {
      try {
        const buttonRaw = interaction.fields.getTextInputValue("rpc_button").trim();
        if (buttonRaw.includes("|")) {
          const parts = buttonRaw.split("|").map((s) => s.trim());
          buttonLabel = parts[0] ?? "";
          buttonUrl = parts.slice(1).join("|").trim();
        }
      } catch {}
    }

    const rpcConfig = { statusType, title, subtitle, detail, customUrl, iconUrl, buttonLabel, buttonUrl };

    try {
      await activateRpc(token, user.id, rpcConfig);
      setRpc(user.id, rpcConfig);
      setSession(user.id, { pendingStatusType: undefined, pendingIconUrl: undefined });

      const statusEmoji = statusType === "streaming" ? "🟣" : statusType === "watching" ? "🔵" : "🔴";
      const buttonLine = buttonLabel && buttonUrl ? `\n> **botão:** ${buttonLabel} → ${buttonUrl}` : "";
      const iconLine = iconUrl ? `\n> **ícone:** definido` : "";

      await interaction.editReply({
        content:
          `rpc ativado ${statusEmoji}\n\n` +
          `> **nome:** ${title}\n` +
          `> **linha 1:** ${subtitle || "—"}\n` +
          `> **linha 2:** ${detail || "—"}\n` +
          `> **status:** ${statusType}` +
          iconLine +
          buttonLine,
      });
    } catch (e: any) {
      console.error("[modal_rpc_fields] erro ao ativar rpc:", e?.message ?? e);
      await interaction.editReply({ content: `erro ao ativar rpc: ${e?.message ?? e}` });
    }
    return;
  }
}
