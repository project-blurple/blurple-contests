import { matchSorter } from "match-sorter";
import type { Autocomplete } from "../../handlers/interactions/autocompletes";
import { Leaderboard } from "../../database/models/Leaderboard.model";

const leaderboardAutocomplete: Autocomplete<string> = async query => {
  const leaderboards = await Leaderboard.find();

  const searchResults = matchSorter(leaderboards, query, { keys: ["leaderboardId", "name"] });
  return searchResults.map(({ leaderboardId, name }) => ({ name, value: leaderboardId }));
};

export default leaderboardAutocomplete;
