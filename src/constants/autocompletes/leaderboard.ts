import type { Autocomplete } from "../../handlers/interactions/autocompletes";
import { Leaderboard } from "../../database";
import { matchSorter } from "match-sorter";

const leaderboardAutocomplete: Autocomplete = async query => {
  const search = String(query);
  const leaderboards = await Leaderboard.find();

  const searchResults = matchSorter(leaderboards, search, { keys: ["leaderboardId", "name"]});
  return searchResults.map(({ leaderboardId, name }) => ({ name, value: leaderboardId }));
};

export default leaderboardAutocomplete;
