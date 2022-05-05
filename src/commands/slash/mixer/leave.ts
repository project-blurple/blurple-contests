import Emojis from "../../../constants/emojis";
import MusicSubscription from "../../../utils/mixer/MusicSubscription";
import type { SlashCommand } from "..";

const command: SlashCommand = {
  description: "Leave the voice channel",
  execute(interaction) {
    const subscription = MusicSubscription.get(interaction.guildId!);
    if (!subscription) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Nothing is playing in this server.`,
        ephemeral: true,
      });
    }

    MusicSubscription.destroy(subscription);
    return void interaction.reply({
      content: `${Emojis.THUMBSUP} Left the voice channel.`,
    });
  },
};

export default command;
