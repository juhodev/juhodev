import { Quote, QuoteResponse } from './types';
import RandomString from '../randomString';
import { User } from 'discord.js';
import { knex } from '../db/utils';
import { DBQuote } from '../db/types';

class QuoteDB {
	private quotes: Quote[];
	private random: RandomString;

	constructor() {
		this.quotes = [];
		this.random = new RandomString();
	}

	async save(
		name: string,
		content: string,
		user: User,
	): Promise<QuoteResponse> {
		const result: DBQuote[] = await knex<DBQuote>('quotes').where({
			name,
		});

		if (result.length !== 0) {
			return {
				error: true,
				message: `A quote with the title "${name}" already exists`,
			};
		}

		this.quotes.push({ name, content });

		await knex<DBQuote>('quotes').insert({
			submission_by: user.id,
			submission_date: new Date().getTime(),
			views: 0,
			name,
			content,
		});
	}

	async getRandomQuote(): Promise<Quote> {
		const allQuotes: string[] = this.quotes.map((quote) => quote.name);
		const randomName: string = this.random.pseudoRandom(allQuotes);

		return await this.getQuote(randomName);
	}

	async getQuote(name: string): Promise<Quote> {
		const quote: Quote = this.quotes.find(
			(quote) => quote.name.toUpperCase() === name.toUpperCase(),
		);

		await knex<DBQuote>('quotes')
			.increment('views')
			.where({ name: quote.name });

		return quote;
	}

	getQuotes(): Quote[] {
		return this.quotes;
	}

	hasQuote(name: string) {
		return this.quotes.find((quote) => quote.name === name) !== undefined;
	}

	async removeQuote(name: string): Promise<QuoteResponse> {
		const quoteIndex: number = this.quotes.findIndex(
			(quote) => quote.name === name,
		);

		if (quoteIndex === 0) {
			return {
				error: true,
				message: `Quote with the title "${name}" not found`,
			};
		}

		this.quotes.splice(quoteIndex, 1);
		await knex<DBQuote>('quotes').delete().where({ name });
		return {
			error: false,
		};
	}

	async load() {
		const result: DBQuote[] = await knex<DBQuote>('quotes').where({});

		for (const dbQuote of result) {
			this.quotes.push({
				name: dbQuote.name,
				content: dbQuote.content,
			});
		}
	}
}

export default QuoteDB;
