/* eslint-disable max-lines-per-function */
import { Contest, ContestSubmission, ContestSubmissionStatus } from "../../../database";
import type { MessageEditOptions, MessageOptions, TextBasedChannel, TextInputComponentOptions } from "discord.js";
import { getModalTextInput, modals } from "../../../handlers/interactions/modals";
import type { ContestSubmissionDocument } from "../../../database";
import Emojis from "../../../constants/emojis";
import { components } from "../../../handlers/interactions/components";
import { generateSubmissionEmbed } from ".";
import { generateSubmittedMessage } from "./submitted";

components.set("contest-review-approve", {
  type: "BUTTON",
  allowedUsers: "all",
  async callback(interaction) {
    const interactionMessage = await interaction.channel!.messages.fetch(interaction.message.id).catch(() => null);
    const [contestId, submissionId] = interactionMessage?.embeds[0]?.footer?.text.split("-") ?? [];

    const contest = await Contest.findOne({ contestId });
    const contestSubmission = await ContestSubmission.findOne({ contestId, submissionId });

    if (!contestId || !submissionId || !contest || !contestSubmission) {
      return void interaction.reply({
        content: `${Emojis.ANGER} An unknown error occurred when trying to approve this submission. Looks like the submission is no longer registered...`,
        ephemeral: true,
      });
    }

    contestSubmission.status = ContestSubmissionStatus.APPROVED;
    const message = await (interaction.client.channels.resolve(contest.submissionChannelId) as TextBasedChannel).send(await generateSubmittedMessage(contestSubmission));
    contestSubmission.messageLink = message.url;

    await contestSubmission.save();
    await interaction.deferUpdate();
    return void interactionMessage?.delete();
  },
});

components.set("contest-review-reject", {
  type: "BUTTON",
  allowedUsers: "all",
  async callback(interaction) {
    const interactionMessage = await interaction.channel!.messages.fetch(interaction.message.id).catch(() => null);
    const [contestId, submissionId] = interactionMessage?.embeds[0]?.footer?.text.split("-") ?? [];

    const contest = await Contest.findOne({ contestId });

    if (!contestId || !submissionId || !contest) {
      return void interaction.reply({
        content: `${Emojis.ANGER} An unknown error occurred when trying to approve this submission. Looks like the submission is no longer registered...`,
        ephemeral: true,
      });
    }

    void interaction.showModal({
      title: "Reject submission",
      customId: `contest-review-reject-modal-${contestId}-${submissionId}`,
      components: ([
        {
          type: "TEXT_INPUT",
          style: "PARAGRAPH",
          customId: "reason",
          label: "Reason",
          placeholder: "The submission is not good enough. (don't write this)",
          required: true,
        },
      ] as TextInputComponentOptions[]).filter(Boolean).map(component => ({
        type: "ACTION_ROW",
        components: [component],
      })),
    });

    return void modals.set(`contest-review-reject-modal-${contestId}-${submissionId}`, async modal => {
      const reason = getModalTextInput(modal.components, "reason")!;

      const contestSubmission = await ContestSubmission.findOne({ contestId, submissionId });
      if (!contestSubmission) {
        return void modal.reply({
          content: `${Emojis.ANGER} An unknown error occurred when trying to approve this submission. Looks like the submission is no longer registered...`,
          ephemeral: true,
        });
      }

      contestSubmission.status = ContestSubmissionStatus.REJECTED;
      contestSubmission.rejectReason = reason;
      contestSubmission.messageLink = "deleted";

      await contestSubmission.save();
      await modal.deferUpdate({});
      void interactionMessage?.delete();

      return void modal.client.users.fetch(contestSubmission.authorId).then(user => user.send({
        content:
          [
            `${Emojis.ANGER} Your submission to the contest **${contest.name}** was rejected, reason being:`,
            reason
              .split("\n")
              .map(line => `> ${line}`)
              .join("\n"),
            "Send <@971015635716935691> (`BlurpleMail#8368`) a direct message for more information about its rejection if you feel that the decision is unfair.",
          ].join("\n"),
        embeds: [generateSubmissionEmbed(contestSubmission)],
      }).catch())
        .catch();
    });
  },
});

export function generateReviewMessage(submission: ContestSubmissionDocument): Omit<MessageEditOptions, "embeds" | "flags"> & Pick<MessageOptions, "embeds"> {
  return {
    content: `Submission by <@${submission.authorId}> - needs review.`,
    embeds: [generateSubmissionEmbed(submission)],
    components: [
      {
        type: "ACTION_ROW",
        components: [
          {
            type: "BUTTON",
            style: "SUCCESS",
            customId: "contest-review-approve",
            label: "Approve",
          },
          {
            type: "BUTTON",
            style: "DANGER",
            customId: "contest-review-reject",
            label: "Reject (with reason)",
          },
        ],
      },
    ],
  };
}
