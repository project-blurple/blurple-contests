import Emojis from "../../../constants/emojis";
import type { SlashCommand } from "..";
import type { TextBasedChannel } from "discord.js";
import contestAutocomplete from "../../../constants/autocompletes/contest";

const command: SlashCommand = {
  description: "Post submission buttons in a channel",
  options: [
    {
      type: "STRING",
      name: "contest",
      description: "The name of the contest you want to edit",
      autocomplete: true,
      required: true,
    },
    {
      type: "CHANNEL",
      name: "channel",
      description: "The channel to post the button to",
      channelTypes: ["GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_TEXT"],
      required: true,
    },
  ],
  autocompletes: {
    contest: contestAutocomplete,
  },
  async execute(interaction) {
    const contestId = interaction.options.getString("contest", true);
    const channel = interaction.options.getChannel("channel", true) as TextBasedChannel;

    const message = await channel.send({
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              style: "PRIMARY",
              customId: `submit-contest-${contestId}`,
              label: "Submit",
            },
          ],
        },
      ],
    });

    void interaction.reply({
      content: `${Emojis.SPARKLE} Successfully [posted](${message.url}) buttons in <#${channel.id}>`,
    });
  },
};

export default command;
