import ytdl, { getInfo } from "ytdl-core";
import type { AudioResource } from "@discordjs/voice";
import { createAudioResource } from "@discordjs/voice";

export interface TrackData {
  url: string;
  title: string;
  onStart(): void;
  onFinish(): void;
  onError(error: unknown): void;
}

export default class Track implements TrackData {
  readonly url: string;
  readonly title: string;
  readonly onStart: () => void;
  readonly onFinish: () => void;
  readonly onError: (error: unknown) => void;

  private constructor({ url, title, onStart, onFinish, onError }: TrackData) {
    this.url = url;
    this.title = title;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.onError = onError;
  }

  static async from(url: string, methods: Pick<Track, "onError" | "onFinish" | "onStart">): Promise<Track> {
    const info = await getInfo(url);

    return new Track({
      title: info.videoDetails.title,
      url,
      onStart() {
        methods.onStart();
        this.onStart = () => void 0;
      },
      onFinish() {
        methods.onFinish();
        this.onFinish = () => void 0;
      },
      onError(error: unknown) {
        methods.onError(error);
        this.onError = () => void 0;
      },
    });
  }

  createAudioResource(): AudioResource<Track> {
    const stream = ytdl(this.url, { filter: "audioonly", dlChunkSize: 0 });
    return createAudioResource<Track>(stream, { metadata: this });
  }
}
