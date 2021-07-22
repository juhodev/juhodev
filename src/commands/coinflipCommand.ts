import { DMChannel, MessageEmbed, NewsChannel, TextChannel, User } from 'discord.js';
import { bank } from '..';
import { BankChangeType } from '../bank/types';
import { DBCoinflip } from '../db/types';
import { knex } from '../db/utils';
import { isNumeric } from '../utils';
import { Command } from './types';

const CoinflipCommand: Command = {
	execute: (channel, author, args, db) => {
		coinflip(channel, author, args);
	},
	alias: ['!coinflip', '!flip', '!coin'],
};

async function coinflip(channel: DMChannel | NewsChannel | TextChannel, author: User, args: string[]) {
	if (args.length === 0) {
		channel.send('!coinflip <side> <amount>\nSides: A or B');
		return;
	}

	const userSide: string = args.shift().toLowerCase();
	const amount: string = args.shift();
	if (!isNumeric(amount)) {
		channel.send('Amount must be a number');
		return;
	}

	const amountFloat: number = parseFloat(amount);
	if (amountFloat <= 1) {
		channel.send('You must bet more than 1');
		return;
	}

	if (!bank.hasBalance(author.id, amountFloat)) {
		channel.send(`Sorry you don't have ${amountFloat}`);
		return;
	}

	const aSide: string = 'A';
	const bSide: string = 'B';

	if (![aSide.toLowerCase(), bSide.toLowerCase()].includes(userSide)) {
		channel.send('!coinflip <side> <amount>\nSides: A and B');
		return;
	}

	bank.removeFromUser(author.id, amountFloat, BankChangeType.COINFLIP);

	const embed: MessageEmbed = new MessageEmbed({ title: 'Coinflip' });
	embed.setThumbnail('https://cdn.betterttv.net/emote/6094368d39b5010444d0cc16/3x.gif');
	embed.setTimestamp();
	embed.addField('Sides', `${aSide} and ${bSide}`);

	const random: number = Math.random();
	embed.setFooter(random);
	// < .5 A side wins, > .5 B side wins
	if (random < 0.5) {
		embed.addField('Coin', `Landed on ${aSide} side`);
		if (userSide === aSide.toLowerCase()) {
			bank.addToUser(author.id, amountFloat * 2, BankChangeType.COINFLIP);
			embed.addField('Result', `💵 💵 💵 You won ${(amountFloat * 2).toLocaleString()} 💵 💵 💵`);
			await saveCoinflip(author.id, userSide, aSide, amountFloat, true);
		} else {
			embed.addField('Result', `You lost ${amountFloat.toLocaleString()}`);
			await saveCoinflip(author.id, userSide, aSide, amountFloat, false);
		}
	} else {
		embed.addField('Coin', `Landed on ${bSide} side`);
		if (userSide === aSide.toLowerCase()) {
			embed.addField('Result', `You lost ${amountFloat.toLocaleString()}`);
			await saveCoinflip(author.id, userSide, bSide, amountFloat, false);
		} else {
			bank.addToUser(author.id, amountFloat * 2, BankChangeType.COINFLIP);
			embed.addField('Result', `💵 💵 💵 You won ${(amountFloat * 2).toLocaleString()} 💵 💵 💵`);
			await saveCoinflip(author.id, userSide, bSide, amountFloat, true);
		}
	}

	channel.send(embed);
}

async function saveCoinflip(playerId: string, playerBet: string, coinSide: string, amount: number, win: boolean) {
	const dbCoinflip: DBCoinflip = {
		coin_side: coinSide.toLowerCase(),
		player_bet: playerBet,
		date: new Date().getTime(),
		player: playerId,
		win,
		amount,
	};

	await knex<DBCoinflip>('coinflip').insert(dbCoinflip);
}

export default CoinflipCommand;
