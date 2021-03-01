import {
	DMChannel,
	MessageEmbed,
	NewsChannel,
	Snowflake,
	TextChannel,
} from 'discord.js';
import { DBUser, DBVoiceLog } from '../db/types';
import { knex } from '../db/utils';
import { msToTime } from '../utils';
import { Command } from './types';

const MetricsCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			channel.send('!times <page>');
			return;
		}

		const page: string = args.shift();
		const pageAsNumber: number = parseInt(page);

		if (Number.isNaN(pageAsNumber)) {
			channel.send(`There was an error with the page number ${page} (${pageAsNumber})`);
			return;
		}

		sendTotalTimes(channel, pageAsNumber);
	},
	alias: ['!times'],
};

async function sendTotalTimes(channel: TextChannel | DMChannel | NewsChannel, page: number) {
	let message: string = '';

	const userTimes: DBVoiceLog[] = await knex<DBVoiceLog>('voice_log').where(
		{},
	);

	// Oh man I'm lazy
	type Temp = {
		snowflake: Snowflake;
		time: number;
	};
	const totalTimes: Temp[] = [];

	for (const userTime of userTimes) {
		const oldTime: Temp = totalTimes.find(
			(time) => time.snowflake === userTime.snowflake,
		);

		if (oldTime !== undefined) {
			oldTime.time += userTime.time;
			continue;
		}

		totalTimes.push({ snowflake: userTime.snowflake, time: userTime.time });
	}

	const sortedTimes = totalTimes.sort((a, b) => a.time - b.time).reverse();

	const timesOnOnePage: number = 10;
	const timesOnPage: Temp[] = totalTimes.splice(timesOnOnePage*(page-1), timesOnOnePage);

	message += `Page ${page}\n`;

	for (const userTime of timesOnPage) {
		message += `<@${userTime.snowflake}>: ${msToTime(userTime.time)}`;
		message += '\n';
	}

	const embed = new MessageEmbed({
		title: 'Total times in voice channels',
	}).addField('Users', message);

	channel.send(embed);
}

export default MetricsCommand;
