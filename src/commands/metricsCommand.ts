import { MessageEmbed } from 'discord.js';
import { msToTime } from '../utils';
import { Command } from './types';

const MetricsCommand: Command = {
	execute: (channel, args, db) => {
		let message: string = '';

		for (const user of db.getMetricsDB().getUserTotalTimes()) {
			message += `<@${user.id}>: ${msToTime(user.time)}`;
			message += '\n';
		}

		const embed = new MessageEmbed({
			title: 'Total times in voice channels',
		}).addField('Users', message);

		channel.send(embed);
	},
	alias: ['!times'],
};

export default MetricsCommand;
