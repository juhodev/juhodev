import { reddit } from '..';
import { isNil } from '../utils';
import { Command } from './types';

const RegisterSpamCommand: Command = {
	execute: async (channel, author, args, db) => {
		if (args.length === 0) {
			await channel.send('no');
			return;
		}

		const first = args.shift();
		if (first === 'register') {
			reddit.registerChannel(channel.id);
			await channel.send('Registered');
			return;
		}

		if (first === 'add') {
			const name = args.join(' ');
			if (isNil(name)) {
				await channel.send('!deathpool add <name>');
				return;
			}

			await reddit.addInterestingPerson(name);
			await channel.send(`${name} added`);
			return;
		}

		if (first === 'subreddit') {
			const name = args.shift();

			if (isNil(name)) {
				await channel.send('!deathpool add <subreddit>\nE.g. /r/worldnews');
				return;
			}

			if (!name.startsWith('/')) {
				await channel.send('!deathpool add <subreddit>\nE.g. /r/worldnews');
				return;
			}

			await reddit.addSubreddit(name);
			await channel.send('Subreddit added');
			return;
		}

		await channel.send(`${first} is not a valid argument`);
	},
	alias: ['!deathpool', '!deadpool'],
};

export default RegisterSpamCommand;
