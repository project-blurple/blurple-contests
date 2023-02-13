import type { DocumentType } from "@typegoose/typegoose";
import { getModelForClass, prop } from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";

export class ContestVoteEntrySchema {
  @prop({ type: String, required: true }) contestId!: string;
  @prop({ type: String, required: true }) submissionId!: string;
  @prop({ type: String, required: true }) userId!: Snowflake;
  @prop({ type: Date, default: Date.now }) submittedAt!: Date;
}

export type ContestVoteEntryDocument = DocumentType<ContestVoteEntrySchema>;

export const ContestVoteEntry = getModelForClass(ContestVoteEntrySchema);
