import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";

export const kCommand = new SlashCommandBuilder()
  .setName("k")
  .setDescription("acesse o painel de controle da sua conta");

const EMOJI_BULLET_1 = "<:b_dmn:1500082338682634271>";
const EMOJI_BULLET_2 = "<:b_dmn:1495209913478287483>";
const EMOJI_ANIMATED = "<a:y_dmn:1493416129723498516>";

export async function handleKCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setDescription(
      `> # _ k_ ${EMOJI_ANIMATED}\n> \n> tenha acesso à sua conta através do bot!`
    );

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("k_panel_select")
    .setPlaceholder("selecionar opções")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("conectar")
        .setDescription("informar token")
        .setValue("connect_token")
        .setEmoji({ id: "1500082338682634271", name: "b_dmn" }),
      new StringSelectMenuOptionBuilder()
        .setLabel("limpar dm")
        .setDescription("informar id de algum usuário que tem dm aberta")
        .setValue("clear_dm")
        .setEmoji({ id: "1500082338682634271", name: "b_dmn" }),
      new StringSelectMenuOptionBuilder()
        .setLabel("sair dos servidores")
        .setDescription("sai de todos os servidores")
        .setValue("leave_servers")
        .setEmoji({ id: "1500082338682634271", name: "b_dmn" }),
      new StringSelectMenuOptionBuilder()
        .setLabel("ativar rpc")
        .setDescription("configurar e ativar seu rpc personalizado")
        .setValue("activate_rpc")
        .setEmoji({ id: "1500082338682634271", name: "b_dmn" }),
      new StringSelectMenuOptionBuilder()
        .setLabel("editar rpc")
        .setDescription("editar configurações salvas do rpc")
        .setValue("edit_rpc")
        .setEmoji({ id: "1495209913478287483", name: "b_dmn" })
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({ embeds: [embed], components: [row] });
}
