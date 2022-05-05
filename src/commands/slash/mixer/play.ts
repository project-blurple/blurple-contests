import { VoiceConnectionStatus, entersState, joinVoiceChannel } from "@discordjs/voice";
import type { DiscordGatewayAdapterCreator } from "@discordjs/voice";
import Emojis from "../../../constants/emojis";
import { GuildMember } from "discord.js";
import MusicSubscription from "../../../utils/mixer/MusicSubscription";
import type { SlashCommand } from "..";
import Track from "../../../utils/mixer/Track";
import { inspect } from "util";
import { mainLogger } from "../../../utils/logger";

const command: SlashCommand = {
  description: "Play a YouTube song in a voice channel",
  options: [
    {
      type: "STRING",
      name: "url",
      description: "The YouTube URL of the track to play",
      required: true,
    },
  ],
  async execute(interaction) {
    const url = interaction.options.get("url")!.value as string;

    let subscription = MusicSubscription.get(interaction.guildId!);
    if (!subscription && interaction.member instanceof GuildMember && interaction.member.voice.channel) {
      subscription = new MusicSubscription(
        joinVoiceChannel({
          adapterCreator: interaction.guild!.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
          channelId: interaction.member.voice.channel.id,
          guildId: interaction.guildId!,
          selfMute: false,
          selfDeaf: false,
        }),
        interaction.guildId!,
      );
    } else if (!subscription) {
      return void interaction.reply({
        content: `${Emojis.ANGER} You must be in a voice channel to use this command.`,
        ephemeral: true,
      });
    }

    const deferred = interaction.deferReply();

    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
    } catch (err) {
      mainLogger.warn(`Failed to enter ready state for ${inspect(subscription.voiceConnection)}: ${inspect(err)}`);
      await deferred;
      return void interaction.editReply({
        content: `${Emojis.ANGER} Failed to join voice channel :(`,
      });
    }

    try {
      const track = await Track.from(url, {
        onStart: () => void interaction.followUp({ content: `${Emojis.SPARKLE} Now playing!`, ephemeral: true }).catch(),
        onFinish: () => void interaction.followUp({ content: `${Emojis.TADA} Finished playing!`, ephemeral: true }).catch(),
        onError: err => {
          mainLogger.warn(`Failed to play track ${url}: ${inspect(err)}`);
          void interaction.editReply({ content: `${Emojis.ANGER} Failed to play track :(` });
        },
      });
      await deferred;
      await interaction.editReply({ content: `${Emojis.SPARKLE} Added **${track.title}** to queue!` });
      return subscription.enqueue(track);
    } catch (err) {
      mainLogger.warn(`Failed to create track from ${url}: ${inspect(err)}`);
      await deferred;
      return void interaction.editReply({ content: `${Emojis.ANGER} Failed to add track to queue :(` });
    }
  },
};

export default command;
