import {
  type StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { buildConnectModal, buildClearDmModal, buildRpcFieldsModal, buildCloneServerModal } from "./modals.js";
import { getToken, getRpc, setSession, getSession } from "../store.js";

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

export async function handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  const { customId, user } = interaction;
  const userId = user.id;

  if (customId === "rpc_status_select") {
    const statusType = interaction.values[0] as "playing" | "watching" | "streaming";
    setSession(userId, { pendingStatusType: statusType });

    const saved = getRpc(userId);
    await interaction.showModal(
      buildRpcFieldsModal(statusType, {
        title: saved?.title,
        subtitle: saved?.subtitle,
        detail: saved?.detail,
        customUrl: saved?.customUrl,
        buttonLabel: saved?.buttonLabel,
        buttonUrl: saved?.buttonUrl,
      })
    );
    return;
  }

  if (customId !== "k_panel_select") return;

  const value = interaction.values[0];

  if (value === "connect_token") {
    await interaction.showModal(buildConnectModal());
    return;
  }

  if (value === "view_status") {
    await interaction.deferReply({ ephemeral: true });

    const token = getToken(userId);
    const rpc = getRpc(userId);

    if (!token) {
      await interaction.editReply({
        content: "❌ **sem conexão** — use a opção **conectar** para informar seu token.",
      });
      return;
    }

    // checar se o selfbot está de fato conectado
    let connectedAs = "verificando...";
    try {
      const { getConnectedUser } = await import("../selfbot.js");
      const info = getConnectedUser(userId);
      connectedAs = info ? `**${info.username}** (\`${info.id}\`)` : "token salvo mas cliente desconectado";
    } catch {}

    const rpcStatus = rpc
      ? `🟢 ativo\n> **nome:** ${rpc.title}\n> **tipo:** ${rpc.statusType}` +
        (rpc.subtitle ? `\n> **linha 1:** ${rpc.subtitle}` : "") +
        (rpc.detail ? `\n> **linha 2:** ${rpc.detail}` : "") +
        (rpc.buttonLabel && rpc.buttonUrl ? `\n> **botão:** ${rpc.buttonLabel} → ${rpc.buttonUrl}` : "") +
        (rpc.iconUrl ? `\n> **ícone:** definido` : "")
      : "🔴 inativo";

    await interaction.editReply({
      content:
        `**status da conexão**\n\n` +
        `> **conta:** ${connectedAs}\n\n` +
        `**rpc**\n> ${rpcStatus}`,
    });
    return;
  }

  if (value === "clear_dm") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({ content: "conecte primeiro usando a opção **conectar**.", ephemeral: true });
      return;
    }
    await interaction.showModal(buildClearDmModal());
    return;
  }

  if (value === "leave_servers") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({ content: "conecte primeiro usando a opção **conectar**.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    try {
      const { leaveAllServers } = await import("../selfbot.js");
      const count = await leaveAllServers(token, userId);
      await interaction.editReply({ content: `saiu de **${count}** servidor${count !== 1 ? "es" : ""}.` });
    } catch (e: any) {
      await interaction.editReply({ content: `erro: ${e?.message ?? e}` });
    }
    return;
  }

  if (value === "activate_rpc") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({ content: "conecte primeiro usando a opção **conectar**.", ephemeral: true });
      return;
    }

    setSession(userId, { awaitingImage: true, pendingIconUrl: undefined, pendingStatusType: undefined });
    await interaction.reply({
      content:
        "envie o arquivo de imagem (png/gif) em **qualquer lugar onde o bot possa ver**:\n\n" +
        "• neste servidor (se o bot estiver aqui)\n" +
        "• em **dm com o bot** ← funciona sempre\n\n" +
        "gif suporta até **5mb**. envie `pular` para continuar sem ícone.",
      ephemeral: true,
    });
    return;
  }

  if (value === "edit_rpc") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({ content: "conecte primeiro usando a opção **conectar**.", ephemeral: true });
      return;
    }

    setSession(userId, { pendingStatusType: undefined });
    await interaction.reply({
      content: "escolha o tipo de status do rpc:",
      components: [buildStatusSelectRow()],
      ephemeral: true,
    });
    return;
  }

  if (value === "deactivate_rpc") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({ content: "conecte primeiro usando a opção **conectar**.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    try {
      const { deactivateRpc } = await import("../selfbot.js");
      await deactivateRpc(token, userId);

      const { clearRpc } = await import("../store.js");
      clearRpc(userId);

      await interaction.editReply({ content: "rpc desativado. atividade removida do perfil." });
    } catch (e: any) {
      await interaction.editReply({ content: `erro ao desativar: ${e?.message ?? e}` });
    }
    return;
  }

  if (value === "clone_server") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({ content: "conecte primeiro usando a opção **conectar**.", ephemeral: true });
      return;
    }
    await interaction.showModal(buildCloneServerModal());
    return;
  }
}
