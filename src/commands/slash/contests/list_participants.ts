/* eslint-disable max-lines-per-function */
import { ContestSubmission, ContestSubmissionStatus, ContestVoteEntry } from "../../../database";
import { Constants } from "discord.js";
import Emojis from "../../../constants/emojis";
import type { SlashCommand } from "..";
import contestAutocomplete from "../../../constants/autocompletes/contest";

const command: SlashCommand = {
  description: "List participants of a contest",
  options: [
    {
      type: "STRING",
      name: "contest",
      description: "The name of the contest you want to edit",
      autocomplete: true,
      required: true,
    },
    {
      type: "STRING",
      name: "filter",
      description: "Filter which participants you want to get sent",
      choices: [
        { name: "Everyone that have submit something", value: "all" },
        { name: "Everyone that have submit something, and it's approved", value: "approved" },
        { name: "Everyone that have submit something, and it's approved or pending", value: "not-rejected" },
        { name: "Everyone that have submit something, and it's rejected", value: "rejected" },
      ],
      required: true,
    },
    {
      type: "STRING",
      name: "format",
      description: "Format the output",
      choices: [
        { name: "Embed Overview", value: "embed-overview" },
        { name: "User IDs only", value: "user-ids" },
      ],
    },
  ],
  autocompletes: {
    contest: contestAutocomplete,
  },
  async execute(interaction) {
    const contestId = interaction.options.getString("contest", true);
    const filter = interaction.options.getString("filter", true) as "all" | "approved" | "not-rejected" | "rejected";
    const format = (interaction.options.getString("format", false) ?? "embed-overview") as "embed-overview" | "user-ids";

    const submissionVotes = await ContestVoteEntry.find({ contestId });
    const submissions = await ContestSubmission.find({ contestId }).then(submissionList => submissionList.filter(submission => {
      if (filter === "approved") return submission.status === ContestSubmissionStatus.APPROVED;
      if (filter === "not-rejected") return submission.status !== ContestSubmissionStatus.REJECTED;
      if (filter === "rejected") return submission.status === ContestSubmissionStatus.REJECTED;
      return true;
    }));

    if (format === "embed-overview") {
      const submissionsSorted = submissions.sort((a, b) => {
        const aVotes = submissionVotes.filter(vote => vote.submissionId === a.submissionId).length;
        const bVotes = submissionVotes.filter(vote => vote.submissionId === b.submissionId).length;
        return bVotes - aVotes;
      });

      // split submissionsSorted up into chunks of 40 since "<mention>\n" is 24 characters and 1024/24 = 40.96, so we have room for 40 rows
      const chunks = [];
      let chunk = [];
      for (const submission of submissionsSorted) {
        if (chunk.length === 40) {
          chunks.push(chunk);
          chunk = [];
        }
        chunk.push(submission);
      }
      chunks.push(chunk);

      return void interaction.reply({
        content: `${Emojis.THUMBSUP} Here are the participants of the contest: (filter: ${filter}) ${submissionsSorted.length ? "" : "\n> *No participants matched your filter*"}`,
        embeds: chunks.map((submissionChunk, chunkIndex) => ({
          fields: [
            {
              name: "Participant",
              value: submissionChunk.map((submission, index) => `**${chunkIndex * 40 + index + 1}.** <@${submission.authorId}>`).join("\n"),
              inline: true,
            },
            {
              name: "Votes",
              value: submissionChunk.map(submission => String(submissionVotes.filter(vote => vote.submissionId === submission.submissionId).length)).join("\n"),
              inline: true,
            },
            {
              name: "Status",
              value: submissionChunk.map(submission => submission.status === ContestSubmissionStatus.REJECTED ? "REJECTED" : `[${submission.status}](${submission.messageLink})`).join("\n"),
              inline: true,
            },
          ],
          color: Constants.Colors.BLURPLE,
        })),
      });
    }

    return void interaction.reply({
      content: `${Emojis.THUMBSUP} Here are the participants of the contest: (filter: ${filter})\n> ${submissions
        .map(submission => submission.authorId)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .join(", ") || "> *No participants matched your filter*"
      }`,
    });
  },
};

export default command;
