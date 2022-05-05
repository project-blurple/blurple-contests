import type { Awaitable, Message, MessageOptions } from "discord.js";

export interface MentionCommand {
  aliases?: [string, ...string[]];
  ownerOnly?: true;
  execute(message: Message, reply: (contentOrOptions: MessageOptions | string) => Promise<Message>, args: string[]): Awaitable<void>;
  testArgs(args: string[]): boolean;
}
