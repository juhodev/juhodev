import { DMChannel, MessageEmbed, NewsChannel, TextChannel, User } from 'discord.js';
import { bank } from '..';
import { BankChangeType } from '../bank/types';
import { knex } from '../db/utils';
import { getSnowflakeByUsernameAndId, isNil, isNumeric } from '../utils';
import { DuelFlipChallenge } from './types';

class Duelflip {
	private CHALLENGE_LIFETIME = 1000 * 60 * 60 * 1;
	private challenges: DuelFlipChallenge[];

	constructor() {
		this.challenges = [];

		setInterval(() => {
			this.removeTrash();
		}, 1000 * 60 * 30);
	}

	async challenge(channel: TextChannel | DMChannel | NewsChannel, author: User, args: string[]) {
		const other: string = args.shift();
		const amount: string = args.shift();
		const side: string = args.shift();

		const aSide: string = 'A';
		const bSide: string = 'B';

		if (isNil(other) || isNil(side) || isNil(amount)) {
			channel.send(`!duelflip <user#id> <amount> <side>\nSides: ${aSide}, ${bSide}`);
			return;
		}

		const otherSnowflake: string = await getSnowflakeByUsernameAndId(other);
		if (isNil(otherSnowflake)) {
			channel.send(`User ${other} not found!`);
			return;
		}

		if (otherSnowflake === author.id) {
			channel.send(`You can't challenge yourself`);
			return;
		}

		if (this.challengeExists(author.id, otherSnowflake)) {
			this.removeChallenge(author.id, otherSnowflake);
		}

		if (!isNumeric(amount)) {
			channel.send('Amount must be a number');
			return;
		}
		const amountFloat: number = parseFloat(amount);

		if (!bank.hasBalance(author.id, amountFloat)) {
			channel.send(`<@${author.id}> you don't have ${amountFloat.toLocaleString()} points`);
			return;
		}

		if (![aSide.toLowerCase(), bSide.toLowerCase()].includes(side.toLowerCase())) {
			channel.send(`!duelflip <user#id> <amount> <side>\nSides: ${aSide}, ${bSide}`);
			return;
		}

		const challenge: DuelFlipChallenge = {
			// Make this look like an id, if we use this in the future
			id: (Math.random() * 100).toString(16),
			amount: amountFloat,
			challengedBy: author.id,
			otherUser: otherSnowflake,
			time: new Date(),
			side,
		};

		const embed: MessageEmbed = new MessageEmbed({ title: 'Duelflip' });
		embed.setTimestamp();
		embed.setDescription(`<@${author.id}> challenges <@${otherSnowflake}> to a coinflip!`);
		embed.addField('Side', side, true);
		embed.addField('Amount', amountFloat.toLocaleString(), true);
		embed.setThumbnail('https://cdn.betterttv.net/emote/6094368d39b5010444d0cc16/3x.gif');
		channel.send(embed);
		this.challenges.push(challenge);
	}

	async accept(channel: TextChannel | DMChannel | NewsChannel, author: User, args: string[]) {
		args.shift();
		const other: string = args.shift();

		const aSide: string = 'A';
		const bSide: string = 'B';

		if (isNil(other)) {
			channel.send('!duelflip accept <user#id>');
			return;
		}

		const otherSnowflake: string = await getSnowflakeByUsernameAndId(other);
		if (isNil(otherSnowflake)) {
			channel.send(`User ${other} not found!`);
			return;
		}

		if (!this.challengeExists(author.id, otherSnowflake)) {
			channel.send(`<@${otherSnowflake}> has not challenged you to a duelflip`);
			return;
		}

		const challenge: DuelFlipChallenge = this.challenges.find(
			(x) => x.challengedBy === otherSnowflake && x.otherUser === author.id,
		);

		if (isNil(challenge)) {
			channel.send('Challenge not found :thoking:');
			return;
		}

		if (!bank.hasBalance(author.id, challenge.amount)) {
			channel.send(`<@${author.id}> you don't have ${challenge.amount.toLocaleString()} points`);
			return;
		}

		if (!bank.hasBalance(challenge.otherUser, challenge.amount)) {
			channel.send(`<@${challenge.otherUser}> no longer has ${challenge.amount.toLocaleString()} points`);
			return;
		}

		bank.removeFromUser(challenge.otherUser, challenge.amount, BankChangeType.DUELFLIP);
		bank.removeFromUser(author.id, challenge.amount, BankChangeType.DUELFLIP);

		const embed: MessageEmbed = new MessageEmbed({ title: 'Duelflip' });
		embed.setThumbnail('https://cdn.betterttv.net/emote/6094368d39b5010444d0cc16/3x.gif');
		embed.setTimestamp();
		embed.addField('Sides', `${aSide} and ${bSide}`);

		const random: number = Math.random();
		embed.setFooter(random);
		// < .5 A side wins, > .5 B side wins
		if (random < 0.5) {
			if (challenge.side.toLowerCase() === aSide.toLowerCase()) {
				embed.addField('Winner', `<@${challenge.challengedBy}>`, true);
				bank.addToUser(challenge.challengedBy, challenge.amount * 2, BankChangeType.DUELFLIP);
			} else {
				embed.addField('Winner', `<@${author.id}>`, true);
				bank.addToUser(author.id, challenge.amount * 2, BankChangeType.DUELFLIP);
			}
		} else {
			if (challenge.side.toLowerCase() === aSide.toLowerCase()) {
				embed.addField('Winner', `<@${author.id}>`, true);
				bank.addToUser(author.id, challenge.amount * 2, BankChangeType.DUELFLIP);
			} else {
				embed.addField('Winner', `<@${challenge.challengedBy}>`, true);
				bank.addToUser(challenge.challengedBy, challenge.amount * 2, BankChangeType.DUELFLIP);
			}
		}

		embed.addField('Amount', challenge.amount.toLocaleString());
		channel.send(embed);
	}

	private challengeExists(aUser: string, bUser: string): boolean {
		const challenge: DuelFlipChallenge = this.challenges.find(
			(x) => x.challengedBy === aUser && x.otherUser === bUser,
		);

		return isNil(challenge);
	}

	private removeChallenge(aUser: string, bUser: string) {
		const index: number = this.challenges.findIndex((x) => aUser === x.challengedBy && bUser === x.otherUser);

		if (index !== -1) {
			this.challenges.splice(index, 1);
		}
	}

	private removeTrash() {
		const toRemove: DuelFlipChallenge[] = [];

		for (const challenge of this.challenges) {
			const diff: number = new Date().getTime() - challenge.time.getTime();

			if (diff > this.CHALLENGE_LIFETIME) {
				toRemove.push(challenge);
			}
		}

		for (const challenge of toRemove) {
			const index: number = this.challenges.findIndex((x) => challenge.id === x.id);
			if (index !== -1) {
				this.challenges.splice(index, 1);
			}
		}
	}
}

export default Duelflip;
