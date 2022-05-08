import type { CommandInteraction } from "discord.js";
import type { SlashCommand } from "../../commands/slash";
import { inspect } from "util";
import { mainLogger } from "../../utils/logger";

export default async (interaction: CommandInteraction): Promise<void> => {
  const command = interaction.guild?.commands.cache.find(cmd => cmd.name === interaction.commandName);

  if (command) {
    const path = [command.name, interaction.options.getSubcommandGroup(false), interaction.options.getSubcommand(false)].filter(Boolean) as string[];
    try {
      const { default: commandFile } = await import(`../../commands/slash/${path.join("/")}`) as { default: SlashCommand };
      void commandFile.execute(interaction);
    } catch (err) {
      mainLogger.warn(`Command "/${path.join(" ")} failed: ${inspect(err)}`);
    }
  } else mainLogger.warn(`Command ${interaction.commandName} not found.`);
};
