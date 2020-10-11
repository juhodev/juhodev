import Giphy from '../giphy/giphy';
import { Command } from './types';

const giphy = new Giphy();

const GifCommand: Command = {
	execute: (channel, args, db) => {
		if (args.length === 0) {
			return;
		}

		const searchTerm: string = args.shift();
		giphy.search(searchTerm).then((response) => {
			channel.send(response);
		});
	},
	alias: ['!gif'],
};

export default GifCommand;
