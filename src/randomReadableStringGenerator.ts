import * as fs from 'fs';
import { DB_DATA_DIR } from './database/types';
import * as path from 'path';

class RRSG {
	private adjectives: string[];
	private nouns: string[];

	// If I knew I'd generate over 1k strings this isn't how I'd do this
	// but for a small amount of string why not
	private generatedStrings: string[];

	constructor() {
		this.adjectives = [];
		this.nouns = [];
		this.generatedStrings = [];
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
		if (fs.existsSync(`${DB_DATA_DIR}/generatedStrings.json`)) {
			const alreadyGenerated: string = fs.readFileSync(
				`${DB_DATA_DIR}/generatedStrings.json`,
				'utf-8',
			);

			this.generatedStrings = JSON.parse(alreadyGenerated);
		}

		this.adjectives = JSON.parse(adjectiveListAsString);
		this.nouns = JSON.parse(nounListAsString);
	}

	generate(): string {
		let generatedString: string;

		while (generatedString === undefined) {
			const random: string = this.randomString();

			if (!this.generatedStrings.includes(random)) {
				generatedString = random;
			}
		}

		this.generatedStrings.push(generatedString);
		this.writeToDisk();
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

	private writeToDisk() {
		const file: string = path.resolve(DB_DATA_DIR, 'generatedStrings.json');
		fs.writeFileSync(file, JSON.stringify(this.generatedStrings));
	}
}

export default RRSG;
