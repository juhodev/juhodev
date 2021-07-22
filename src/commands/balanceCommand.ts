import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import { bank } from '..';
import { getSnowflakeByUsernameAndId, isNil } from '../utils';
import { Command } from './types';

const BalanceCommand: Command = {
	execute: (channel, author, args, db) => {
		getBalance(channel, author, args);
	},
	alias: ['!balance', '!bal'],
};

async function getBalance(channel: DMChannel | NewsChannel | TextChannel, author: User, args: string[]) {
	if (args.length === 0) {
		const balance: string = bank.getBalance(author.id).toLocaleString();
		channel.send(`Your balance is ${balance}`);
		return;
	}

	const userAndTag: string = args.shift();
	const snowflake: string = await getSnowflakeByUsernameAndId(userAndTag);
	if (isNil(snowflake)) {
		channel.send(`${userAndTag} not found!`);
		return;
	}

	const balance: string = bank.getBalance(snowflake).toLocaleString();

	channel.send(`${userAndTag} balance is ${balance}`);
}

export default BalanceCommand;
