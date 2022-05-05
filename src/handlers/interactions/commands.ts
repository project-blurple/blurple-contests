import type { CommandInteraction } from "discord.js";
import type { SlashCommand } from "../../commands/slash";
import { inspect } from "util";
import { mainLogger } from "../../utils/logger";

export default async (interaction: CommandInteraction): Promise<void> => {
  const command = interaction.guild?.commands.cache.find(cmd => cmd.name === interaction.commandName);

  if (command) {
    try {
      const path = [command.name, interaction.options.getSubcommandGroup(false), interaction.options.getSubcommand(false)].filter(Boolean).join("/");

      const { default: commandFile } = await import(`../../commands/slash/${path}`) as { default: SlashCommand };
      void commandFile.execute(interaction);
    } catch (err) {
      mainLogger.warn(`Command ${interaction.commandName} failed: ${inspect(err)}`);
    }
  } else mainLogger.warn(`Command ${interaction.commandName} not found.`);
};
