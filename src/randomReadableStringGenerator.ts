import * as fs from 'fs';
import { DB_DATA_DIR } from './database/types';
import * as path from 'path';
import { knex } from './db/utils';
import { DBRandomString } from './db/types';

class RRSG {
	private adjectives: string[];
	private nouns: string[];

	constructor() {
		this.adjectives = [];
		this.nouns = [];
	}

	load() {
		const adjectiveListAsString: string = fs.readFileSync(
			'resources/adjektiivit.json',
			'utf-8',
		);
		const nounListAsString: string = fs.readFileSync(
			'resources/substantiivit.json',
			'utf-8',
		);

		this.adjectives = JSON.parse(adjectiveListAsString);
		this.nouns = JSON.parse(nounListAsString);
	}

	async generate(): Promise<string> {
		let generatedString: string;

		while (generatedString === undefined) {
			const random: string = this.randomString();

			const result: DBRandomString[] = await knex<DBRandomString>(
				'random_strings',
			).where({
				random_string: random,
			});

			if (result.length === 0) {
				generatedString = random;
			}
		}

		return generatedString;
	}

	private randomString(): string {
		const adjectiveOne: string = this.adjectives[
			Math.floor(Math.random() * this.adjectives.length)
		];
		const adjectiveTwo: string = this.adjectives[
			Math.floor(Math.random() * this.adjectives.length)
		];
		const randomNoun: string = this.nouns[
			Math.floor(Math.random() * this.nouns.length)
		];

		return adjectiveOne + adjectiveTwo + randomNoun;
	}
}

export default RRSG;
