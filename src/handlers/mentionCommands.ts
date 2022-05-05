import type { Message, MessageEditOptions, MessageOptions, Snowflake } from "discord.js";
import Emojis from "../constants/emojis";
import type { MentionCommand } from "../commands/mention";
import config from "../config";
import { inspect } from "util";
import { join } from "path";
import { mainLogger } from "../utils/logger";
import { readdir } from "fs/promises";

const replies = new Map<Snowflake, Message>();
const commands = new Map<string, MentionCommand>();
const aliases = new Map<string, string>();

export default async (message: Message): Promise<void> => {
  const existingReply = replies.get(message.id);

  // ignore editing into a command, but allow editing from a command to a new command
  if (!existingReply && message.editedTimestamp) return;

  const args = message.content.split(" ").slice(1);
  const commandOrAlias = (args.shift() ?? "").toLowerCase();

  const commandName = aliases.get(commandOrAlias) ?? commandOrAlias;
  const command = commands.get(commandName);
  if (!command) return void reply(message, `${Emojis.ANGER} Command does not exist. It might've been moved to a slash command.`, existingReply);

  if (command.ownerOnly && message.author.id !== config.ownerId) return void reply(message, `${Emojis.ANGER} You don't have permission to use this command.`, existingReply);

  if (!command.testArgs(args)) return void reply(message, `${Emojis.ANGER} Invalid arguments.`, existingReply);

  return command.execute(message, (contentOrOptions: MessageOptions | string) => reply(message, contentOrOptions, existingReply), args);
};


async function reply(message: Message, contentOrOptions: string | (Omit<MessageEditOptions, "embeds" | "flags"> & Pick<MessageOptions, "embeds">), existingReply?: Message) {
  const options: (Omit<MessageEditOptions, "embeds" | "flags"> & Pick<MessageOptions, "embeds">) = {
    allowedMentions: { repliedUser: false },
    ...typeof contentOrOptions === "string" ? { content: contentOrOptions } : contentOrOptions,
  };
  if (existingReply) return existingReply.edit(options);
  const newReply = await message.reply(options);
  replies.set(message.id, newReply);
  return newReply;
}


// loading commands
readdir(join(__dirname, "../commands/mention")).then(async files => {
  for (const fileName of files.filter(file => file.endsWith(".js") && !file.startsWith("_") && file !== "index.js")) {
    const { default: command } = await import(`../commands/mention/${fileName}`) as { default: MentionCommand };
    const commandName = fileName.replace(".js", "").toLowerCase();
    commands.set(commandName, command);
    if (command.aliases) for (const alias of command.aliases) aliases.set(alias, commandName);
  }
})
  .catch(err => mainLogger.error(`Failed to load mention commands: ${inspect(err)}`));
