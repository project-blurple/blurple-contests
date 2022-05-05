import { Constants, type MessageEmbedOptions } from "discord.js";
import type { ContestSubmissionDocument } from "../../../database";

export function generateSubmissionEmbed(submission: ContestSubmissionDocument): MessageEmbedOptions {
  return {
    title: submission.title,
    ...submission.submissionType === "text" && { description: submission.submission },
    ...submission.submissionType === "image" && { image: { url: submission.submission }},
    footer: { text: `${submission.contestId}-${submission.submissionId}` },
    timestamp: submission.submittedAt,
    color: Constants.Colors.BLURPLE,
  };
}

export { generateReviewMessage } from "./review";
export { generateSubmittedMessage } from "./submitted";
