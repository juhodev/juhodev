import { DB_DATA_DIR, DB_QUOTE_FILE, Quote } from './types';
import * as fs from 'fs';
import RandomString from '../randomString';

class QuoteDB {
	private quotes: Quote[];
	private random: RandomString;

	constructor() {
		this.quotes = [];
		this.random = new RandomString();
	}

	save(title: string, content: string) {
		const quote: Quote = { title, content };

		this.quotes.push(quote);
		this.writeToDisk();
	}

	// TODO: This shouldn't actually be random. Random is bad. Save a list of recently sent quotes
	// and don't send them again in a while
	getRandomQuote(): string {
		const allQuotes: string[] = this.quotes.map((quote) => quote.content);
		return this.random.pseudoRandom(allQuotes);
	}

	getQuotes(): Quote[] {
		return this.quotes;
	}

	hasQuote(title: string) {
		return this.quotes.find((quote) => quote.title === title) !== undefined;
	}

	removeQuote(title: string) {
		const quoteIndex: number = this.quotes.findIndex(
			(quote) => quote.title === title,
		);

		this.quotes.splice(quoteIndex, 1);
		this.writeToDisk();
	}

	load() {
		if (!fs.existsSync(`${DB_DATA_DIR}/${DB_QUOTE_FILE}`)) {
			this.writeToDisk();
			return;
		}

		const quoteString: string = fs.readFileSync(
			`${DB_DATA_DIR}/${DB_QUOTE_FILE}`,
			'utf-8',
		);
		this.quotes = JSON.parse(quoteString);
	}

	private writeToDisk() {
		fs.writeFileSync(
			`${DB_DATA_DIR}/${DB_QUOTE_FILE}`,
			JSON.stringify(this.quotes),
		);
	}
}

export default QuoteDB;
