import { youtubePlayer } from '..';
import { Command } from './types';

const PlaylistsCommand: Command = {
	execute: (channel, author, args, db) => {
		youtubePlayer.sendPlaylists(channel);
	},
	alias: ['!playlists'],
};

export default PlaylistsCommand;
