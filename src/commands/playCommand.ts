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
			case 'list':
				player.printQueue(channel);
				return;

			case 'current':
				player.sendCurrentlyPlaying(channel);
				return;

			case 'next':
				player.sendNextVideo(channel);
				return;
		}

		const userStart: string = args.shift();
		const userEnd: string = args.shift();

		player.add('https://www.youtube.com/watch?v=dQw4w9WgXcQ', author, channel, db, userStart, userEnd);
	},
	alias: ['!play'],
};

export default PlayCommand;
