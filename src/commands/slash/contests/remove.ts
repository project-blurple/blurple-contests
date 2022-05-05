import { Contest } from "../../../database";
import Emojis from "../../../constants/emojis";
import type { SlashCommand } from "..";
import contestAutocomplete from "../../../constants/autocompletes/contest";

const command: SlashCommand = {
  description: "Remove a contest",
  options: [
    {
      type: "STRING",
      name: "contest",
      description: "The name of the contest you want to edit",
      autocomplete: true,
      required: true,
    },
  ],
  autocompletes: {
    contest: contestAutocomplete,
  },
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
};

export default command;
