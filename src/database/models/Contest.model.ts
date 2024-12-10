import type { DocumentType } from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";
import { getModelForClass, prop } from "@typegoose/typegoose";

export class ContestSchema {
  @prop({ type: String, default: () => (Math.random() + 1).toString(16).substring(2, 8) }) contestId!: string;
  @prop({ type: Number, required: true }) maxSubmissionsPerUser!: number;
  @prop({ type: Number, required: true }) maxVotesPerUser!: number;
  @prop({ type: String, required: true }) name!: string;
  @prop({ type: String, required: true }) reviewChannelId!: Snowflake;
  @prop({ type: String, required: true }) submissionChannelId!: Snowflake;
  @prop({ type: Date, required: true }) submissionClosedDate!: Date;
  @prop({ type: Date, required: true }) submissionOpenedDate!: Date;
  @prop({ type: String, required: true }) submissionType!: "image" | "text";
  @prop({ type: Date, required: true }) votingClosedDate!: Date;
  @prop({ type: Date, required: true }) votingOpenedDate!: Date;
}

export type ContestDocument = DocumentType<ContestSchema>;

export const Contest = getModelForClass(ContestSchema);
