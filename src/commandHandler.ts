import {
	DMChannel,
	GuildMember,
	Message,
	NewsChannel,
	TextChannel,
	User,
} from 'discord.js';
import { Command } from './commands/types';
import DB from './database/db';
import { DBCommandLog } from './db/types';
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

		if (author.bot) {
			return;
		}

		if (!content.startsWith('!')) {
			return;
		}

		const args = content.split(' ');
		const command = args.shift();

		console.log(`${author.username}: ${command} ${JSON.stringify(args)}`);

		if (!this.commands.has(command)) {
			channel.send(`${command} is not a command!`);
			return;
		}

		const realCommand = this.commands.get(command);
		realCommand.execute(channel, args, this.db);

		this.logCommand(channel, command, args, author);
	}

	registerCommand(command: Command) {
		for (const alias of command.alias) {
			this.commands.set(alias, command);
		}
	}

	private async logCommand(
		channel: TextChannel | DMChannel | NewsChannel,
		command: string,
		args: string[],
		author: User,
	) {
		const channelName: string =
			channel instanceof DMChannel ? 'DM' : channel.name;

		await knex<DBCommandLog>('command_log').insert({
			snowflake: author.id,
			args: JSON.stringify(args),
			time: new Date().getTime(),
			channel: channelName,
			command,
		});
	}
}

export default CommandHandler;
