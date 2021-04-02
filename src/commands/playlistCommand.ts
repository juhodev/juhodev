import { youtubePlayer } from '..';
import { isNil } from '../utils';
import { Command } from './types';

const PlaylistCommand: Command = {
	execute: (channel, author, args, db) => {
		const arg: string = args.shift();

		if (isNil(arg)) {
			channel.send('!playlist <create|view|play|remove> <name>');
			return;
		}

		const playlist: string = args.shift();
		if (isNil(playlist)) {
			channel.send('!playlist <create|view|play|remove> <name>');
			return;
		}

		switch (arg.toLowerCase()) {
			case 'create':
				youtubePlayer.createPlaylist(channel, author, playlist);
				break;

			case 'view':
				youtubePlayer.sendPlaylist(channel, playlist);
				break;

			case 'play':
				youtubePlayer.playPlaylist(channel, playlist, author);
				break;

			case 'add':
				let query: string = '';
				for (const otherArgs of args) {
					query += ` ${otherArgs}`;
				}
				youtubePlayer.addMusicToPlaylist(channel, author, playlist, query);
				break;

			case 'remove':
				const link: string = args.shift();
				if (isNil(link)) {
					channel.send('!playlist remove <playlist> <link>');
					return;
				}
				youtubePlayer.removeSongFromPlaylist(channel, playlist, link);
				break;

			default:
				channel.send('!playlist <create|view|play|remove> <name>');
				break;
		}
	},
	alias: ['!playlist'],
};

export default PlaylistCommand;
