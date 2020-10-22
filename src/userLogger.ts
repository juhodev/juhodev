import { User } from 'discord.js';
import DB from './database/db';
import { DBUser } from './db/types';
import { knex } from './db/utils';

export const logUsers = async (db: DB) => {
	for (const [_, member] of db.getGuild().members.cache) {
		const { user } = member;

		const userCreated: boolean = await hasUser(user);
		if (userCreated) {
			continue;
		}

		await knex<DBUser>('users').insert({
			snowflake: user.id,
			avatar: user.avatar,
			discord_created: user.createdAt.getTime(),
			discord_name_uppercase: user.username.toUpperCase(),
			discord_name_original: user.username,
			discord_tag: user.discriminator,
			first_seen: new Date().getTime(),
		});
	}
};

async function hasUser(user: User): Promise<boolean> {
	const result = await knex<DBUser>('users').where({ snowflake: user.id });

	if (result.length === 0) {
		return false;
	}

	return true;
}
