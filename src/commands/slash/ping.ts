import Emojis from "../../constants/emojis";
import type { SlashCommand } from ".";
import { msToTime } from "../../utils/time";

const command: SlashCommand = {
  description: "Ping the bot",
  async execute(interaction) {
    const start = Date.now();
    await interaction.deferReply();
    void interaction.editReply({
      content: `${Emojis.SPARKLE} Pong! Server latency is \`${Date.now() - start}ms\`, API latency is \`${Math.round(interaction.client.ws.ping)}ms\` and my uptime is \`${msToTime(interaction.client.uptime ?? 0)}\`.`,
    });
  },
};

export default command;
