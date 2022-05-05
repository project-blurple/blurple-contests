import type { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";
import { AudioPlayerStatus, VoiceConnectionDisconnectReason, VoiceConnectionStatus, createAudioPlayer, entersState } from "@discordjs/voice";
import type { Snowflake } from "discord.js";
import type Track from "./Track";
import { promisify } from "util";

const sleep = promisify(setTimeout);

export default class MusicSubscription {
  private static readonly list = new Map<Snowflake, MusicSubscription>();
  readonly voiceConnection: VoiceConnection;
  readonly audioPlayer: AudioPlayer;
  readonly guildId: Snowflake;
  queue: Track[];
  queueLock = false;
  readyLock = false;

  constructor(voiceConnection: VoiceConnection, guildId: Snowflake) {
    this.voiceConnection = voiceConnection;
    this.audioPlayer = createAudioPlayer();
    this.guildId = guildId;
    this.queue = [];

    MusicSubscription.list.set(guildId, this);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.voiceConnection.on<any>("stateChange", async (_: never, { status, reason, closeCode }: { status: VoiceConnectionStatus; reason: VoiceConnectionDisconnectReason; closeCode: number }) => {
      if (status === VoiceConnectionStatus.Disconnected) {
        if (reason === VoiceConnectionDisconnectReason.WebSocketClose && closeCode === 4014) {
          // we shouldn't manually try to reconnect, but there's a chance it'll recover by itself
          try {
            // await it entering a new state by itself
            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5000);
          } catch {
            // if it doesn't, just destroy. we assume it was kicked from the channel
            this.voiceConnection.destroy();
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          // it's not a 4014, so it's recoverable. we try to reconnect
          await sleep((this.voiceConnection.rejoinAttempts + 1) * 5000);
          this.voiceConnection.rejoin();
        } else this.voiceConnection.destroy();
      } else if (status === VoiceConnectionStatus.Destroyed) this.stop();
      else if (!this.readyLock && (status === VoiceConnectionStatus.Connecting || status === VoiceConnectionStatus.Signalling)) {
        this.readyLock = true;
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
        } finally {
          this.readyLock = false;
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.audioPlayer.on<any>("stateChange", (
      { status: oldStatus, resource: oldResource }: { status: AudioPlayerStatus; resource: AudioResource<Track> },
      { status: newStatus, resource: newResource }: { status: AudioPlayerStatus; resource: AudioResource<Track> },
    ) => {
      if (newStatus === AudioPlayerStatus.Idle && oldStatus !== AudioPlayerStatus.Idle) {
        oldResource.metadata.onFinish();
        void this.processQueue();
      } else if (newStatus === AudioPlayerStatus.Playing) {
        newResource.metadata.onStart();
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.audioPlayer.on<any>("error", (error: { resource: AudioResource<Track> }) => {
      error.resource.metadata.onError(error);
    });

    voiceConnection.subscribe(this.audioPlayer);
  }

  static get(guildId: Snowflake): MusicSubscription | undefined {
    return MusicSubscription.list.get(guildId);
  }

  static destroy(subscription: MusicSubscription): void {
    subscription.voiceConnection.destroy();
    return void MusicSubscription.list.delete(subscription.guildId);
  }

  enqueue(track: Track): void {
    this.queue.push(track);
    void this.processQueue();
  }

  stop(): void {
    this.queueLock = true;
    this.queue = [];
    this.audioPlayer.stop(true);
  }

  private async processQueue(): Promise<void> {
    if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) return;

    this.queueLock = true;

    const nextTrack = this.queue.shift()!;
    try {
      const resource = nextTrack.createAudioResource();
      this.audioPlayer.play(resource);
      this.queueLock = false;
    } catch (err) {
      nextTrack.onError(err);
      this.queueLock = false;
      return this.processQueue();
    }
  }
}
