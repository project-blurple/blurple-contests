import "dotenv/config";
import type { CacheWithLimitsOptions, Snowflake } from "discord.js";

if (!process.env["BOT_TOKEN"]) throw new Error("Missing environment variable BOT_TOKEN");
if (!process.env["DATABASE_URI"]) throw new Error("Missing environment variable DATABASE_URI");
if (!process.env["OWNER_ID"]) throw new Error("Missing environment variable OWNER_ID");
if (!process.env["GUILD_ID"]) throw new Error("Missing environment variable GUILD_ID");
if (!process.env["ADMIN_ROLES"]) throw new Error("Missing environment variable ADMIN_ROLES");

const config: Config = {
  client: {
    token: process.env["BOT_TOKEN"],
    caches: {
      ApplicationCommandManager: 0,
      BaseGuildEmojiManager: 0,
      GuildEmojiManager: 0,
      GuildMemberManager: 0,
      GuildBanManager: 0,
      GuildInviteManager: 0,
      GuildScheduledEventManager: 0,
      GuildStickerManager: 0,
      MessageManager: 0,
      PresenceManager: 0,
      ReactionManager: 0,
      ReactionUserManager: 0,
      StageInstanceManager: 0,
      ThreadManager: 0,
      ThreadMemberManager: 0,
      UserManager: 0,
      VoiceStateManager: 1000,
    },
  },

  databaseUri: process.env["DATABASE_URI"],

  ownerId: process.env["OWNER_ID"],
  guildId: process.env["GUILD_ID"],

  adminRoles: process.env["ADMIN_ROLES"].split(","),
};

export default config;


interface Config {
  client: {
    token: string;
    caches: CacheWithLimitsOptions;
  };

  databaseUri: string;

  ownerId: Snowflake;
  guildId: Snowflake;

  adminRoles: Snowflake[];
}
