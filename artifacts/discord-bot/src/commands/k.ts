import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
  type ChatInputCommandInteraction,
} from "discord.js";

export const kCommand = new SlashCommandBuilder()
  .setName("k")
  .setDescription("acesse o painel de controle da sua conta")
  .setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  )
  .setContexts(
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel
  );

const EMOJI_ESTRELA_ID = "1500092244819054622";
const EMOJI_BOLA_ID = "1500092309105020998";

export async function handleKCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x000000)
    .setDescription(
      `> # _ k_ <a:estrela:${EMOJI_ESTRELA_ID}>\n> \n> tenha acesso à sua conta através do bot!`
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("k_panel_select")
      .setPlaceholder("selecionar opções")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("conectar")
          .setDescription("informar token")
          .setValue("connect_token")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" }),
        new StringSelectMenuOptionBuilder()
          .setLabel("ativar rpc")
          .setDescription("configurar e ativar seu rpc personalizado")
          .setValue("activate_rpc")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" }),
        new StringSelectMenuOptionBuilder()
          .setLabel("editar rpc")
          .setDescription("editar campos do rpc sem trocar o ícone")
          .setValue("edit_rpc")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" }),
        new StringSelectMenuOptionBuilder()
          .setLabel("desativar rpc")
          .setDescription("remove o rpc do seu perfil")
          .setValue("deactivate_rpc")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" }),
        new StringSelectMenuOptionBuilder()
          .setLabel("limpar dm")
          .setDescription("apagar suas mensagens de uma dm")
          .setValue("clear_dm")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" }),
        new StringSelectMenuOptionBuilder()
          .setLabel("sair dos servidores")
          .setDescription("sai de todos os servidores")
          .setValue("leave_servers")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" }),
        new StringSelectMenuOptionBuilder()
          .setLabel("clonar servidor")
          .setDescription("copia canais, categorias e cargos de um servidor para outro")
          .setValue("clone_server")
          .setEmoji({ id: EMOJI_BOLA_ID, name: "bola" })
      )
  );

  await interaction.reply({ embeds: [embed], components: [row1] });
}
