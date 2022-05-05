import type { Awaitable, ModalSubmitInteraction } from "discord.js";
import { mainLogger } from "../../utils/logger";

type ModalCallback = (modal: ModalSubmitInteraction) => Awaitable<void>;
export const modals: Map<string, ModalCallback> = new Map();

export default (modal: ModalSubmitInteraction): void => {
  const callback = modals.get(modal.customId);
  if (callback) void callback(modal);
  else mainLogger.warn(`Modal ${modal.customId} not found.`);
};

export function getModalTextInput(actionRows: ModalSubmitInteraction["components"], customId: string): string | null {
  const actionRow = actionRows.find(row => row.components.some(component => component.customId === customId));
  if (!actionRow) return null;

  const textInput = actionRow.components.find(component => component.customId === customId);
  if (!textInput) return null;

  return textInput.value;
}
