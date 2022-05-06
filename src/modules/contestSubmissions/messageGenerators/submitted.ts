/* eslint-disable max-lines-per-function */
import { Contest, ContestSubmission, ContestVoteEntry } from "../../../database";
import type { MessageEditOptions, MessageOptions } from "discord.js";
import type { ContestSubmissionDocument } from "../../../database";
import Emojis from "../../../constants/emojis";
import { GuildMember } from "discord.js";
import { components } from "../../../handlers/interactions/components";
import config from "../../../config";
import { generateSubmissionEmbed } from ".";
import { mainLogger } from "../../../utils/logger";

export async function generateSubmittedMessage(submission: ContestSubmissionDocument, votingEnd = false): Promise<Omit<MessageEditOptions, "embeds" | "flags"> & Pick<MessageOptions, "embeds">> {
  const votes = votingEnd ? await ContestVoteEntry.find({ contestId: submission.contestId, submissionId: submission.submissionId }).then(list => list.length) : null;

  return {
    content: `${votes === null ? "" : `${Emojis.STAR} **${votes} |**`} Submission by <@${submission.authorId}>.`,
    embeds: [generateSubmissionEmbed(submission)],
    allowedMentions: { users: [submission.authorId]},
    components: votingEnd ?
      [] :
      [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              style: "PRIMARY",
              customId: "contest-submission-vote",
              label: "Vote",
            },
            {
              type: "BUTTON",
              style: "SECONDARY",
              customId: "contest-submission-admin",
              emoji: Emojis.HAMMER,
            },
          ],
        },
      ],
  };
}

components.set("contest-submission-vote", {
  type: "BUTTON",
  allowedUsers: "all",
  async callback(interaction) {
    const message = await interaction.channel!.messages.fetch(interaction.message.id).catch(() => null);
    const [contestId, submissionId] = message?.embeds[0]?.footer?.text.split("-") ?? [];

    const contest = await Contest.findOne({ contestId });
    const contestSubmission = await ContestSubmission.findOne({ contestId, submissionId });

    if (!contestId || !submissionId || !contest || !contestSubmission) {
      return void interaction.reply({
        content: `${Emojis.ANGER} An unknown error occurred when trying to register your vote.`,
        ephemeral: true,
      });
    }

    if (contestSubmission.authorId === interaction.user.id) {
      return void interaction.reply({
        content: `${Emojis.WEEWOO} You cannot vote for your own submission. Good try though.`,
        ephemeral: true,
      });
    }

    // check voting dates
    const now = new Date();
    if (now < contest.votingOpenedDate) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Voting period for this contest starts <t:${Math.round(contest.votingOpenedDate.getTime() / 1000)}:R>.`,
        ephemeral: true,
      });
    }
    if (now > contest.votingClosedDate) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Voting period for this contest closed <t:${Math.round(contest.votingClosedDate.getTime() / 1000)}:R>.`,
        ephemeral: true,
      });
    }

    const votes = await ContestVoteEntry.find({ contestId, userId: interaction.user.id });
    const registeredVote = votes.find(vote => vote.submissionId === submissionId);

    if (registeredVote) {
      components.set(`${interaction.id}-remove-vote`, {
        type: "BUTTON",
        allowedUsers: [interaction.user.id],
        async callback(buttonInteraction) {
          await registeredVote.remove();
          void buttonInteraction.update({ content: `${Emojis.THUMBSUP} Your vote has been removed.`, components: []});
        },
      });

      return void interaction.reply({
        content: `${Emojis.ANGER} You have already voted for this submission.`,
        ephemeral: true,
        components: [
          {
            type: "ACTION_ROW",
            components: [
              {
                type: "BUTTON",
                style: "DANGER",
                customId: `${interaction.id}-remove-vote`,
                label: "Remove this vote",
              },
            ],
          },
        ],
      });
    }

    if (votes.length >= contest.maxVotesPerUser) {
      const submissionsVoted = await ContestSubmission.find({ contestId }).then(submissions => submissions.filter(submission => votes.some(vote => vote.submissionId === submission.submissionId)));
      return void interaction.reply({
        content: `${Emojis.ANGER} You have reached the maximum number of votes for this contest. You've currently voted for the following submissions:\n${votes.map(vote => {
          const submission = submissionsVoted.find(sub => sub.submissionId === vote.submissionId);
          return submission ? `> [${submission.title}](${submission.messageLink})` : "*Unknown vote*";
        }).join("\n")}`,
        ephemeral: true,
      });
    }

    const contestVoteEntry = new ContestVoteEntry({ contestId, submissionId, userId: interaction.user.id });
    await contestVoteEntry.save();

    return void interaction.reply({
      content: `${Emojis.THUMBSUP} Your vote has been registered.`,
      ephemeral: true,
    });
  },
});

components.set("contest-submission-admin", {
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
    const [contestId, submissionId] = message?.embeds[0]?.footer?.text.split("-") ?? [];

    const contest = await Contest.findOne({ contestId });
    const submission = await ContestSubmission.findOne({ contestId, submissionId });

    if (!message || !contestId || !submissionId || !contest || !submission) {
      return void interaction.reply({
        content: `${Emojis.ANGER} It doesn't look like this is a submission post, or the contest has been deleted.`,
        ephemeral: true,
      });
    }

    const voteEntries = await ContestVoteEntry.find({ contestId, submissionId });

    components.set(`${interaction.id}-remove-submission`, {
      type: "BUTTON",
      allowedUsers: [interaction.user.id],
      async callback(buttonInteraction) {
        mainLogger.info(`Staff member ${buttonInteraction.user.tag} (${buttonInteraction.user.id}) removed submission ${submissionId} from contest ${contestId}`);
        await submission.remove();
        await message.delete();
        void buttonInteraction.update({ content: `${Emojis.THUMBSUP} The submission has been removed.`, components: []});
      },
    });

    return void interaction.reply({
      content: [
        `${Emojis.SPARKLE} **${submission.title}** by <@${submission.authorId}>.`,
        `${Emojis.STAR} Votes: **(${voteEntries.length})**\n${voteEntries.map(vote => `> <@${vote.userId}>`).join("\n")}`,
      ].join("\n\n"),
      components: [
        {
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              style: "DANGER",
              customId: `${interaction.id}-remove-submission`,
              label: "Delete submission",
            },
          ],
        },
      ],
      ephemeral: true,
    });
  },
});
