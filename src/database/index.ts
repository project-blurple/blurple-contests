import config from "../config";
import { inspect } from "util";
import mongoose from "mongoose";
import { mongooseLogger } from "../utils/logger";

mongoose.set("debug", (collectionName, method, query: string, doc: string) => mongooseLogger.debug(JSON.stringify({ collectionName, method, query, doc })));

export const connection = mongoose.connect(config.databaseUri);

export * from "./Contest";
export * from "./ContestSubmission";
export * from "./ContestVoteEntry";
export * from "./Leaderboard";

connection
  .then(() => mongooseLogger.info("Connected to database"))
  .catch(err => mongooseLogger.error(`Error when connecting to database: ${inspect(err)}`));
