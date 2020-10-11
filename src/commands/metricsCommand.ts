import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import DB from '../database/db';
import { UserVoiceHistory } from '../metrics/types';
import { msToTime } from '../utils';
import { Command } from './types';

const MetricsCommand: Command = {
	execute: (channel, args, db) => {
		if (args.length === 0) {
			sendTotalTimes(channel, db);
			return;
		}

		const userArgument = args.shift().toUpperCase();
		const userTimes: UserVoiceHistory = db
			.getMetricsDB()
			.getUserTimes(userArgument);

		let message: string = '';

		for (const voiceHistory of userTimes.channels) {
			message += `${voiceHistory.name}: ${msToTime(voiceHistory.time)}`;
			message += '\n';
		}

		const embed = new MessageEmbed({
			title: `Times for ${userTimes.name}`,
		}).addField('Channels', message);

		channel.send(embed);
	},
	alias: ['!times'],
};

function sendTotalTimes(
	channel: TextChannel | DMChannel | NewsChannel,
	db: DB,
) {
	let message: string = '';

	for (const user of db.getMetricsDB().getUserTotalTimes()) {
		message += `<@${user.id}>: ${msToTime(user.time)}`;
		message += '\n';
	}

	const embed = new MessageEmbed({
		title: 'Total times in voice channels',
	}).addField('Users', message);

	channel.send(embed);
}

export default MetricsCommand;
