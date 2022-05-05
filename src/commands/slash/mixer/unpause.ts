import Emojis from "../../../constants/emojis";
import MusicSubscription from "../../../utils/mixer/MusicSubscription";
import type { SlashCommand } from "..";

const command: SlashCommand = {
  description: "Unpause the mixer",
  execute(interaction) {
    const subscription = MusicSubscription.get(interaction.guildId!);
    if (!subscription) {
      return void interaction.reply({
        content: `${Emojis.ANGER} Nothing is playing in this server.`,
        ephemeral: true,
      });
    }

    subscription.audioPlayer.unpause();
    return void interaction.reply({
      content: `${Emojis.THUMBSUP} Unpaused the mixer.`,
    });
  },
};

export default command;
