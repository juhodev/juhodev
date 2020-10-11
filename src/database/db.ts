import { Guild, TextChannel } from 'discord.js';
import * as fs from 'fs';
import QuoteDB from './quoteDB';
import { DBConfig, DB_CONFIG_FILE, DB_DATA_DIR } from './types';

class DB {
	private quoteDB: QuoteDB;
	private config: DBConfig;

	constructor() {
		this.quoteDB = new QuoteDB();
		this.config = {};
	}

	setup(channel: TextChannel) {
		const { guild } = channel;
		this.config.guild = guild;

		this.writeToDisk();
	}

	getGuild(): Guild {
		return this.config.guild;
	}

	getQuoteDB() {
		return this.quoteDB;
	}

	load() {
		if (!fs.existsSync(DB_DATA_DIR)) {
			fs.mkdirSync(DB_DATA_DIR);
			return;
		}

		if (!fs.existsSync(`${DB_DATA_DIR}/${DB_CONFIG_FILE}`)) {
			this.writeToDisk();
		} else {
			const configString: string = fs.readFileSync(
				`${DB_DATA_DIR}/${DB_CONFIG_FILE}`,
				'utf-8',
			);
			this.config = JSON.parse(configString);
		}

		this.quoteDB.load();
	}

	private writeToDisk() {
		fs.writeFileSync(
			`${DB_DATA_DIR}/${DB_CONFIG_FILE}`,
			JSON.stringify(this.config),
		);
	}
}

export default DB;
