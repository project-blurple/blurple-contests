import type { ApplicationCommandAutocompleteOption, ApplicationCommandChannelOptionData, ApplicationCommandChoicesData, ApplicationCommandNonOptionsData, ApplicationCommandNumericOptionData, Awaitable, CommandInteraction } from "discord.js";
import type { Autocomplete } from "../../handlers/interactions/autocompletes";

type SlashCommandOptions =
  | ApplicationCommandAutocompleteOption
  | ApplicationCommandChannelOptionData
  | ApplicationCommandChoicesData
  | ApplicationCommandNonOptionsData
  | ApplicationCommandNumericOptionData;


export interface SlashCommand {
  description: string;
  options?: [SlashCommandOptions, ...SlashCommandOptions[]];
  autocompletes?: Record<string, Autocomplete>;
  execute(interaction: CommandInteraction): Awaitable<void>;
}
