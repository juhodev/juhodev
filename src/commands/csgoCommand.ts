import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import { csgo } from '..';
import { steam } from '../api/server';
import { CsgoProfile } from '../steam/types';
import { Command } from './types';

const CsgoCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			channel.send('!steam <steamID64/link>');
			return;
		}

		const link: string = args.shift();

		if (link === undefined) {
			channel.send('!steam <steamID64/link>');
			return;
		}

		sendProfile(channel, link);
	},
	alias: ['!cs', '!csgo'],
};

async function sendProfile(channel: TextChannel | DMChannel | NewsChannel, steamId64: string) {
	let url: string;
	if (steamId64.toLowerCase().startsWith('http')) {
		url = steamId64;
	} else {
		url = `https://steamcommunity.com/profiles/${steamId64}`;
	}
	const csgoProfile: CsgoProfile = await csgo.getByUrl(url);

	if (csgoProfile === undefined) {
		channel.send('A player with that steam id not found!');
		return;
	}

	const embed = new MessageEmbed({ title: 'CSGO stats' })
		.addField('Name', csgoProfile.name)
		.addField('Games saved', csgoProfile.matchesPlayed)
		.addFields(
			{
				name: 'Won',
				value: csgoProfile.won,
				inline: true,
			},
			{ name: 'Lost', value: csgoProfile.lost, inline: true },
			{ name: 'Tied', value: csgoProfile.tied, inline: true },
		)
		.addFields(
			{
				name: 'Kills',
				value: `${Math.round(csgoProfile.gameAverages.kills.value)} (${
					csgoProfile.gameHighest.kills.value
				} highest)`,
				inline: true,
			},
			{
				name: 'Deaths',
				value: `${Math.round(csgoProfile.gameAverages.deaths.value)} (${
					csgoProfile.gameHighest.deaths.value
				} highest)`,
				inline: true,
			},
			{
				name: 'Assists',
				value: `${Math.round(csgoProfile.gameAverages.assists.value)} (${
					csgoProfile.gameHighest.assists.value
				} highest)`,
				inline: true,
			},
		)
		.addFields(
			{
				name: 'HS %',
				value: `${Math.round(csgoProfile.gameAverages.hsp.value)} (${
					csgoProfile.gameHighest.hsp.value
				}% highest)`,
				inline: true,
			},
			{
				name: 'MVPs',
				value: `${Math.round(csgoProfile.gameAverages.mvps.value)} (${
					csgoProfile.gameHighest.mvps.value
				} highest)`,
				inline: true,
			},
			{
				name: 'Score',
				value: `${Math.round(csgoProfile.gameAverages.score.value)} (${
					csgoProfile.gameHighest.score.value
				} highest)`,
				inline: true,
			},
		)
		.addField('Link', `https://juho.dev/cs?id=${csgoProfile.id}`)
		.setThumbnail(csgoProfile.avatarLink);

	channel.send(embed);
}

export default CsgoCommand;
