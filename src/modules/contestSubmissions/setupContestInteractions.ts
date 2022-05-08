/* eslint-disable max-lines-per-function */
import { Contest, type ContestDocument, ContestSubmission, ContestSubmissionStatus } from "../../database";
import type { TextBasedChannel, TextInputComponentOptions } from "discord.js";
import { generateReviewMessage, generateSubmissionEmbed } from "./messageGenerators";
import { getModalTextInput, modals } from "../../handlers/interactions/modals";
import Emojis from "../../constants/emojis";
import { components } from "../../handlers/interactions/components";
import { testLink } from "../../utils/links";

export function setupContestInteractions({ contestId, submissionType, reviewChannelId }: ContestDocument): void {
  components.set(`submit-contest-${contestId}`, {
    type: "BUTTON",
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
        components: ([
          {
            type: "TEXT_INPUT",
            style: "SHORT",
            customId: "title",
            label: "Submission title",
            placeholder: "The Big Wumpus",
            minLength: 1,
            maxLength: 32,
            required: true,
          },
          contest.submissionType === "text" ?
            {
              type: "TEXT_INPUT",
              style: "PARAGRAPH",
              customId: "submission",
              label: "Submission text",
              placeholder: "The Big Wumpus ate a big apple and became the apple. The End.",
              minLength: 1,
              maxLength: 2048,
              required: true,
            } :
            {
              type: "TEXT_INPUT",
              style: "SHORT",
              customId: "submission",
              label: "Submission image URL",
              placeholder: "https://i.imgur.com/wumpus.png",
              required: true,
            },
        ] as TextInputComponentOptions[]).filter(Boolean).map(component => ({
          type: "ACTION_ROW",
          components: [component],
        })),
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

    components.set(`${modal.id}-lgtm`, {
      type: "BUTTON",
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

    components.set(`${modal.id}-edit`, {
      type: "BUTTON",
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

          return void editModal.update({
            content: `${Emojis.SPARKLE} Does this look good? Make sure you can see the ${submissionType} in the preview.`,
            embeds: [generateSubmissionEmbed(contestSubmission)],
            components: [
              {
                type: "ACTION_ROW",
                components: [
                  {
                    type: "BUTTON",
                    style: "SUCCESS",
                    customId: `${modal.id}-lgtm`,
                    label: "Looks good to me!",
                  },
                  {
                    type: "BUTTON",
                    style: "SECONDARY",
                    customId: `${modal.id}-edit`,
                    label: "Edit",
                  },
                  {
                    type: "BUTTON",
                    style: "DANGER",
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
          components: ([
            {
              type: "TEXT_INPUT",
              style: "SHORT",
              customId: "title",
              label: "Submission title",
              placeholder: "The Big Wumpus",
              minLength: 1,
              maxLength: 32,
              required: true,
              value: title,
            },
            submissionType === "text" ?
              {
                type: "TEXT_INPUT",
                style: "PARAGRAPH",
                customId: "submission",
                label: "Submission text",
                placeholder: "The Big Wumpus ate a big apple and became the apple. The End.",
                minLength: 1,
                maxLength: 2048,
                required: true,
                value: submission,
              } :
              {
                type: "TEXT_INPUT",
                style: "SHORT",
                customId: "submission",
                label: "Submission image URL",
                placeholder: "https://i.imgur.com/wumpus.png",
                required: true,
                value: submission,
              },
          ] as TextInputComponentOptions[]).filter(Boolean).map(component => ({
            type: "ACTION_ROW",
            components: [component],
          })),
        });
      },
    });

    components.set(`${modal.id}-cancel`, {
      type: "BUTTON",
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
          type: "ACTION_ROW",
          components: [
            {
              type: "BUTTON",
              style: "SUCCESS",
              customId: `${modal.id}-lgtm`,
              label: "Looks good to me!",
            },
            {
              type: "BUTTON",
              style: "SECONDARY",
              customId: `${modal.id}-edit`,
              label: "Edit",
            },
            {
              type: "BUTTON",
              style: "DANGER",
              customId: `${modal.id}-cancel`,
              label: "Cancel",
            },
          ],
        },
      ],
    }));
  });
}
