import { Client, Options } from "discord.js";
import { discordLogger, mainLogger } from "./utils/logger";
import Emojis from "./constants/emojis";
import type { Module } from "./modules";
import config from "./config";
import { connection } from "./database";
import { inspect } from "util";
import interactionsHandler from "./handlers/interactions";
import { join } from "path";
import mentionCommandHandler from "./handlers/mentionCommands";
import { readdir } from "fs/promises";

const client = new Client({
  makeCache: Options.cacheWithLimits(config.client.caches),
  partials: ["CHANNEL", "GUILD_MEMBER", "GUILD_SCHEDULED_EVENT", "MESSAGE", "REACTION", "USER"],
  userAgentSuffix: [
    "Blurple Contests Bot",
    "https://github.com/project-blurple/blurple-contests",
    "https://projectblurple.com",
  ],
  presence: { status: "online" },
  intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"],
  allowedMentions: { parse: [], users: [], roles: [], repliedUser: true },
});

client.once("ready", trueClient => {
  mainLogger.info(`Logged in as ${trueClient.user.tag}`);

  void interactionsHandler(client);

  // load modules
  readdir(join(__dirname, "modules"))
    .then(async files => {
      const start = Date.now();
      for (const fileName of files.filter(file => !file.startsWith("index"))) {
        try {
          const { default: module } = await import(join(__dirname, "modules", fileName)) as { default: Module };
          await module(client);
          mainLogger.info(`Module "${fileName}" loaded`);
        } catch (err) {
          mainLogger.error(`Module "${fileName}" failed to load: ${inspect(err)}`);
        }
      }
      mainLogger.info(`Modules loaded in ${Date.now() - start}ms.`);
    })
    .catch(err => mainLogger.error(`Error loading modules: ${inspect(err)}`));
});

client.on("messageCreate", async message => {
  if (
    !message.guild ||
    message.type !== "DEFAULT" ||
    message.author.bot
  ) return;

  // mention command handler
  if (RegExp(`^<@!?${client.user!.id}> `, "u").exec(message.content)) return void mentionCommandHandler(message);
  if (RegExp(`^<@!?${client.user!.id}>`, "u").exec(message.content)) await message.react(Emojis.WAVE);

  return void 0;
});

client.on("messageUpdate", (_, message) => {
  if (!message.partial && RegExp(`^<@!?${client.user!.id}> `, "u").exec(message.content)) return void mentionCommandHandler(message);
  return void 0;
});

client
  .on("debug", info => void discordLogger.debug(info))
  .on("error", error => void discordLogger.error(`Cluster errored. ${inspect(error)}`))
  .on("rateLimit", rateLimitData => void discordLogger.warn(`Rate limit ${JSON.stringify(rateLimitData)}`))
  .on("ready", () => void discordLogger.info("All shards have been connected."))
  .on("shardDisconnect", (event, id) => void discordLogger.warn(`Shard ${id} disconnected. ${inspect(event)}`))
  .on("shardError", (error, id) => void discordLogger.error(`Shard ${id} errored. ${inspect(error)}`))
  .on("shardReady", id => void discordLogger.info(`Shard ${id} is ready.`))
  .on("shardReconnecting", id => void discordLogger.warn(`Shard ${id} is reconnecting.`))
  .on("shardResume", (id, replayed) => void discordLogger.info(`Shard ${id} resumed. ${replayed} events replayed.`))
  .on("warn", info => void discordLogger.warn(info));

mainLogger.info("Connecting to database.");
void connection.then(() => {
  mainLogger.info("Connected to database. Logging into Discord...");
  void client.login(config.client.token);
}).catch(err => mainLogger.warn(`Database connection failed: ${inspect(err)}`));
