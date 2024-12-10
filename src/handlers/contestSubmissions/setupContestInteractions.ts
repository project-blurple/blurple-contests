import type { TextBasedChannel } from "discord.js";
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import type { ContestDocument } from "../../database/models/Contest.model";
import Emojis from "../../constants/emojis";
import { Contest } from "../../database/models/Contest.model";
import { ContestSubmission, ContestSubmissionStatus } from "../../database/models/ContestSubmission.model";
import { testLink } from "../../utils/links";
import { buttonComponents } from "../interactions/components";
import { createModalTextInput, getModalTextInput, modals } from "../interactions/modals";
import { generateReviewMessage, generateSubmissionEmbed } from "./messageGenerators";

export default function setupContestInteractions({ contestId, submissionType, reviewChannelId }: ContestDocument): void {
  buttonComponents.set(`submit-contest-${contestId}`, {
    allowedUsers: "all",
    async callback(interaction) {
      const contest = await Contest.findOne({ contestId });
      if (!contest) {
        return void interaction.reply({
          content: `${Emojis.ANGER} Contest not found, please try later.`,
          ephemeral: true,
        });
      }

      // check submission dates
      const now = new Date();
      if (now < contest.submissionOpenedDate) {
        return void interaction.reply({
          content: `${Emojis.ANGER} Submissions for this contest opens <t:${Math.round(contest.submissionOpenedDate.getTime() / 1000)}:R>.`,
          ephemeral: true,
        });
      }
      if (now > contest.submissionClosedDate) {
        return void interaction.reply({
          content: `${Emojis.ANGER} Submissions for this contest closed <t:${Math.round(contest.submissionClosedDate.getTime() / 1000)}:R>.`,
          ephemeral: true,
        });
      }

      // check if user already submitted
      const userSubmissions = await ContestSubmission.find({ contestId, authorId: interaction.user.id }).then(submissions => submissions.filter(submission => submission.status !== ContestSubmissionStatus.REJECTED));
      if (userSubmissions.length >= contest.maxSubmissionsPerUser) {
        return void interaction.reply({
          content: `${Emojis.ANGER} You have reached the maximum number of submissions for this contest.`,
          ephemeral: true,
        });
      }

      return void interaction.showModal({
        title: `Submission for ${contest.name}`,
        customId: `submit-contest-modal-${contestId}`,
        components: [
          createModalTextInput({
            style: TextInputStyle.Short,
            customId: "title",
            label: "Submission title",
            placeholder: "The Big Wumpus",
            minLength: 1,
            maxLength: 32,
            required: true,
          }),
          createModalTextInput(contest.submissionType === "text" ?
            {
              style: TextInputStyle.Paragraph,
              customId: "submission",
              label: "Submission text",
              placeholder: "The Big Wumpus ate a big apple and became the apple. The End.",
              minLength: 1,
              maxLength: 2048,
              required: true,
            } :
            {
              style: TextInputStyle.Short,
              customId: "submission",
              label: "Submission image URL",
              placeholder: "https://i.imgur.com/wumpus.png",
              required: true,
            }),
        ],
      });
    },
  });

  modals.set(`submit-contest-modal-${contestId}`, modal => {
    const deferred = modal.deferReply({ ephemeral: true });

    let title = getModalTextInput(modal.components, "title")!;
    let submission = getModalTextInput(modal.components, "submission")!;
    if (submissionType === "image" && !testLink(submission)) {
      return void deferred.then(() => modal.editReply({
        content: `${Emojis.ANGER} Invalid image URL.`,
        components: [],
        embeds: [],
      }));
    }

    const contestSubmission = new ContestSubmission({ contestId, title, submission, submissionType, authorId: modal.user.id });

    buttonComponents.set(`${modal.id}-lgtm`, {
      allowedUsers: [modal.user.id],
      async callback(interaction) {
        const message = await (modal.client.channels.resolve(reviewChannelId) as TextBasedChannel).send(generateReviewMessage(contestSubmission));
        contestSubmission.messageLink = message.url;
        void contestSubmission.save();
        return void interaction.update({
          content: `${Emojis.THUMBSUP} Submission is now sent.`,
          components: [],
          embeds: [],
        });
      },
    });

    buttonComponents.set(`${modal.id}-edit`, {
      allowedUsers: [modal.user.id],
      callback(interaction) {
        modals.set(`${modal.id}-edit-modal`, editModal => {
          title = getModalTextInput(editModal.components, "title")!;
          submission = getModalTextInput(editModal.components, "submission")!;
          if (submissionType === "image" && !testLink(submission)) {
            return void deferred.then(() => editModal.editReply({
              content: `${Emojis.ANGER} Invalid image URL.`,
              components: [],
              embeds: [],
            }));
          }

          contestSubmission.title = title;
          contestSubmission.submission = submission;

          if (!editModal.isFromMessage()) return;
          return void editModal.update({
            content: `${Emojis.SPARKLE} Does this look good? Make sure you can see the ${submissionType} in the preview.`,
            embeds: [generateSubmissionEmbed(contestSubmission)],
            components: [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Success,
                    customId: `${modal.id}-lgtm`,
                    label: "Looks good to me!",
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    customId: `${modal.id}-edit`,
                    label: "Edit",
                  },
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Danger,
                    customId: `${modal.id}-cancel`,
                    label: "Cancel",
                  },
                ],
              },
            ],
          });
        });

        return void interaction.showModal({
          title: "Edit new submission",
          customId: `${modal.id}-edit-modal`,
          components: [
            createModalTextInput({
              style: TextInputStyle.Short,
              customId: "title",
              label: "Submission title",
              placeholder: "The Big Wumpus",
              minLength: 1,
              maxLength: 32,
              required: true,
              value: title,
            }),
            createModalTextInput(submissionType === "text" ?
              {
                style: TextInputStyle.Paragraph,
                customId: "submission",
                label: "Submission text",
                placeholder: "The Big Wumpus ate a big apple and became the apple. The End.",
                minLength: 1,
                maxLength: 2048,
                required: true,
                value: submission,
              } :
              {
                style: TextInputStyle.Short,
                customId: "submission",
                label: "Submission image URL",
                placeholder: "https://i.imgur.com/wumpus.png",
                required: true,
                value: submission,
              }),
          ],
        });
      },
    });

    buttonComponents.set(`${modal.id}-cancel`, {
      allowedUsers: [modal.user.id],
      callback(interaction) {
        return void interaction.update({
          content: `${Emojis.THUMBSUP} Submission cancelled.`,
          components: [],
          embeds: [],
        });
      },
    });

    return void deferred.then(() => modal.editReply({
      content: `${Emojis.SPARKLE} Does this look good? Make sure you can see the ${submissionType} in the preview.`,
      embeds: [generateSubmissionEmbed(contestSubmission)],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Success,
              customId: `${modal.id}-lgtm`,
              label: "Looks good to me!",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              customId: `${modal.id}-edit`,
              label: "Edit",
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Danger,
              customId: `${modal.id}-cancel`,
              label: "Cancel",
            },
          ],
        },
      ],
    }));
  });
}
