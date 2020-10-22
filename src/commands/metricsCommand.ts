import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import { DBUser, DBVoiceLog } from '../db/types';
import { knex } from '../db/utils';
import { msToTime } from '../utils';
import { Command } from './types';

const MetricsCommand: Command = {
	execute: (channel, args, db) => {
		if (args.length === 0) {
			sendTotalTimes(channel);
			return;
		}

		const userArgument = args.shift().toUpperCase();
		sendUserTimes(channel, userArgument);
	},
	alias: ['!times'],
};

async function sendUserTimes(
	channel: TextChannel | DMChannel | NewsChannel,
	userWithTag: string,
) {
	const hashtagIndex: number = userWithTag.indexOf('#');
	const username: string = userWithTag.substr(0, hashtagIndex).toUpperCase();
	const tag: string = userWithTag.substr(
		hashtagIndex + 1,
		userWithTag.length,
	);

	const users: DBUser[] = await knex<DBUser>('users').where({
		discord_name_uppercase: username,
		discord_tag: tag,
	});

	if (users.length !== 1) {
		console.error(`User not found! ${username}#${tag}`);
		channel.send(
			`User not found! Did you write the user tag like this: User#0000?`,
		);
		return;
	}

	const user: DBUser = users[0];
	const userTimes: DBVoiceLog[] = await knex<DBVoiceLog>('voice_log').where({
		snowflake: user.snowflake,
	});

	let message: string = '';

	for (const userTime of userTimes) {
		message += `${userTime.channel}: ${msToTime(userTime.time)}`;
		message += '\n';
	}

	const embed = new MessageEmbed({
		title: `Times for ${user.discord_name_original}`,
	}).addField('Channels', message);
	channel.send(embed);
}

async function sendTotalTimes(channel: TextChannel | DMChannel | NewsChannel) {
	let message: string = '';

	const userTimes: DBVoiceLog[] = await knex<DBVoiceLog>('voice_log').where(
		{},
	);
	const totalTimes: Map<string, number> = new Map();

	for (const userTime of userTimes) {
		let userTotalTime: number = 0;

		if (totalTimes.has(userTime.snowflake)) {
			userTotalTime = totalTimes.get(userTime.snowflake);
		}

		userTotalTime += userTime.time;
		totalTimes.set(userTime.snowflake, userTotalTime);
	}

	for (const [snowflake, time] of totalTimes) {
		message += `<@${snowflake}>: ${msToTime(time)}`;
		message += '\n';
	}

	const embed = new MessageEmbed({
		title: 'Total times in voice channels',
	}).addField('Users', message);

	channel.send(embed);
}

export default MetricsCommand;
