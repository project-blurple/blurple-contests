import type { FirstLevelChatInputCommand } from "..";
import subcommandCreate from "./create";
import subcommandEdit from "./edit";
import subcommandList from "./list";
import subcommandListParticipants from "./listParticipants";
import subcommandPostButton from "./postButton";
import subcommandRemove from "./remove";

export default {
  name: "contests",
  description: "Manage contests",
  subcommands: [
    subcommandCreate,
    subcommandEdit,
    subcommandList,
    subcommandListParticipants,
    subcommandPostButton,
    subcommandRemove,
  ],
} satisfies FirstLevelChatInputCommand;
