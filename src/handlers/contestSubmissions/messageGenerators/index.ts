import type { APIEmbed } from "discord.js";
import { Colors } from "discord.js";
import type { ContestSubmissionDocument } from "../../../database/models/ContestSubmission.model";

export function generateSubmissionEmbed(submission: ContestSubmissionDocument): APIEmbed {
  return {
    title: submission.title,
    ...submission.submissionType === "text" && { description: submission.submission },
    ...submission.submissionType === "image" && { image: { url: submission.submission } },
    footer: { text: `${submission.contestId}-${submission.submissionId}` },
    timestamp: submission.submittedAt.toISOString(),
    color: Colors.Blurple,
  };
}

export { default as generateReviewMessage } from "./review";
export { default as generateSubmittedMessage } from "./submitted";
