import type { ApplicationCommandOptionChoice, AutocompleteInteraction, Awaitable } from "discord.js";
import type { SlashCommand } from "../../commands/slash";
import { mainLogger } from "../../utils/logger";

export type Autocomplete = (query: number | string, interaction: AutocompleteInteraction) => Awaitable<ApplicationCommandOptionChoice[]>;

export default async (interaction: AutocompleteInteraction): Promise<void> => {
  const path = [interaction.commandName, interaction.options.getSubcommandGroup(false), interaction.options.getSubcommand(false)].filter(Boolean);
  const { default: command } = await import(`../../commands/slash/${path.join("/")}`) as { default: SlashCommand };
  const autocompletes = command.autocompletes ?? {};

  const { name, value } = interaction.options.getFocused(true);
  const autocomplete = autocompletes[name];

  if (autocomplete) {
    const response = await autocomplete(value, interaction);
    void interaction.respond(response);
  } else mainLogger.warn(`Autocomplete "${name}" for command "/${path.join(" ")}" not found.`);
};
