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
	if(args.length === 0) {
		await blackjack.sendInitial(channel);
	}
}

export default BlackjackCommand;
