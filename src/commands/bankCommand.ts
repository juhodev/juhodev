import { DMChannel, NewsChannel, TextChannel } from 'discord.js';
import { bank } from '..';
import { BankChangeType } from '../bank/types';
import { getSnowflakeByUsernameAndId, isNil, isNumeric } from '../utils';
import { Command } from './types';

const BankCommand: Command = {
	execute: (channel, author, args, db) => {
		if (author.id !== '138256190227480576' || '140233862235160577') {
			channel.send('nt');
			return;
		}

		const action: string = args.shift();
		const userAndTag: string = args.shift();
		const amount: string = args.shift();

		if (isNil(action) || isNil(userAndTag) || isNil(amount)) {
			channel.send('!eco <get|set|add> <user#id> <amount>');
			return;
		}

		if (!isNumeric(amount)) {
			channel.send('Amount must be a number');
			return;
		}

		const amountFloat: number = parseFloat(amount);

		switch (action.toLowerCase()) {
			case 'add':
				addPoints(channel, userAndTag, amountFloat);
				break;

			case 'remove':
				removePoints(channel, userAndTag, amountFloat);
				break;

			case 'set':
				setPoints(channel, userAndTag, amountFloat);
				break;

			default:
				channel.send('!eco <get|set|add> <user#id> <amount>');
				break;
		}
	},
	alias: ['!eco', '!economy', '!bank'],
};

async function addPoints(channel: DMChannel | NewsChannel | TextChannel, userAndTag: string, amount: number) {
	const snowflake: string = await getSnowflakeByUsernameAndId(userAndTag);
	if (isNil(snowflake)) {
		channel.send(`${userAndTag} not found!`);
		return;
	}

	const response: string = bank.addToUser(snowflake, amount, BankChangeType.ECO);
	if (!isNil(response)) {
		channel.send(response);
	} else {
		channel.send(`${amount} added to ${userAndTag}`);
	}
}

async function removePoints(channel: DMChannel | NewsChannel | TextChannel, userAndTag: string, amount: number) {
	const snowflake: string = await getSnowflakeByUsernameAndId(userAndTag);
	if (isNil(snowflake)) {
		channel.send(`${userAndTag} not found!`);
		return;
	}

	const response: string = bank.removeFromUser(snowflake, amount, BankChangeType.ECO);
	if (!isNil(response)) {
		channel.send(response);
	} else {
		channel.send(`${amount} removed from ${userAndTag}`);
	}
}

async function setPoints(channel: DMChannel | NewsChannel | TextChannel, userAndTag: string, amount: number) {
	const snowflake: string = await getSnowflakeByUsernameAndId(userAndTag);
	if (isNil(snowflake)) {
		channel.send(`${userAndTag} not found!`);
		return;
	}

	const response: string = bank.setUser(snowflake, amount, BankChangeType.ECO);
	if (!isNil(response)) {
		channel.send(response);
	} else {
		channel.send(`${userAndTag} set to ${amount}`);
	}
}

export default BankCommand;
