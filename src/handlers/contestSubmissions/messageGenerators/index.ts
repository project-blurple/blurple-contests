import { type APIEmbed, Colors } from "discord.js";
import type { ContestSubmissionDocument } from "../../../database/models/ContestSubmission.model";

export function generateSubmissionEmbed(submission: ContestSubmissionDocument): APIEmbed {
  return {
    title: submission.title,
    ...submission.submissionType === "text" && { description: submission.submission },
    ...submission.submissionType === "image" && { image: { url: submission.submission }},
    footer: { text: `${submission.contestId}-${submission.submissionId}` },
    timestamp: submission.submittedAt.toISOString(),
    color: Colors.Blurple,
  };
}

export { generateReviewMessage } from "./review";
export { generateSubmittedMessage } from "./submitted";
