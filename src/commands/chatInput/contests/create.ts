import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import type { SecondLevelChatInputCommand } from "..";
import dateAutocomplete from "../../../constants/autocompletes/date";
import Emojis from "../../../constants/emojis";
import { Contest } from "../../../database/models/Contest.model";
import { setupJobs } from "../../../handlers/contestSubmissions";
import setupContestInteractions from "../../../handlers/contestSubmissions/setupContestInteractions";
import { contestToEmbed } from "./list";

export default {
  name: "create",
  description: "Create a new contest",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "name",
      description: "The name of the contest",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "submission_type",
      description: "The type of entry (image or text)",
      choices: [
        { name: "Image submission", value: "image" },
        { name: "Text submission", value: "text" },
      ],
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "submission_open_date",
      description: "The date the submissions are opened (so people can submit)",
      autocomplete: dateAutocomplete,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "submission_close_date",
      description: "The date the submissions are closed (so people can't submit anymore)",
      autocomplete: dateAutocomplete,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "voting_open_date",
      description: "The date the voting is opened (so people can vote)",
      autocomplete: dateAutocomplete,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "voting_close_date",
      description: "The date the voting is closed (so people can't vote anymore)",
      autocomplete: dateAutocomplete,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Channel,
      name: "review_channel",
      description: "The channel to post submissions to for review",
      channelTypes: [
        ChannelType.PrivateThread,
        ChannelType.PublicThread,
        ChannelType.GuildText,
      ],
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Channel,
      name: "submission_channel",
      description: "The channel to post submissions to",
      channelTypes: [
        ChannelType.PrivateThread,
        ChannelType.PublicThread,
        ChannelType.GuildText,
      ],
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Integer,
      name: "max_submissions_per_user",
      description: "The number of submissions allowed per user",
    },
    {
      type: ApplicationCommandOptionType.Integer,
      name: "max_votes_per_user",
      description: "The number of votes allowed per user",
    },
  ],
  async execute(interaction) {
    const name = interaction.options.getString("name", true);
    const submissionType = interaction.options.getString("submission_type", true) as "image" | "text";
    const submissionOpenedDate = parseInt(interaction.options.getString("submission_open_date", true), 10);
    const submissionClosedDate = parseInt(interaction.options.getString("submission_close_date", true), 10);
    const votingOpenedDate = parseInt(interaction.options.getString("voting_open_date", true), 10);
    const votingClosedDate = parseInt(interaction.options.getString("voting_close_date", true), 10);
    const reviewChannelId = interaction.options.getChannel("review_channel", true).id;
    const submissionChannelId = interaction.options.getChannel("submission_channel", true).id;
    const maxSubmissionsPerUser = interaction.options.getInteger("max_submissions_per_user") ?? 1;
    const maxVotesPerUser = interaction.options.getInteger("max_votes_per_user") ?? 1;

    if (!submissionOpenedDate || !submissionClosedDate || !votingOpenedDate || !votingClosedDate) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Invalid date`,
        ephemeral: true,
      });
    }

    if (submissionOpenedDate > submissionClosedDate) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Submission open date must be before submission close date`,
        ephemeral: true,
      });
    }

    if (submissionClosedDate > votingOpenedDate) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Submission close date must be before voting open date`,
        ephemeral: true,
      });
    }

    if (votingOpenedDate > votingClosedDate) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Voting open date must be before voting close date`,
        ephemeral: true,
      });
    }

    const contest = new Contest({ name, submissionType, submissionOpenedDate, submissionClosedDate, votingOpenedDate, votingClosedDate, reviewChannelId, submissionChannelId, maxSubmissionsPerUser, maxVotesPerUser });
    await contest.save();

    setupContestInteractions(contest);
    setupJobs(contest, interaction.client);

    return void interaction.reply({
      content: `${Emojis.TICKYES} Successfully created a new contest.`,
      embeds: [contestToEmbed(contest)],
    });
  },
} satisfies SecondLevelChatInputCommand;
