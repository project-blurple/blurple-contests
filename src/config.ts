import "dotenv/config";
import type { CacheWithLimitsOptions } from "discord.js";

export default {
  client: {
    token: String(process.env["BOT_TOKEN"]),
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
      VoiceStateManager: 0,
    } as CacheWithLimitsOptions,
  },

  databaseUri: String(process.env["DATABASE_URI"]),

  ownerId: String(process.env["OWNER_ID"]),
  guildId: String(process.env["GUILD_ID"]),

  adminRoles: (process.env["ADMIN_ROLES"] ?? "").split(","),
} as const;
