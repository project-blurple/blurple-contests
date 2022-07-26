import { Contest } from "../../../database";
import Emojis from "../../../constants/emojis";
import type { SlashCommand } from "..";
import { contestToEmbed } from "./list";
import dateAutocomplete from "../../../constants/autocompletes/date";
import { setupContestInteractions } from "../../../modules/contestSubmissions/setupContestInteractions";
import { setupJobs } from "../../../modules/contestSubmissions";

const command: SlashCommand = {
  description: "Create a new contest",
  options: [
    {
      type: "STRING",
      name: "name",
      description: "The name of the contest",
      required: true,
    },
    {
      type: "STRING",
      name: "submission_type",
      description: "The type of entry (image or text)",
      choices: [
        { name: "Image submission", value: "image" },
        { name: "Text submission", value: "text" },
      ],
      required: true,
    },
    {
      type: "STRING",
      name: "submission_open_date",
      description: "The date the submissions are opened (so people can submit)",
      autocomplete: true,
      required: true,
    },
    {
      type: "STRING",
      name: "submission_close_date",
      description: "The date the submissions are closed (so people can't submit anymore)",
      autocomplete: true,
      required: true,
    },
    {
      type: "STRING",
      name: "voting_open_date",
      description: "The date the voting is opened (so people can vote)",
      autocomplete: true,
      required: true,
    },
    {
      type: "STRING",
      name: "voting_close_date",
      description: "The date the voting is closed (so people can't vote anymore)",
      autocomplete: true,
      required: true,
    },
    {
      type: "CHANNEL",
      name: "review_channel",
      description: "The channel to post submissions to for review",
      channelTypes: ["GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_TEXT"],
      required: true,
    },
    {
      type: "CHANNEL",
      name: "submission_channel",
      description: "The channel to post submissions to",
      channelTypes: ["GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_TEXT"],
      required: true,
    },
    {
      type: "INTEGER",
      name: "max_submissions_per_user",
      description: "The number of submissions allowed per user",
    },
    {
      type: "INTEGER",
      name: "max_votes_per_user",
      description: "The number of votes allowed per user",
    },
  ],
  autocompletes: {
    /* eslint-disable camelcase */
    submission_open_date: dateAutocomplete,
    submission_close_date: dateAutocomplete,
    voting_open_date: dateAutocomplete,
    voting_close_date: dateAutocomplete,
    /* eslint-enable camelcase */
  },
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
};

export default command;
