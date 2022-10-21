import Emojis from "../../constants/emojis";
import type { MentionCommand } from ".";
import { msToTime } from "../../utils/time";

const command: MentionCommand = {
  aliases: ["pong", ""],
  testArgs(args) { return args.length === 0; },
  async execute(message, reply) {
    const now = Date.now();
    const botMessage = await reply(`${Emojis.LOADING} Pinging...`);
    return botMessage.edit(`${Emojis.SPARKLE} Server latency is \`${Date.now() - now}ms\`, API latency is \`${Math.round(message.client.ws.ping)}ms\` and my uptime is \`${msToTime(message.client.uptime)}\`.`);
  },
};

export default { ...command } as const;
