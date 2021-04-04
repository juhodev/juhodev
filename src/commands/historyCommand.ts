import { youtubePlayer } from '..';
import { Command } from './types';

const HistoryCommand: Command = {
	execute: (channel, author, args, db) => {
		youtubePlayer.sendHistory(channel);
	},
	alias: ['!history', '!ythistory', '!mostplayed'],
};

export default HistoryCommand;
