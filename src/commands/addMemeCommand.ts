import { Command } from './types';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import fetch from 'node-fetch';
import { DMChannel, NewsChannel, TextChannel } from 'discord.js';

const streamPipeline = util.promisify(require('stream').pipeline);

const AddMemeCommand: Command = {
	execute: (channel, author, args, db) => {
		addTemplate(args, channel);
	},
	alias: ['!addtemplate'],
};

async function addTemplate(args: string[], channel: DMChannel | TextChannel | NewsChannel) {
	const link: string = args.shift();
	const name: string = args.shift();
	const fontSize: number = parseInt(args.shift());
	const color: string = args.shift();
	const textPositionString: string = args.join(',');

	const textSourceFile: string = path.resolve('meme_source', 'text_source.csv');
	fs.appendFileSync(textSourceFile, `${name},${fontSize},${color},${textPositionString}\n`);

	const worked: boolean = await downloadImage(name, link);
	if (worked) {
		channel.send('Meme template added');
	} else {
		channel.send('didnt fucking work');
	}
}

async function downloadImage(name: string, link: string): Promise<boolean> {
	const imgDir: string = path.resolve('meme_source');
	const response = await fetch(link, {
		size: 1024 * 1024 * 20,
	});
	if (response.ok) {
		await streamPipeline(response.body, fs.createWriteStream(`${imgDir}/${name}.png`));

		return true;
	} else {
		return false;
	}
}

export default AddMemeCommand;
