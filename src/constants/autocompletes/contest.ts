import type { Autocomplete } from "../../handlers/interactions/autocompletes";
import { Contest } from "../../database";
import { matchSorter } from "match-sorter";

const contestAutocomplete: Autocomplete = async query => {
  const search = String(query);
  const contests = await Contest.find().then(list => list.map(({ contestId, name }) => ({ contestId, name })));

  const searchResults = matchSorter(contests, search);
  return searchResults.map(({ contestId, name }) => ({ name, value: contestId }));
};

export default contestAutocomplete;
