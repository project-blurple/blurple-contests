import type { DocumentType } from "@typegoose/typegoose";
import { getModelForClass, prop } from "@typegoose/typegoose";

export class LeaderboardSchema {
  @prop({ type: String, default: () => (Math.random() + 1).toString(16).substring(2, 8) }) leaderboardId!: string;
  @prop({ type: String, required: true }) messageLink!: string;
  @prop({ type: String, required: true }) name!: string;
  @prop({ type: String }) table?: string;
}

export type LeaderboardDocument = DocumentType<LeaderboardSchema>;

export const Leaderboard = getModelForClass(LeaderboardSchema);
