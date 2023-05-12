import type { TextBasedChannel } from "discord.js";
import { ApplicationCommandOptionType, ButtonStyle, ChannelType, ComponentType } from "discord.js";
import type { SecondLevelChatInputCommand } from "..";
import contestAutocomplete from "../../../constants/autocompletes/contest";
import Emojis from "../../../constants/emojis";

export default {
  name: "post_button",
  description: "Post submission buttons in a channel",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "contest",
      description: "The name of the contest you want to edit",
      autocomplete: contestAutocomplete,
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
        ChannelType.GuildAnnouncement,
      ],
      required: true,
    },
  ],
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
} satisfies SecondLevelChatInputCommand;
