import { DB_DATA_DIR, DB_QUOTE_FILE, Quote, QuoteResponse } from './types';
import * as fs from 'fs';
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
		title: string,
		content: string,
		user: User,
	): Promise<QuoteResponse> {
		const result: DBQuote[] = await knex<DBQuote>('quotes').where({
			title,
		});

		if (result.length !== 0) {
			return {
				error: true,
				message: `A quote with the title "${title}" already exists`,
			};
		}

		this.quotes.push({ title, content });

		await knex<DBQuote>('quotes').insert({
			submission_by: user.id,
			submission_date: new Date().getTime(),
			views: 0,
			title,
			content,
		});
	}

	async getRandomQuote(): Promise<Quote> {
		const allQuotes: string[] = this.quotes.map((quote) => quote.title);
		const randomTitle: string = this.random.pseudoRandom(allQuotes);

		return await this.getQuote(randomTitle);
	}

	async getQuote(title: string): Promise<Quote> {
		const quote: Quote = this.quotes.find(
			(quote) => quote.title.toUpperCase() === title.toUpperCase(),
		);

		await knex<DBQuote>('quotes')
			.increment('views')
			.where({ title: quote.title });

		return quote;
	}

	getQuotes(): Quote[] {
		return this.quotes;
	}

	hasQuote(title: string) {
		return this.quotes.find((quote) => quote.title === title) !== undefined;
	}

	async removeQuote(title: string): Promise<QuoteResponse> {
		const quoteIndex: number = this.quotes.findIndex(
			(quote) => quote.title === title,
		);

		if (quoteIndex === 0) {
			return {
				error: true,
				message: `Quote with the title "${title}" not found`,
			};
		}

		this.quotes.splice(quoteIndex, 1);
		await knex<DBQuote>('quotes').delete().where({ title });
		return {
			error: false,
		};
	}

	async load() {
		const result: DBQuote[] = await knex<DBQuote>('quotes').where({});

		for (const dbQuote of result) {
			this.quotes.push({
				title: dbQuote.title,
				content: dbQuote.content,
			});
		}
	}
}

export default QuoteDB;
