import { youtubePlayer } from '..';
import { isNil } from '../utils';
import { Command } from './types';
import { embed } from '../youtubePlayer/youtubeEmbed';

const PlayCommand: Command = {
	execute: (channel, author, args, db) => {
		const arg: string = args.shift();

		if (isNil(arg)) {
			channel.send('!play <url>');
			return;
		}

		switch (arg.toLowerCase()) {
			case 'queue':
			case 'q':
			case 'list':
				youtubePlayer.printQueue(channel);
				return;

			case 'current':
				youtubePlayer.sendCurrentlyPlaying(channel);
				return;

			case 'next':
				youtubePlayer.sendNextVideo(channel);
				return;

			case 'skip':
				youtubePlayer.skip(channel);
				return;

			case 'random':
				const nextArg: string = args.shift();
				if (!isNil(nextArg)) {
					const count: number = parseInt(nextArg);
					youtubePlayer.playRandom(channel, author, count);
					return;
				}

				youtubePlayer.playRandom(channel, author, 1);
				return;

			case 'test':
				embed.write(channel);
				break;
		}

		let query: string = arg;
		for (const otherArgs of args) {
			query += ` ${otherArgs}`;
		}

		youtubePlayer.add(query, author, channel, db, false);
	},
	alias: ['!play'],
};

export default PlayCommand;
