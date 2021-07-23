import { blackjack } from '..';
import { Command } from './types';

const BlackjackCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			channel.send('!blackjack <bet>');
			return;
		}

		blackjack.join(channel, author, args);
	},
	alias: ['!blackjack'],
};

export default BlackjackCommand;
