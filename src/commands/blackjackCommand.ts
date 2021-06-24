import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import { blackjack } from '..';
import Blackjack from '../blackjack/blackjack';
import { Command } from './types';

const BlackjackCommand: Command = {
	execute: (channel, author, args, db) => {
		handleCommand(channel, author, args);
	},
	alias: ['!blackjack'],
};

async function handleCommand(channel: DMChannel | NewsChannel | TextChannel, author: User, args: string[]) {
	const action: string = args.shift();
	switch (action) {
		case 'start':
			await blackjack.sendInitial(channel);
			break;
	}
}

export default BlackjackCommand;
