/* eslint-disable max-lines-per-function */
import type { ApplicationCommandData, ApplicationCommandSubCommandData, ApplicationCommandSubGroupData, Client } from "discord.js";
import type { SlashCommand } from "../../commands/slash";
import autocompleteHandler from "./autocompletes";
import commandHandler from "./commands";
import componentHandler from "./components";
import config from "../../config";
import { join } from "path";
import { mainLogger } from "../../utils/logger";
import modalHandler from "./modals";
import { readdir } from "fs/promises";

export default async (client: Client<true>): Promise<void> => {
  const guild = client.guilds.resolve(config.guildId);

  mainLogger.info("Loading interaction commands...");
  const start = Date.now();

  const slashCommands = await readdir(join(__dirname, "../../commands/slash")).then(async files => {
    const commands: ApplicationCommandData[] = [];
    for (const fileName of files.filter(file => !file.startsWith("_") && file !== "index.js")) {
      const path = join(__dirname, "../../commands/slash", fileName);
      const name = fileName.replace(".js", "");
      if (fileName.endsWith(".js")) {
        const { default: command } = await import(path) as { default: SlashCommand };
        commands.push({
          type: "CHAT_INPUT",
          name,
          description: command.description,
          ...command.options && { options: command.options },
          defaultPermission: false,
        });
      } else {
        commands.push({
          type: "CHAT_INPUT",
          name,
          description: "Sub-command.",
          defaultPermission: false,
          options: await nestSubCommands(path),
        });
      }
    }
    return commands;
  });

  await guild?.commands.set([...slashCommands]);

  mainLogger.info(`Loaded commands in ${Date.now() - start}ms.`);

  client.on("interactionCreate", interaction => {
    if (interaction.isMessageComponent()) {
      if (interaction.isButton() || interaction.isSelectMenu()) return componentHandler(interaction);
    }

    if (interaction.isApplicationCommand()) {
      if (!interaction.guildId) return;
      if (interaction.isCommand()) return commandHandler(interaction);
    }

    if (interaction.isAutocomplete()) return autocompleteHandler(interaction);
    if (interaction.isModalSubmit()) return modalHandler(interaction);
  });
};

async function nestSubCommands(relativePath: string): Promise<Array<ApplicationCommandSubCommandData | ApplicationCommandSubGroupData>> {
  const files = await readdir(relativePath);
  const commands: Array<ApplicationCommandSubCommandData | ApplicationCommandSubGroupData> = [];
  for (const fileName of files.filter(file => !file.startsWith("_"))) {
    const name = fileName.replace(".js", "");
    if (fileName.endsWith(".js")) {
      const { default: command } = await import(join(relativePath, fileName)) as { default: SlashCommand };
      commands.push({
        type: "SUB_COMMAND",
        name,
        description: command.description,
        ...command.options && { options: command.options },
      });
    } else {
      commands.push({
        type: "SUB_COMMAND_GROUP",
        name,
        description: "Sub-command.",
        options: (await nestSubCommands(join(relativePath, fileName))) as ApplicationCommandSubCommandData[],
      });
    }
  }
  return commands;
}
