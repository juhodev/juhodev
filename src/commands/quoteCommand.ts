import { TextChannel, MessageEmbed, DMChannel, NewsChannel } from 'discord.js';
import DB from '../database/db';
import { Quote } from '../database/types';
import { Command } from './types';

const QuoteCommand: Command = {
	execute: (channel, args, db) => {
		if (args.length === 0) {
			sendQuote(channel, db.getQuoteDB().getRandomQuote());
			return;
		}

		const action = args.shift().toUpperCase();

		switch (action) {
			case 'ADD':
				saveQuote(channel, args, db);
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

function readQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const quoteTitle: string = args.shift();

	if (!db.getQuoteDB().hasQuote(quoteTitle)) {
		channel.send(`Quote with the title "${quoteTitle}" not found`);
		return;
	}

	const fullQuote: Quote = db.getQuoteDB().getQuote(quoteTitle);
	sendQuote(channel, fullQuote);
}

function removeQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const quoteTitle: string = args.shift();

	if (!db.getQuoteDB().hasQuote(quoteTitle)) {
		channel.send(`Quote with the title "${quoteTitle}" not found!`);
		return;
	}

	db.getQuoteDB().removeQuote(quoteTitle);
	channel.send(`Quote "${quoteTitle}" removed`);
}

function saveQuote(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const title = args.shift();
	const fullQuote = args.join(' ');

	if (db.getQuoteDB().hasQuote(title)) {
		channel.send('A quote with that title already exists');
		return;
	}

	db.getQuoteDB().save(title, fullQuote);
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
		list += quote.title;
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
	const embed = new MessageEmbed({}).addField(quote.title, quote.content);
	channel.send(embed);
}

export default QuoteCommand;
