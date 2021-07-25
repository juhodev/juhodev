import { duelflip } from '..';
import { Command } from './types';

const Dueflip: Command = {
	execute: (channel, author, args, db) => {
		const aSide: string = 'a';
		const bSide: string = 'b';

		if (args.length === 0) {
			channel.send(`!duelflip <user#id> <amount> <side>\nSides: ${aSide}, ${bSide}`);
			return;
		}

		if (args[0].toLowerCase() === 'accept') {
			duelflip.accept(channel, author, args);
		} else {
			duelflip.challenge(channel, author, args);
		}
	},
	alias: ['!duelflip', '!duelcoinflip', '!coinflipduel'],
};

export default Dueflip;
