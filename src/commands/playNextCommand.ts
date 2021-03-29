import { youtubePlayer } from '..';
import { isNil } from '../utils';
import { Command } from './types';

const PlayNextCommand: Command = {
	execute: (channel, author, args, db) => {
		const arg: string = args.shift();

		if (isNil(arg)) {
			channel.send('!playnext <url>');
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
		}

		let query: string = arg;
		for (const otherArgs of args) {
			query += ` ${otherArgs}`;
		}

		youtubePlayer.add(query, author, channel, db, true);
	},
	alias: ['!playnext'],
};

export default PlayNextCommand;
