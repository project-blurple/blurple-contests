import { getModelForClass, prop } from "@typegoose/typegoose";
import type { DocumentType } from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";

export enum ContestSubmissionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export class ContestSubmissionSchema {
  @prop({ type: String, default: () => (Math.random() + 1).toString(16).substring(2, 8) }) submissionId!: string;
  @prop({ type: String, required: true }) contestId!: string;
  @prop({ type: String, required: true }) title!: string;
  @prop({ type: String, required: true }) submission!: string;
  @prop({ type: String, required: true }) submissionType!: "image" | "text";
  @prop({ type: String, required: true }) authorId!: Snowflake;
  @prop({ type: String, default: ContestSubmissionStatus.PENDING, enum: ContestSubmissionStatus }) status!: ContestSubmissionStatus;
  @prop({ type: String }) rejectReason?: string;
  @prop({ type: String, required: true }) messageLink!: string;
  @prop({ type: Date, default: Date.now }) submittedAt!: Date;
}

export type ContestSubmissionDocument = DocumentType<ContestSubmissionSchema>;

export const ContestSubmission = getModelForClass(ContestSubmissionSchema);
