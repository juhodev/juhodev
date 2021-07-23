import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import { bank } from '..';
import { BankChangeType } from '../bank/types';
import { getSnowflakeByUsernameAndId, isNil, isNumeric } from '../utils';
import { Command } from './types';

const GiftCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			channel.send('!gift <user> <amount>');
			return;
		}

		sendGift(channel, author, args);
	},
	alias: ['!gift', '!give'],
};

async function sendGift(channel: TextChannel | DMChannel | NewsChannel, author: User, args: string[]) {
	const toUser: string = args.shift();
	const amount: string = args.shift();

	if (isNil(toUser) || isNil(amount)) {
		channel.send('!gift <user> <amount>');
		return;
	}

	if (!isNumeric(amount)) {
		channel.send(`${amount} must be a number`);
		return;
	}

	const toSnowflake: string = await getSnowflakeByUsernameAndId(toUser);
	if (isNil(toSnowflake)) {
		channel.send(`${toUser} not found`);
		return;
	}

	const amountFloat: number = parseFloat(amount);
	if (!bank.hasBalance(author.id, amountFloat)) {
		channel.send(`<@${author.id}> you don't have ${amount} points`);
		return;
	}

	bank.removeFromUser(author.id, amountFloat, BankChangeType.GIFT);
	bank.addToUser(toSnowflake, amountFloat, BankChangeType.GIFT);
	channel.send(`<@${author.id}> sent ${amountFloat.toLocaleString()} to <@${toSnowflake}>`);
}

export default GiftCommand;
