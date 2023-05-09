import type { MessageCreateOptions, MessageEditOptions } from "discord.js";
import { ButtonStyle, ComponentType } from "discord.js";
import config from "../../../config";
import Emojis from "../../../constants/emojis";
import { Contest } from "../../../database/models/Contest.model";
import type { ContestSubmissionDocument } from "../../../database/models/ContestSubmission.model";
import { ContestSubmission } from "../../../database/models/ContestSubmission.model";
import { ContestVoteEntry } from "../../../database/models/ContestVoteEntry.model";
import mainLogger from "../../../utils/logger/main";
import { buttonComponents } from "../../interactions/components";
import { generateSubmissionEmbed } from ".";

function generateSubmittedMessage(submission: ContestSubmissionDocument, votingEnd = false): Omit<MessageEditOptions, "content" | "embeds" | "flags"> & Pick<MessageCreateOptions, "content" | "embeds"> {
  return {
    content: `Submission by <@${submission.authorId}>.`,
    embeds: [generateSubmissionEmbed(submission)],
    allowedMentions: { users: [submission.authorId] },
    components: votingEnd ?
      [] :
      [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Primary,
              customId: "contest-submission-vote",
              label: "Vote",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              customId: "contest-submission-admin",
              emoji: Emojis.HAMMER,
            },
          ],
        },
      ],
  };
}

export default generateSubmittedMessage;

buttonComponents.set("contest-submission-vote", {
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
      buttonComponents.set(`${interaction.id}-remove-vote`, {
        allowedUsers: [interaction.user.id],
        async callback(buttonInteraction) {
          await registeredVote.remove();
          void buttonInteraction.update({ content: `${Emojis.THUMBSUP} Your vote has been removed.`, components: [] });
        },
      });

      return void interaction.reply({
        content: `${Emojis.ANGER} You have already voted for this submission.`,
        ephemeral: true,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Danger,
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

buttonComponents.set("contest-submission-admin", {
  allowedUsers: "all",
  async callback(interaction) {
    if (!config.adminRoles.some(allowedRole => interaction.member.roles.cache.has(allowedRole))) {
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

    buttonComponents.set(`${interaction.id}-remove-submission`, {
      allowedUsers: [interaction.user.id],
      async callback(buttonInteraction) {
        mainLogger.info(`Staff member ${buttonInteraction.user.tag} (${buttonInteraction.user.id}) removed submission ${submissionId} from contest ${contestId}`);
        await submission.remove();
        await message.delete();
        void buttonInteraction.update({ content: `${Emojis.THUMBSUP} The submission has been removed.`, components: [] });
      },
    });

    return void interaction.reply({
      content: [
        `${Emojis.SPARKLE} **${submission.title}** by <@${submission.authorId}>.`,
        `${Emojis.STAR} Votes: **(${voteEntries.length})**\n${voteEntries.map(vote => `> <@${vote.userId}>`).join("\n")}`,
      ].join("\n\n"),
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Danger,
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
