import { DMChannel, Message, NewsChannel, TextChannel, User } from 'discord.js';
import { Command } from './commands/types';
import DB from './database/db';
import { DBCommandLog, DBUser } from './db/types';
import { knex } from './db/utils';

class CommandHandler {
	private commands: Map<string, Command>;
	private db: DB;

	constructor(db: DB) {
		this.commands = new Map();
		this.db = db;
	}

	handle(message: Message) {
		const { content, channel, author } = message;
		this.logUser(author);

		if (author.bot) {
			return;
		}

		if (!content.startsWith('!')) {
			return;
		}

		const args = content.split(' ');
		const command = args.shift();

		if (command === '!poll') {
			return;
		}

		console.log(`${author.username}: ${command} ${JSON.stringify(args)}`);

		if (!this.commands.has(command)) {
			channel.send(`${command} is not a command!`);
			return;
		}

		// Too lazy to code this in the right way
		if (command === '!play') {
			message.delete();
		}

		this.logCommand(channel, command, args, author);

		const realCommand = this.commands.get(command);
		realCommand.execute(channel, author, args, this.db);
	}

	registerCommand(command: Command) {
		for (const alias of command.alias) {
			this.commands.set(alias, command);
		}
	}

	private async logUser(user: User) {
		const userCreated: boolean = await this.hasUser(user);

		if (!userCreated) {
			await knex<DBUser>('users').insert({
				snowflake: user.id,
				avatar: user.avatar,
				discord_created: user.createdAt.getTime(),
				discord_name_uppercase: user.username.toUpperCase(),
				discord_name_original: user.username,
				discord_tag: user.discriminator,
				first_seen: new Date().getTime(),
			});
		} else {
			await knex<DBUser>('users')
				.update({
					avatar: user.avatar,
					discord_tag: user.discriminator,
					discord_name_uppercase: user.username.toUpperCase(),
					discord_name_original: user.username,
				})
				.where({ snowflake: user.id });
		}
	}

	private async logCommand(
		channel: TextChannel | DMChannel | NewsChannel,
		command: string,
		args: string[],
		author: User,
	) {
		const channelName: string = channel instanceof DMChannel ? 'DM' : channel.name;

		await knex<DBCommandLog>('command_log').insert({
			snowflake: author.id,
			args: JSON.stringify(args),
			time: new Date().getTime(),
			channel: channelName,
			command,
		});
	}

	private async hasUser(user: User): Promise<boolean> {
		const result = await knex<DBUser>('users').where({
			snowflake: user.id,
		});

		if (result.length === 0) {
			return false;
		}

		return true;
	}
}

export default CommandHandler;
