import Blackjack from '../blackjack/blackjack';
import { Command } from './types';

const blackjack: Blackjack = new Blackjack();

const BlackjackCommand: Command = {
	execute: (channel, author, args, db) => {
		const action: string = args.shift();
		switch (action) {
			case 'start':
				blackjack.start();
				blackjack.sendPlayers(channel);
				break;

			case 'join':
				blackjack.join(author.id);
				break;

			case 'hit':
				blackjack.dealToPlayer(author.id);
				blackjack.sendPlayers(channel);
				break;
		}
	},
	alias: ['!blackjack'],
};

export default BlackjackCommand;
