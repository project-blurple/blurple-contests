import { parseDate } from "chrono-node";
import { relativeTime } from "human-date";
import type { Autocomplete } from "../../handlers/interactions/autocompletes";

const dateAutocomplete: Autocomplete<string> = query => {
  const date = parseDate(query, new Date(), { forwardDate: true }) as Date | null;
  if (!date) {
    return [{ name: "Invalid date", value: "0" }];
  }

  return [{ name: `${date.toString()} (${relativeTime(date)})`, value: String(date.getTime()) }];
};

export default dateAutocomplete;
