import { isNil } from '../utils';
import YoutubePlayer from '../youtubePlayer/youtubePlayer';
import { Command } from './types';

const player: YoutubePlayer = new YoutubePlayer();

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
				player.printQueue(channel);
				return;

			case 'current':
				player.sendCurrentlyPlaying(channel);
				return;

			case 'next':
				player.sendNextVideo(channel);
				return;

			case 'skip':
				player.skip(channel);
				return;
		}

		let query: string = arg;
		for (const otherArgs of args) {
			query += ` ${otherArgs}`;
		}

		player.add(query, author, channel, db);
	},
	alias: ['!play'],
};

export default PlayCommand;
