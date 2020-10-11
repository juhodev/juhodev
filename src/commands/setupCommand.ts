import { DMChannel, NewsChannel } from 'discord.js';
import { Command } from './types';

const SetupCommand: Command = {
	execute: (channel, args, db) => {
		if (channel instanceof DMChannel || channel instanceof NewsChannel) {
			channel.send(`The bot can't be setup here`);
			return;
		}

		db.setup(channel);
	},
	alias: ['!setup'],
};

export default SetupCommand;
