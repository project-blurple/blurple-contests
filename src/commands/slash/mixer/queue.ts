import { AudioPlayerStatus } from "@discordjs/voice";
import type { AudioResource } from "@discordjs/voice";
import Emojis from "../../../constants/emojis";
import MusicSubscription from "../../../utils/mixer/MusicSubscription";
import type { SlashCommand } from "..";
import type Track from "../../../utils/mixer/Track";

const command: SlashCommand = {
  description: "Get the current song queue",
  execute(interaction) {
    const subscription = MusicSubscription.get(interaction.guildId!);
    if (!subscription) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Nothing is playing in this server.`,
        ephemeral: true,
      });
    }

    const current = subscription.audioPlayer.state.status === AudioPlayerStatus.Playing ? (subscription.audioPlayer.state.resource as AudioResource<Track>).metadata : null;
    const queue = subscription.queue.slice(0, 10)
      .map((track, index) => `> **${index + 1}.** [${track.title}](<${track.url}>)`)
      .join("\n");

    return void interaction.reply({
      content: [
        current ? `**${Emojis.SPARKLE} Now playing:** [${current.title}](<${current.url}>)` : null,
        queue.length ? `**${Emojis.STAR} Queue:**\n${queue}` : null,
      ].filter(Boolean).join("\n\n"),
    });
  },
};

export default command;
