import type { FirstLevelChatInputCommand } from "..";
import subcommandCreate from "./create";

export default {
  name: "leaderboards",
  description: "Manage leaderboards",
  subcommands: [subcommandCreate],
} satisfies FirstLevelChatInputCommand;
