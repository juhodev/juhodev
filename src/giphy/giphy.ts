import { Search } from './types';
import fetch from 'node-fetch';
import RandomString from '../randomString';

class Giphy {
	private oldSearches: Map<string, Search[]>;
	private randoms: Map<string, RandomString>;

	constructor() {
		this.oldSearches = new Map();
		this.randoms = new Map();
	}

	async search(searchTerm: string): Promise<string> {
		let searches: Search[];

		if (this.oldSearches.has(searchTerm)) {
			searches = this.oldSearches.get(searchTerm);
		} else {
			searches = await this.getFromTheInterwebs(searchTerm);
		}

		const searchEmbeds: string[] = searches.map(
			(search) => search.embedUrl,
		);

		let random: RandomString = this.randoms.get(searchTerm);
		if (random === undefined) {
			random = new RandomString();
		}

		const embed: string = random.pseudoRandom(searchEmbeds);
		this.randoms.set(searchTerm, random);

		return embed;
	}

	private async getFromTheInterwebs(searchTerm: string): Promise<Search[]> {
		const response = await fetch(
			`http://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_TOKEN}&q=${searchTerm}`,
		);
		const responseJSON = await response.json();
		const { data } = responseJSON;
		const searches: Search[] = [];

		for (const obj of data) {
			const search: Search = {
				date: new Date().getTime(),
				embedUrl: obj.embed_url,
				id: obj.id,
			};

			searches.push(search);
		}

		this.oldSearches.set(searchTerm, searches);
		return searches;
	}
}

export default Giphy;
