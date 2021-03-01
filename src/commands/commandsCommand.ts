import { DMChannel, MessageEmbed, NewsChannel, TextChannel, User } from 'discord.js';
import { DBCommandLog } from '../db/types';
import { knex } from '../db/utils';
import { Command } from './types';

const CommandsCommand: Command = {
	execute: (channel, author, args, db) => {
		sendCommandStats(channel, author);
	},
	alias: ['!commands'],
};
async function sendCommandStats(channel: TextChannel | DMChannel | NewsChannel, author: User) {
	const userCommands: DBCommandLog[] = await knex<DBCommandLog>('command_log').where({
		snowflake: author.id,
	});

	const embed = new MessageEmbed({
		title: `Number of commands sent`,
	}).addField(`Commands sent by ${author.username}`, userCommands.length);

	channel.send(embed);
}
export default CommandsCommand;
