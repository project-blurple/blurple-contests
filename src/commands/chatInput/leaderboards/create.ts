import type { MessageCreateOptions, MessageEditOptions, PrivateThreadChannel, PublicThreadChannel, TextChannel } from "discord.js";
import { ApplicationCommandOptionType, ButtonStyle, ChannelType, Colors, ComponentType, TextInputStyle } from "discord.js";
import type { SecondLevelChatInputCommand } from "..";
import config from "../../../config";
import Emojis from "../../../constants/emojis";
import type { LeaderboardDocument } from "../../../database/models/Leaderboard.model";
import { Leaderboard } from "../../../database/models/Leaderboard.model";
import { buttonComponents } from "../../../handlers/interactions/components";
import { createModalTextInput, getModalTextInput, modals } from "../../../handlers/interactions/modals";

export default {
  name: "create",
  description: "Create a leaderboard",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "name",
      description: "The name of the contest",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Channel,
      name: "post_to_channel",
      description: "The channel to post the leaderboard to",
      channelTypes: [
        ChannelType.PrivateThread,
        ChannelType.PublicThread,
        ChannelType.GuildText,
      ],
      required: true,
    },
  ],
  execute(interaction) {
    const channel = interaction.options.getChannel("post_to_channel", true) as PrivateThreadChannel | PublicThreadChannel | TextChannel;

    modals.set(`${interaction.id}:create-leaderboard`, async modal => {
      const name = getModalTextInput(modal.components, "name")!;
      const table = getModalTextInput(modal.components, "table") ?? "";

      const leaderboard = new Leaderboard({ name, table });
      const message = await channel.send(generateMessage(leaderboard));
      leaderboard.messageLink = message.url;

      await leaderboard.save();
      return void modal.reply(`${Emojis.THUMBSUP} Leaderboard has been created successfully, go [here](${leaderboard.messageLink}) to view it and manage it.`);
    });

    void interaction.showModal({
      title: "Create Leaderboard",
      customId: `${interaction.id}:create-leaderboard`,
      components: [
        createModalTextInput({
          style: TextInputStyle.Short,
          customId: "name",
          label: "Name",
          placeholder: "Karaoke Contest Leaderboard",
          value: interaction.options.getString("name", true),
          required: true,
        }),
        createModalTextInput({
          style: TextInputStyle.Paragraph,
          customId: "table",
          label: "Scores (multiline)",
          placeholder: "Wumpus: 2\nNelly: 1\nClyde: 3",
          required: false,
        }),
      ],
    });
  },
} satisfies SecondLevelChatInputCommand;

function getScoresFromTableString(table: string): Array<[string, number]> {
  const scores: Record<string, number> = {};

  table.split("\n").forEach(line => {
    const [name, score] = line.split(":");
    if (name && score) scores[name.trim()] = parseInt(score.trim(), 10);
  });

  return Object.entries(scores).sort(([, a], [, b]) => b - a);
}

function generateMessage(leaderboard: LeaderboardDocument): Omit<MessageEditOptions, "content" | "embeds" | "flags"> & Pick<MessageCreateOptions, "content" | "embeds"> {
  const scores = getScoresFromTableString(leaderboard.table ?? "");

  return {
    embeds: [
      {
        title: leaderboard.name,
        fields: [
          {
            name: "Name",
            value: scores
              .map(([name], index) => `**${index + 1}.** ${name}`)
              .join("\n") || "*No scores yet*",
            inline: true,
          },
          {
            name: "Score",
            value: scores
              .map(([, score]) => String(score))
              .join("\n") || "*No scores yet*",
            inline: true,
          },
        ],
        color: Colors.Blurple,
        footer: { text: leaderboard.leaderboardId },
      },
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            customId: "leaderboard-edit",
            emoji: Emojis.HAMMER,
          },
        ],
      },
    ],
  };
}

buttonComponents.set("leaderboard-edit", {
  allowedUsers: "all",
  async callback(interaction) {
    if (!config.adminRoles.some(allowedRole => interaction.member.roles.cache.has(allowedRole))) {
      return void interaction.reply({
        content: `${Emojis.ANGER} You don't have permission to do that.`,
        ephemeral: true,
      });
    }

    const message = await interaction.channel!.messages.fetch(interaction.message.id).catch(() => null);
    const leaderboardId = message?.embeds[0]?.footer?.text;

    const leaderboard = await Leaderboard.findOne({ leaderboardId });
    if (!leaderboard) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Leaderboard not found.`,
        ephemeral: true,
      });
    }

    void interaction.showModal({
      title: "Edit Leaderboard",
      customId: `${interaction.id}:edit-leaderboard`,
      components: [
        createModalTextInput({
          style: TextInputStyle.Short,
          customId: "name",
          label: "Name",
          placeholder: "Karaoke Contest Leaderboard",
          value: leaderboard.name,
          required: true,
        }),
        createModalTextInput({
          style: TextInputStyle.Paragraph,
          customId: "table",
          label: "Scores (multiline)",
          placeholder: "Wumpus: 2\nNelly: 1\nClyde: 3",
          ...leaderboard.table && { value: leaderboard.table },
          required: false,
        }),
      ],
    });

    return void modals.set(`${interaction.id}:edit-leaderboard`, modal => {
      const table = getModalTextInput(modal.components, "table")!;
      leaderboard.table = table;
      void leaderboard.save();

      if (!modal.isFromMessage()) return;
      return void modal.update(generateMessage(leaderboard));
    });
  },
});
