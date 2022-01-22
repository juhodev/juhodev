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

	const profile: ChessPlayer = await chess.getProfile(user);
	if (isNil(profile)) {
		// TODO: Error
		return;
	}

	let speedStr: string = '';
	let ratingStr: string = '';
	let playedStr: string = '';
	for (const speed of Object.keys(profile.ratings)) {
		const ratings: number[] = profile.ratings[speed];
		if (ratings.length === 0) {
			continue;
		}

		speedStr += `${speed}\n`;
		ratingStr += `${ratings[ratings.length - 1]}\n`;
		playedStr += `${ratings.length} (${profile.wins[speed] ?? 0} / ${profile.draws[speed] ?? 0} / ${profile.losses[speed] ?? 0})\n`;
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

	const openingsSelf: { name: string, count: number }[] = [];
	for (const opening of Object.keys(profile.openingsSelf)) {
		openingsSelf.push({ name: opening, count: profile.openingsSelf[opening] });
	}

	openingsSelf.sort((a, b) => b.count - a.count);
	let openingSelfStr: string = '';
	let openingCountSelfStr: string = '';
	for (let i = 0; i < 3; i++) {
		const opening: { name: string, count: number } = openingsSelf[i];
		openingSelfStr += `${opening.name}\n`;
		openingCountSelfStr += `${opening.count}\n`;
	}

	if (openingSelfStr.length === 0) {
		openingSelfStr = '\u200B';
	}

	if (openingCountSelfStr.length === 0) {
		openingCountSelfStr = '\u200B';
	}

	const openingsAgainst: { name: string, count: number }[] = [];
	for (const opening of Object.keys(profile.openingsAgainst)) {
		openingsAgainst.push({ name: opening, count: profile.openingsAgainst[opening] });
	}

	openingsAgainst.sort((a, b) => b.count - a.count);
	let openingAgainstStr: string = '';
	let openingCountAgainstStr: string = '';
	for (let i = 0; i < 3; i++) {
		const opening: { name: string, count: number } = openingsAgainst[i];
		openingAgainstStr += `${opening.name}\n`;
		openingCountAgainstStr += `${opening.count}\n`;
	}

	if (openingAgainstStr.length === 0) {
		openingAgainstStr = '\u200B';
	}

	if (openingCountAgainstStr.length === 0) {
		openingCountAgainstStr = '\u200B';
	}

	let mistakesStr: string = '';
	for (const speed of Object.keys(profile.mistakes)) {
		const data: { count: number, data: number } = profile.mistakes[speed];

		mistakesStr += `${speed}: ${data.data} (${Math.round(data.data / data.count)})\n`;
	}

	let blundersStr: string = '';
	for (const speed of Object.keys(profile.blunders)) {
		const data: { count: number, data: number } = profile.blunders[speed];

		blundersStr += `${speed}: ${data.data} (${Math.round(data.data / data.count)})\n`;
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
			{ name: 'Openings played', value: openingSelfStr, inline: true },
			{ name: 'Times played', value: openingCountSelfStr, inline: true },
			{ name: '\u200B', value: '\u200B', inline: false },
		)
		.addFields(
			{ name: 'Openings played against', value: openingAgainstStr, inline: true },
			{ name: 'Times played', value: openingCountAgainstStr, inline: true },
			{ name: '\u200B', value: '\u200B', inline: false },
		)
		.addFields(
			{ name: 'Blunders', value: blundersStr, inline: true },
			{ name: 'Mistakes', value: mistakesStr, inline: true },
			{ name: '\u200B', value: '\u200B', inline: true },
		);

	msg.edit(embed);
}

export default ChessCommand;
