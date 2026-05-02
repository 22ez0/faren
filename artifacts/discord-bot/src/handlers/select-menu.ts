import {
  type StringSelectMenuInteraction,
  EmbedBuilder,
} from "discord.js";
import { buildConnectModal, buildClearDmModal, buildRpcModal } from "./modals.js";
import { getToken, getRpc, setSession } from "../store.js";

export async function handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
  if (interaction.customId !== "k_panel_select") return;

  const value = interaction.values[0];
  const userId = interaction.user.id;

  if (value === "connect_token") {
    await interaction.showModal(buildConnectModal());
    return;
  }

  if (value === "clear_dm") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({
        content: "conecte primeiro usando a opção **conectar**.",
        ephemeral: true,
      });
      return;
    }
    await interaction.showModal(buildClearDmModal());
    return;
  }

  if (value === "leave_servers") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({
        content: "conecte primeiro usando a opção **conectar**.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const { leaveAllServers } = await import("../selfbot.js");
      const count = await leaveAllServers(token, userId);
      await interaction.editReply({
        content: `saiu de **${count}** servidor${count !== 1 ? "es" : ""}.`,
      });
    } catch (e: any) {
      await interaction.editReply({ content: `erro: ${e.message}` });
    }
    return;
  }

  if (value === "activate_rpc") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({
        content: "conecte primeiro usando a opção **conectar**.",
        ephemeral: true,
      });
      return;
    }

    setSession(userId, { awaitingImage: true });
    await interaction.reply({
      content:
        "envie a imagem para o icon do rpc neste canal. ela será hospedada automaticamente.\n\ngif suporta até **5mb**. envie `pular` para continuar sem icon.",
      ephemeral: true,
    });
    return;
  }

  if (value === "edit_rpc") {
    const token = getToken(userId);
    if (!token) {
      await interaction.reply({
        content: "conecte primeiro usando a opção **conectar**.",
        ephemeral: true,
      });
      return;
    }

    const saved = getRpc(userId);
    await interaction.showModal(
      buildRpcModal({
        statusType: saved?.statusType,
        title: saved?.title,
        subtitle: saved?.subtitle,
        detail: saved?.detail,
        customUrl: saved?.customUrl,
      })
    );
    return;
  }
}
