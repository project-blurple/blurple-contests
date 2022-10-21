import type { Autocomplete } from ".";
import { Contest } from "../../database/models/Contest.model";
import { matchSorter } from "match-sorter";

const contestAutocomplete: Autocomplete<string> = {
  async execute(query) {
    const contests = await Contest.find().then(list => list.map(({ contestId, name }) => ({ contestId, name })));

    const searchResults = matchSorter(contests, query);
    return searchResults.map(({ contestId, name }) => ({ name, value: contestId }));
  },
};

export default contestAutocomplete;
