import { Command } from './types';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as util from 'util';
import { uuid } from 'uuidv4';
import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import RandomString from '../randomString';
import { addView, saveBaavo } from '../database/baavoDB';

const streamPipeline = util.promisify(require('stream').pipeline);

const random: RandomString = new RandomString();

const BaavoCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			sendRandomBaavo(channel);
			return;
		}

		const action = args.shift().toUpperCase();

		switch (action) {
			case 'ADD':
				addBaavo(channel, author, args);
				break;

			case 'REMOVE':
				removeBaavo(channel, args);
				break;

			default:
				channel.send('!baavo add <url>');
				break;
		}
	},
	alias: ['!baavo'],
};

async function addBaavo(
	channel: TextChannel | DMChannel | NewsChannel,
	author: User,
	args: string[],
) {
	if (args.length === 0) {
		channel.send('!baavo add <url>');
		return;
	}

	if (!fs.existsSync('data/baavo')) {
		fs.mkdirSync('data/baavo');
	}

	try {
		const url = args.shift();
		const response = await fetch(url);

		if (response.ok) {
			const name: string = `BAAVO-${uuid()}.png`;
			await streamPipeline(
				response.body,
				fs.createWriteStream(`data/baavo/${name}`),
			);

			channel.send('Baavo added');
			await saveBaavo(name, author);
		} else {
			channel.send('url not ok');
		}
	} catch (e) {
		console.error(e);
	}
}

function removeBaavo(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
) {
	const fileName: string = args.shift();
	const pathToFile = path.resolve(`data/baavo/${fileName}`);

	if (!fs.existsSync(pathToFile)) {
		channel.send(`File ${fileName} not found`);
		return;
	}

	fs.unlinkSync(pathToFile);
	channel.send(`${fileName} removed`);
}

async function sendRandomBaavo(channel: TextChannel | DMChannel | NewsChannel) {
	const baavoFiles: string[] = fs.readdirSync('data/baavo');
	const randomBaavo: string = random.pseudoRandom(baavoFiles);

	channel.send({
		files: [
			{
				attachment: path.resolve(`data/baavo/${randomBaavo}`),
				name: randomBaavo,
			},
		],
	});

	await addView(randomBaavo);
}

export default BaavoCommand;
