import fetch from 'node-fetch';
import { DBDiscordData, DBDiscordToken } from '../db/types';
import { knex } from '../db/utils';
import { JWTDiscordAuth } from './routes/auth/types';

const fetchUserIdentity = async (
	authenticatedJwt: JWTDiscordAuth,
): Promise<DBDiscordData> => {
	const url: string = 'https://discord.com/api/v6/users/@me';

	const discordData: DBDiscordData = await knex<DBDiscordData>('discord_data')
		.where({ uuid: authenticatedJwt.uuid })
		.first();

	if (discordData !== undefined) {
		return discordData;
	}

	const user: DBDiscordToken = await knex<DBDiscordToken>('discord_tokens')
		.where({
			uuid: authenticatedJwt.uuid,
		})
		.first();

	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${user.access_token}`,
		},
	});

	const json = await response.json();
	const newDiscordData: DBDiscordData = {
		uuid: authenticatedJwt.uuid,
		avatar: json['avatar'],
		discriminator: json['discriminator'],
		snowflake: json['id'],
		username: json['username'],
	};

	await knex<DBDiscordData>('discord_data').insert(newDiscordData);
	return newDiscordData;
};

export { fetchUserIdentity };
