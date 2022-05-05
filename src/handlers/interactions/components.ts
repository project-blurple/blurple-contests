import type { Awaitable, ButtonInteraction, MessageComponentInteraction, SelectMenuInteraction, Snowflake } from "discord.js";
import { mainLogger } from "../../utils/logger";

interface ButtonComponent {
  type: "BUTTON";
  callback(interaction: ButtonInteraction): Awaitable<void>;
}

interface SelectMenuComponent {
  type: "SELECT_MENU";
  callback(interaction: SelectMenuInteraction): Awaitable<void>;
}

type Component = {
  allowedUsers: Snowflake[] | "all";
} & (ButtonComponent | SelectMenuComponent);

export const components = new Map<string, Component>();

export default (interaction: MessageComponentInteraction): void => {
  const component = components.get(interaction.customId);
  if (component) {
    if (component.allowedUsers !== "all" && !component.allowedUsers.includes(interaction.user.id)) return;

    if (component.type === "BUTTON" && interaction.isButton()) void component.callback(interaction);
    if (component.type === "SELECT_MENU" && interaction.isSelectMenu()) void component.callback(interaction);
  } else mainLogger.warn(`Component ${interaction.customId} not found.`);
};
