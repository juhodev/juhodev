import { Message } from 'discord.js';
import { Command } from './commands/types';
import DB from './database/db';

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
	}

	registerCommand(command: Command) {
		for (const alias of command.alias) {
			this.commands.set(alias, command);
		}
	}
}

export default CommandHandler;
