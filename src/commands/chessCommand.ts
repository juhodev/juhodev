import { DMChannel, MessageEmbed, NewsChannel, TextChannel, Message } from 'discord.js';
import { Command } from './types';
import { fetchGames } from '../lichess/lichess';
import { chess } from '../index';
import { ChessPlayer } from '../chess/types';
import { isNil } from '../utils';

const ChessCommand: Command = {
	execute: (channel, author, args, db) => {
		sendMessage(channel, args);
	},
	alias: ['!chess'],
};

async function sendMessage(channel: DMChannel | NewsChannel | TextChannel, args: string[]) {
	const user: string = args.shift().toLowerCase();

	const msg: Message = await channel.send(new MessageEmbed({ title: 'Chess', description: 'Loading...' }))

	await fetchGames(user);

	const profile: ChessPlayer = chess.getProfile(user);
	if (isNil(profile)) {
		// TODO: Error
		return;
	}

	let speedStr: string = '';
	let ratingStr: string = '';
	let playedStr: string = '';
	for (const speed of Object.keys(profile.rating)) {
		const ratings: number[] = profile.rating[speed];
		if (ratings.length === 0) {
			continue;
		}

		speedStr += `${speed}\n`;
		ratingStr += `${ratings[ratings.length - 1]}\n`;
		playedStr += `${ratings.length} (${profile.wins[speed]} / ${profile.draws[speed]} / ${profile.losses[speed]})\n`;
	}

	if (speedStr.length === 0) {
		speedStr = '\u200B';
	}

	if (ratingStr.length === 0) {
		ratingStr = '\u200B';
	}

	if (playedStr.length === 0) {
		playedStr = '\u200B';
	}

	const openings: { name: string, count: number }[] = [];
	for (const opening of Object.keys(profile.openings)) {
		openings.push({ name: opening, count: profile.openings[opening] });
	}

	openings.sort((a, b) => b.count - a.count);
	let openingStr: string = '';
	let openingCountStr: string = '';
	for (let i = 0; i < 3; i++) {
		const opening: { name: string, count: number } = openings[i];
		openingStr += `${opening.name}\n`;
		openingCountStr += `${opening.count}\n`;
	}

	if (openingStr.length === 0) {
		openingStr = '\u200B';
	}

	if (openingCountStr.length === 0) {
		openingCountStr = '\u200B';
	}

	const embed: MessageEmbed = new MessageEmbed({ title: 'Chess' })
		.addField('Name', user)
		.addFields(
			{ name: 'Speed', value: speedStr, inline: true },
			{ name: 'Rating', value: ratingStr, inline: true },
			{ name: 'Rated games (W / D / L)', value: playedStr, inline: true },
		)
		.addField('\u200B', '\u200B', false)
		.addFields(
			{ name: 'Opening', value: openingStr, inline: true },
			{ name: 'Times played', value: openingCountStr, inline: true },
			{ name: '\u200B', value: '\u200B', inline: false },
		)
		.addFields(
			{ name: 'Blunders', value: `${profile.blunders.total} (${Math.round(profile.blunders.total / profile.blunders.gamesJudged)} per game)`, inline: true },
			{ name: 'Mistakes', value: `${profile.mistakes.total} (${Math.round(profile.mistakes.total / profile.mistakes.gamesJudged)} per game)`, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
		);

	msg.edit(embed);
}

export default ChessCommand;
