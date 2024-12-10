import type { DocumentType } from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";
import { getModelForClass, prop } from "@typegoose/typegoose";

export class ContestVoteEntrySchema {
  @prop({ type: String, required: true }) contestId!: string;
  @prop({ type: String, required: true }) submissionId!: string;
  @prop({ type: Date, default: Date.now }) submittedAt!: Date;
  @prop({ type: String, required: true }) userId!: Snowflake;
}

export type ContestVoteEntryDocument = DocumentType<ContestVoteEntrySchema>;

export const ContestVoteEntry = getModelForClass(ContestVoteEntrySchema);
