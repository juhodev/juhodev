import {
	TextChannel,
	MessageEmbed,
	DMChannel,
	NewsChannel,
	User,
} from 'discord.js';
import DB from '../database/db';
import { Quote, QuoteResponse } from '../database/types';
import { Command } from './types';

const QuoteCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			sendRandomQuote(channel, db);
			return;
		}

		const action = args.shift().toUpperCase();

		switch (action) {
			case 'ADD':
				saveQuote(channel, author, args, db);
				break;

			case 'LIST':
				sendQuoteList(channel, db);
				break;

			case 'REMOVE':
				removeQuote(channel, args, db);
				break;

			case 'READ':
				readQuote(channel, args, db);
				break;

			default:
				channel.send(`Action ${action} not found`);
				break;
		}
	},

	alias: ['!quote', '!q'],
};

async function sendRandomQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	db: DB,
) {
	const randomQuote: Quote = await db.getQuoteDB().getRandomQuote();
	sendQuote(channel, randomQuote);
}

async function readQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const quoteTitle: string = args.shift();

	if (!db.getQuoteDB().hasQuote(quoteTitle)) {
		channel.send(`Quote with the title "${quoteTitle}" not found`);
		return;
	}

	const fullQuote: Quote = await db.getQuoteDB().getQuote(quoteTitle);
	sendQuote(channel, fullQuote);
}

async function removeQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const quoteTitle: string = args.shift();

	const response: QuoteResponse = await db
		.getQuoteDB()
		.removeQuote(quoteTitle);
	if (response.error) {
		channel.send(response.message);
		return;
	}

	channel.send('Quote removed');
}

async function saveQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	author: User,
	args: string[],
	db: DB,
) {
	const title = args.shift();
	const fullQuote = args.join(' ');

	if (db.getQuoteDB().hasQuote(title)) {
		channel.send('A quote with that title already exists');
		return;
	}

	db.getQuoteDB().save(title, fullQuote, author);
	channel.send(`The quote was saved with the title "${title}"`);
}

function sendQuoteList(channel: TextChannel | DMChannel | NewsChannel, db: DB) {
	const quoteList = db.getQuoteDB().getQuotes();

	if (quoteList.length === 0) {
		const embed = new MessageEmbed({ title: 'Quotes' }).addField(
			'List',
			'No quotes saved',
		);

		channel.send(embed);
		return;
	}

	let list = '';

	for (const quote of quoteList) {
		list += quote.name;
		list += '\n';
	}

	const embed = new MessageEmbed({
		title: 'Quotes',
	}).addField('List', list);

	channel.send(embed);
}

function sendQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	quote: Quote,
) {
	const embed = new MessageEmbed({}).addField(quote.name, quote.content);
	channel.send(embed);
}

export default QuoteCommand;
