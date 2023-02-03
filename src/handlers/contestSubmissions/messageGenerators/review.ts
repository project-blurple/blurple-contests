import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { ContestSubmission, ContestSubmissionStatus } from "../../../database/models/ContestSubmission.model";
import type { MessageCreateOptions, MessageEditOptions, TextBasedChannel } from "discord.js";
import { createModalTextInput, getModalTextInput, modals } from "../../interactions/modals";
import { Contest } from "../../../database/models/Contest.model";
import type { ContestSubmissionDocument } from "../../../database/models/ContestSubmission.model";
import Emojis from "../../../constants/emojis";
import { buttonComponents } from "../../interactions/components";
import { generateSubmissionEmbed } from ".";
import { generateSubmittedMessage } from "./submitted";

buttonComponents.set("contest-review-approve", {
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
    const message = await (interaction.client.channels.resolve(contest.submissionChannelId) as TextBasedChannel).send(generateSubmittedMessage(contestSubmission));
    contestSubmission.messageLink = message.url;

    await contestSubmission.save();
    await interaction.deferUpdate();
    return void interactionMessage?.delete();
  },
});

buttonComponents.set("contest-review-reject", {
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
      components: [
        createModalTextInput({
          style: TextInputStyle.Paragraph,
          customId: "reason",
          label: "Reason",
          placeholder: "The submission is not good enough. (don't write this)",
          required: true,
        }),
      ],
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
            "Send <@536491357322346499> (`BlurpleMail#8368`) a direct message for more information about its rejection if you feel that the decision is unfair.",
          ].join("\n"),
        embeds: [generateSubmissionEmbed(contestSubmission)],
      }).catch())
        .catch();
    });
  },
});

export function generateReviewMessage(submission: ContestSubmissionDocument): Omit<MessageEditOptions, "content" | "embeds" | "flags"> & Pick<MessageCreateOptions, "content" | "embeds"> {
  return {
    content: `Submission by <@${submission.authorId}> - needs review.`,
    embeds: [generateSubmissionEmbed(submission)],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            customId: "contest-review-approve",
            label: "Approve",
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            customId: "contest-review-reject",
            label: "Reject (with reason)",
          },
        ],
      },
    ],
  };
}
