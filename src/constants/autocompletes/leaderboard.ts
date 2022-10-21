import type { Autocomplete } from ".";
import { Leaderboard } from "../../database/models/Leaderboard.model";
import { matchSorter } from "match-sorter";

const leaderboardAutocomplete: Autocomplete<string> = {
  async execute(query) {
    const leaderboards = await Leaderboard.find();

    const searchResults = matchSorter(leaderboards, query, { keys: ["leaderboardId", "name"]});
    return searchResults.map(({ leaderboardId, name }) => ({ name, value: leaderboardId }));
  },
};

export default leaderboardAutocomplete;
