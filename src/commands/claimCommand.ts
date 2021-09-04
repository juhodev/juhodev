import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import { bank } from '..';
import { BankChangeType } from '../bank/types';
import { DBClaim } from '../db/types';
import { knex } from '../db/utils';
import { Command } from './types';

const ClaimCommand: Command = {
	execute: (channel, author, args, db) => {
		claim(channel, author);
	},
	alias: ['!claim'],
};

async function claim(channel: TextChannel | NewsChannel | DMChannel, author: User) {
	const lastClaim: DBClaim[] = await knex<DBClaim>('claims').where({ snowflake: author.id });

	if (lastClaim.length === 0) {
		await knex<DBClaim>('claims').insert({ snowflake: author.id, last_claim: new Date().getTime() });
		bank.addToUser(author.id, 300, BankChangeType.CLAIM);
		channel.send('300 claimed!');
		return;
	}

	const now: Date = new Date();
	const lastClaimDate: Date = new Date(lastClaim.shift().last_claim);
	const firstMinuteOfCurrentDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), -2, 0, 0);

	if (lastClaimDate <= firstMinuteOfCurrentDate) {
		await knex<DBClaim>('claims').update({ last_claim: new Date().getTime() }).where({ snowflake: author.id });
		bank.addToUser(author.id, 300, BankChangeType.CLAIM);
		channel.send('300 claimed!');
	} else {
		channel.send('You have already used !claim today');
	}
}

export default ClaimCommand;
