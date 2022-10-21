import { ApplicationCommandOptionType, ButtonStyle, ChannelType, ComponentType } from "discord.js";
import type { ChatInputCommand } from "..";
import Emojis from "../../../constants/emojis";
import type { TextBasedChannel } from "discord.js";
import contestAutocomplete from "../../../constants/autocompletes/contest";

const command: ChatInputCommand = {
  description: "Post submission buttons in a channel",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "contest",
      description: "The name of the contest you want to edit",
      autocomplete: true,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Channel,
      name: "channel",
      description: "The channel to post the button to",
      channelTypes: [
        ChannelType.PrivateThread,
        ChannelType.PublicThread,
        ChannelType.GuildText,
      ],
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
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Primary,
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

export default { ...command } as const;
