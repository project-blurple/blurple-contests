import { Client, IntentsBitField, Options, Partials } from "discord.js";
import config from "./config";
import { connection } from "./database";
import { discordLogger } from "./utils/logger/discord";
import handleContestSubmissions from "./handlers/contestSubmissions";
import handleInteractions from "./handlers/interactions";
import handleMentionCommands from "./handlers/mentionCommands";
import { inspect } from "util";
import { mainLogger } from "./utils/logger/main";

const client = new Client({
  allowedMentions: { parse: [], users: [], roles: [], repliedUser: true },
  intents: [
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.MessageContent,
  ],
  makeCache: Options.cacheWithLimits(config.client.caches),
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User,
  ],
  presence: { status: "online" },
  rest: { userAgentAppendix: "Blurple Contests (projectblurple.com)" },
  ws: { compress: true },
});

client.once("ready", trueClient => {
  mainLogger.info(`Ready as ${trueClient.user.tag}!`);

  handleContestSubmissions(trueClient);
  handleInteractions(trueClient);
  handleMentionCommands(trueClient);
});

// discord debug logging
client
  .on("cacheSweep", message => void discordLogger.debug(message))
  .on("debug", info => void discordLogger.debug(info))
  .on("error", error => void discordLogger.error(`Cluster errored. ${inspect(error)}`))
  .on("rateLimit", rateLimitData => void discordLogger.warn(`Rate limit ${JSON.stringify(rateLimitData)}`))
  .on("ready", () => void discordLogger.info("All shards have been connected."))
  .on("shardDisconnect", (_, id) => void discordLogger.warn(`Shard ${id} disconnected.`))
  .on("shardError", (error, id) => void discordLogger.error(`Shard ${id} errored. ${inspect(error)}`))
  .on("shardReady", id => void discordLogger.info(`Shard ${id} is ready.`))
  .on("shardReconnecting", id => void discordLogger.warn(`Shard ${id} is reconnecting.`))
  .on("shardResume", (id, replayed) => void discordLogger.info(`Shard ${id} resumed. ${replayed} events replayed.`))
  .on("warn", info => void discordLogger.warn(info));

// other debug logging
process
  .on("uncaughtException", error => mainLogger.warn(`Uncaught exception: ${inspect(error)}`))
  .on("unhandledRejection", error => mainLogger.warn(`Unhandled rejection: ${inspect(error)}`));

void connection.then(() => void client.login(config.client.token));
