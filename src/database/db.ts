import * as fs from 'fs';
import QuoteDB from './quoteDB';

const DATA_DIR = 'data';
const QUOTE_FILE = 'data/quotes.json';

class DB {
	private quoteDB: QuoteDB;

	constructor() {
		this.quoteDB = new QuoteDB();
	}

	getQuoteDB() {
		return this.quoteDB;
	}

	load() {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR);
		}

		this.quoteDB.load();
	}
}

export default DB;
