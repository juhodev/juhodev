import { youtubePlayer } from '..';
import { Command } from './types';

const SkipCommand: Command = {
	execute: (channel, author, args, db) => {
		youtubePlayer.skip(channel);
	},
	alias: ['!skip'],
};

export default SkipCommand;
