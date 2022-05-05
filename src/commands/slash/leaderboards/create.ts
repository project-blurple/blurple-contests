/* eslint-disable max-lines-per-function */
import { Constants, GuildMember } from "discord.js";
import type { MessageEditOptions, MessageOptions, TextBasedChannel, TextInputComponentOptions } from "discord.js";
import { getModalTextInput, modals } from "../../../handlers/interactions/modals";
import Emojis from "../../../constants/emojis";
import { Leaderboard } from "../../../database";
import type { LeaderboardDocument } from "../../../database";
import type { SlashCommand } from "..";
import { components } from "../../../handlers/interactions/components";
import config from "../../../config";

const command: SlashCommand = {
  description: "Create a leaderboard",
  options: [
    {
      type: "STRING",
      name: "name",
      description: "The name of the contest",
      required: true,
    },
    {
      type: "CHANNEL",
      name: "post_to_channel",
      description: "The channel to post the leaderboard to",
      channelTypes: ["GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_TEXT"],
      required: true,
    },
  ],
  execute(interaction) {
    const name = interaction.options.getString("name", true);
    const channel = interaction.options.getChannel("post_to_channel", true) as TextBasedChannel;

    void interaction.showModal({
      title: "Create Leaderboard",
      customId: `${interaction.id}-create-leaderboard`,
      components: ([
        {
          type: "TEXT_INPUT",
          style: "SHORT",
          customId: "name",
          label: "Name",
          placeholder: "Karaoke Contest Leaderboard",
          value: name,
          required: true,
        },
        {
          type: "TEXT_INPUT",
          style: "PARAGRAPH",
          customId: "table",
          label: "Scores (multiline)",
          placeholder: "Wumpus: 2\nNelly: 1\nClyde: 3",
          required: false,
        },
      ] as TextInputComponentOptions[]).filter(Boolean).map(component => ({
        type: "ACTION_ROW",
        components: [component],
      })),
    });

    return void modals.set(`${interaction.id}-create-leaderboard`, async modal => {
      const table = getModalTextInput(modal.components, "table")!;

      const leaderboard = new Leaderboard({ name, table });
      const message = await channel.send(generateMessage(leaderboard));
      leaderboard.messageLink = message.url;

      await leaderboard.save();
      return modal.reply({
        content: `${Emojis.THUMBSUP} Leaderboard has been created successfully, go [here](${leaderboard.messageLink}) to view it and manage it.`,
      });
    });
  },
};

export default command;

function getScoresFromTableString(table: string): Array<[string, number]> {
  const scores: Record<string, number> = {};

  table.split("\n").forEach(line => {
    const [name, score] = line.split(":");
    if (name && score) scores[name.trim()] = parseInt(score.trim());
  });

  return Object.entries(scores).sort(([, a], [, b]) => b - a);
}

function generateMessage(leaderboard: LeaderboardDocument): Omit<MessageEditOptions, "embeds" | "flags"> & Pick<MessageOptions, "embeds"> {
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
        color: Constants.Colors.BLURPLE,
        footer: { text: leaderboard.leaderboardId },
      },
    ],
    components: [
      {
        type: "ACTION_ROW",
        components: [
          {
            type: "BUTTON",
            style: "SECONDARY",
            customId: "leaderboard-edit",
            emoji: Emojis.HAMMER,
          },
        ],
      },
    ],
  };
}

components.set("leaderboard-edit", {
  type: "BUTTON",
  allowedUsers: "all",
  async callback(interaction) {
    if (!config.adminRoles.some(allowedRole => {
      const roles = interaction.member instanceof GuildMember ? interaction.member.roles.cache.map(role => role.id) : interaction.member?.roles ?? [];
      return roles.includes(allowedRole);
    })) {
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
      customId: `${interaction.id}-edit-leaderboard`,
      components: ([
        {
          type: "TEXT_INPUT",
          style: "SHORT",
          customId: "name",
          label: "Name",
          placeholder: "Karaoke Contest Leaderboard",
          value: leaderboard.name,
          required: true,
        },
        {
          type: "TEXT_INPUT",
          style: "PARAGRAPH",
          customId: "table",
          label: "Scores (multiline)",
          placeholder: "Wumpus: 2\nNelly: 1\nClyde: 3",
          value: leaderboard.table,
          required: false,
        },
      ] as TextInputComponentOptions[]).filter(Boolean).map(component => ({
        type: "ACTION_ROW",
        components: [component],
      })),
    });

    return void modals.set(`${interaction.id}-edit-leaderboard`, modal => {
      const table = getModalTextInput(modal.components, "table")!;
      leaderboard.table = table;
      void leaderboard.save();

      return void modal.update(generateMessage(leaderboard));
    });
  },
});
