import { getUserDataWithSnowflake } from '../api/user';
import { DBCommandLog } from '../db/types';
import { knex } from '../db/utils';
import { isNil } from '../utils';
import { CommandCount } from './types';

export async function getDiscordCommands(): Promise<string[]> {
	return (await knex<DBCommandLog>('command_log').where({}).distinct('command')).map((command) => command.command);
}

export async function getCommandLeaderboard(command: string): Promise<CommandCount[]> {
	const commands: DBCommandLog[] = await knex<DBCommandLog>('command_log').where({ command });
	const userCommands: CommandCount[] = [];

	for (const command of commands) {
		let count: CommandCount = userCommands.find((x) => x.user.snowflake === command.snowflake);
		if (isNil(count)) {
			count = {
				count: 0,
				user: await getUserDataWithSnowflake(command.snowflake),
			};

			userCommands.push(count);
		}

		count.count++;
	}

	return userCommands;
}
