import { ApplicationCommandOptionType } from "discord.js";
import { Contest } from "../../../database/models/Contest.model";
import Emojis from "../../../constants/emojis";
import type { SecondLevelChatInputCommand } from "..";
import contestAutocomplete from "../../../constants/autocompletes/contest";

export default {
  name: "remove",
  description: "Remove a contest",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "contest",
      description: "The name of the contest you want to edit",
      autocomplete: contestAutocomplete,
      required: true,
    },
  ],
  async execute(interaction) {
    const contest = await Contest.findOne({ contestId: interaction.options.getString("contest", true) });
    if (!contest) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Contest not found, try again.`,
        ephemeral: true,
      });
    }

    await contest.remove();
    return void interaction.reply({
      content: `${Emojis.THUMBSUP} Contest removed.`,
    });
  },
} satisfies SecondLevelChatInputCommand;
