import { DMChannel, NewsChannel, TextChannel } from 'discord.js';
import { generateMeme } from '../memes/memeGenerator';
import { Command } from './types';

const MemeGeneratorCommand: Command = {
	execute: (channel, author, args, db) => {
		sendMeme(args, channel);
	},
	alias: ['!gen'],
};

async function sendMeme(args: string[], channel: TextChannel | DMChannel | NewsChannel) {
	if (args.length < 2) {
		channel.send('!gen <source> <text>');
		return;
	}

	const source: string = args.shift();
	const text: string = args.join(' ');

	const memePath: string = await generateMeme(source, text);
	console.log('path', memePath);
	channel.send({
		files: [
			{
				attachment: memePath,
				name: 'Meme.png',
			},
		],
	});
}

export default MemeGeneratorCommand;
