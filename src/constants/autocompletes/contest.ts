import { matchSorter } from "match-sorter";
import { Contest } from "../../database/models/Contest.model";
import type { Autocomplete } from "../../handlers/interactions/autocompletes";

const contestAutocomplete: Autocomplete<string> = async query => {
  const contests = await Contest.find().then(list => list.map(({ contestId, name }) => ({ contestId, name })));

  const searchResults = matchSorter(contests, query);
  return searchResults.map(({ contestId, name }) => ({ name, value: contestId }));
};

export default contestAutocomplete;
