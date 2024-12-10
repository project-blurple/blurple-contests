import type { Client, SendableChannels, TextBasedChannel } from "discord.js";
import type { ContestDocument } from "../../database/models/Contest.model";
import Emojis from "../../constants/emojis";
import { Contest } from "../../database/models/Contest.model";
import { ContestSubmission, ContestSubmissionStatus } from "../../database/models/ContestSubmission.model";
import mainLogger from "../../utils/logger/main";
import { generateSubmittedMessage } from "./messageGenerators";
import setupContestInteractions from "./setupContestInteractions";

export default function handleContestSubmissions(client: Client<true>): void {
  void Contest.find().then(contests => contests.forEach(contest => {
    setupContestInteractions(contest);
    setupJobs(contest, client);
  }));
}

const jobMap = new Map<string, NodeJS.Timeout[]>();
const timeoutOverflow = 2 ** 31 - 1;

export function setupJobs(contest: ContestDocument, client: Client): void {
  let jobs = jobMap.get(contest.contestId) ?? [];
  jobs.forEach(clearTimeout);
  jobs = [];

  const now = Date.now();

  const submissionEndRemaining = contest.submissionClosedDate.getTime() - now;
  if (submissionEndRemaining > 0) {
    if (submissionEndRemaining > timeoutOverflow) {
      mainLogger.warn(`Contest ${contest.contestId}'s submission ending time remaining is more than 32 bits; will try to set up jobs again in 24 hours.`);
      jobs.push(setTimeout(() => setupJobs(contest, client), 24 * 60 * 60 * 1000));
    } else jobs.push(setTimeout(() => onSubmissionEnd(contest, client), submissionEndRemaining));
  }

  const voteStartRemaining = contest.votingOpenedDate.getTime() - now;
  if (voteStartRemaining > 0) {
    if (voteStartRemaining > timeoutOverflow) {
      mainLogger.warn(`Contest ${contest.contestId}'s vote starting time remaining is more than 32 bits; will try to set up jobs again in 24 hours.`);
      jobs.push(setTimeout(() => setupJobs(contest, client), 24 * 60 * 60 * 1000));
    } else jobs.push(setTimeout(() => onVoteStart(contest, client), voteStartRemaining));
  }

  const voteEndRemaining = contest.votingClosedDate.getTime() - now;
  if (voteEndRemaining > 0) {
    if (voteEndRemaining >= timeoutOverflow) {
      mainLogger.warn(`Contest ${contest.contestId}'s vote ending time remaining is more than 32 bits; will try to set up jobs again in 24 hours.`);
      jobs.push(setTimeout(() => setupJobs(contest, client), 24 * 60 * 60 * 1000));
    } else jobs.push(setTimeout(() => onVoteEnd(contest, client), voteEndRemaining));
  }

  jobMap.set(contest.contestId, jobs);
}

function onSubmissionEnd(contest: ContestDocument, client: Client): void {
  const channel = client.channels.resolve(contest.submissionChannelId) as null | (SendableChannels & TextBasedChannel);
  if (!channel) return void mainLogger.warn(`Could not find channel ${contest.submissionChannelId} when trying to update voting results`);

  return void channel.send({
    content: `${Emojis.SPARKLE} The submission phase has ended for this contest.`,
  });
}

function onVoteStart(contest: ContestDocument, client: Client): void {
  const channel = client.channels.resolve(contest.submissionChannelId) as null | (SendableChannels & TextBasedChannel);
  if (!channel) return void mainLogger.warn(`Could not find channel ${contest.submissionChannelId} when trying to update voting results`);

  return void channel.send({
    content: `${Emojis.SPARKLE} The voting phase has started for this contest, you can now go submit your votes.`,
  });
}

function onVoteEnd(contest: ContestDocument, client: Client): void {
  const channel = client.channels.resolve(contest.submissionChannelId) as null | (SendableChannels & TextBasedChannel);
  if (!channel) return void mainLogger.warn(`Could not find channel ${contest.submissionChannelId} when trying to update voting results`);

  return void ContestSubmission.find({ contestId: contest.contestId }).then(async submissions => {
    mainLogger.info(`Updating voting results for contest ${contest.contestId} with ${submissions.length} submissions.`);
    const start = Date.now();
    await channel.send({
      content: `${Emojis.SPARKLE} Voting has ended for this contest, the results will be revealed in a moment.`,
    });
    await Promise.all(submissions.filter(submission => submission.status === ContestSubmissionStatus.APPROVED).map(async submission => {
      const messageId = submission.messageLink.split("/").pop() ?? "";
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) return void mainLogger.warn(`Could not find message ${submission.messageLink} when trying to update voting results`);

      return message.edit(generateSubmittedMessage(submission, true));
    }));
    mainLogger.info(`Updated voting results for contest ${contest.contestId} in ${Date.now() - start}ms.`);
  });
}
