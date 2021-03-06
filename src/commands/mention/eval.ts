/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Emojis from "../../constants/emojis";
import type { MentionCommand } from ".";
import type { WebhookEditMessageOptions } from "discord.js";
import { components } from "../../handlers/interactions/components";
import config from "../../config";
import { inspect } from "util";
import { randomBytes } from "crypto";
import superagent from "superagent";

const hastebinLink = "https://haste.but-it-actually.works";

const command: MentionCommand = {
  aliases: ["evaluate", "run", "js", "zwoop", "zwoopz", "zwoopzwoop", "rep"],
  execute(_, reply, args) {
    try {
      // eslint-disable-next-line no-eval
      const evaled = eval(args.join(" "));
      if (evaled instanceof Promise) {
        const botMsg = reply(`${Emojis.LOADING} Running...`);
        const start = Date.now();
        void evaled.then(async (result: unknown) => (await botMsg).edit(await generateMessage(result, Date.now() - start)));
      } else void generateMessage(evaled, null).then(messageOptions => reply({ ...messageOptions, allowedMentions: { repliedUser: false }}));
    } catch (err) {
      void generateMessage(err, null, false).then(reply);
    }
  },
  ownerOnly: true,
  testArgs(args) {
    return args.length > 0;
  },
};

export default command;

async function generateMessage(result: unknown, time: number | null, success = true, hastebin = false): Promise<WebhookEditMessageOptions> {
  if (hastebin) {
    const res = await superagent.post(`${hastebinLink}/documents`)
      .send(inspect(result, { depth: Infinity, maxArrayLength: Infinity, maxStringLength: Infinity }))
      .catch(() => null);

    if (res?.ok) {
      const { key } = res.body as { key: string };
      const url = new URL(`${hastebinLink}/${key}.js`);
      return {
        content: `${success ? `${Emojis.THUMBSUP} Evaluated successfully` : `${Emojis.THUMBSDOWN} JavaScript failed`}${time ? ` in ${time}ms` : ""}: ${url.toString()}`,
        components: [],
      };
    }

    return {
      content: `${success ? `${Emojis.THUMBSUP} Evaluated successfully` : `${Emojis.THUMBSDOWN} JavaScript failed`}${time ? ` in ${time}ms` : ""}: (failed to upload to hastebin)`,
      components: [],
    };

  }

  const content = generateContent(result, time, success);
  if (!content) return generateMessage(result, time, success, true);

  const identifier = randomBytes(16).toString("hex");
  components.set(`${identifier}-hastebin`, {
    type: "BUTTON",
    allowedUsers: [config.ownerId],
    callback(interaction) {
      void generateMessage(result, time, success, true).then(messageOptions => interaction.update(messageOptions));
    },
  });

  return {
    content,
    components: [
      {
        type: "ACTION_ROW",
        components: [
          {
            type: "BUTTON",
            label: "Dump to Hastebin",
            style: "PRIMARY",
            customId: `${identifier}-hastebin`,
          },
        ],
      },
    ],
  };
}

// the function basically tries to get as much depth as possible without going over the 2000 character limit. if it fails even with depth = 1 and maxArrayLength = 1 then send null
function generateContent(result: unknown, time: number | null, success = true, depth = 10, maxArrayLength = 100): string | null {
  if (depth <= 0) return null;
  let content: string | null = `${success ? `${Emojis.THUMBSUP} Evaluated successfully` : `${Emojis.THUMBSDOWN} JavaScript failed`}${time ? ` in ${time}ms` : ""}:\`\`\`ansi\n${inspect(result, { colors: true, depth, maxArrayLength })}\`\`\``;

  if (content.length > 2000) {
    if (depth === 1 && Array.isArray(result) && maxArrayLength > 1) content = generateContent(result, time, success, depth, maxArrayLength - 1);
    else content = generateContent(result, time, success, depth - 1);
  }
  return content;
}
