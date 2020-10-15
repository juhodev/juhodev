import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import Clips from '../clips/clips';
import { Clip } from '../clips/types';
import DB from '../database/db';
import { Command } from './types';

const ClipsCommand: Command = {
	execute: (channel, args, db) => {
		if (args.length === 0) {
			db.getClips().sendRandomClip(channel);
			return;
		}

		const action = args.shift().toUpperCase();

		switch (action) {
			case 'LIST':
				sendClipList(channel, db);
				break;

			case 'ADD':
				addClip(channel, args, db);
				break;

			case 'VIEW':
				viewClip(channel, args, db);
				break;
		}
	},
	alias: ['!clips'],
};

function sendClipList(channel: TextChannel | DMChannel | NewsChannel, db: DB) {
	const clips: Clip[] = db.getClipsDB().getClips();
	let message: string = '';

	if (clips.length === 0) {
		channel.send(
			new MessageEmbed({ title: 'Clips' }).addField(
				'List',
				'No clips found',
			),
		);

		return;
	}

	let bold: boolean = false;
	for (const clip of clips) {
		if (bold) {
			message += `**${clip.name}**, `;
		} else {
			message += `${clip.name}, `;
		}

		bold = !bold;
	}

	message = message.substr(0, message.length - 2);

	const embed: MessageEmbed = new MessageEmbed({
		title: 'Clips',
	}).addField('List', message);

	channel.send(embed);
}

function addClip(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const url: string = args.shift();
	if (url === undefined) {
		channel.send('!clips add <url> <start> <length>');
		return;
	}

	const start: string = args.shift();
	if (start === undefined) {
		channel.send('!clips add <url> <start> <length>');
		return;
	}

	const length: string = args.shift();
	if (length === undefined) {
		channel.send('!clips add <url> <start> <length>');
		return;
	}

	const name: string = args.shift();
	db.getClips().createClip(channel, url, start, length, name);
}

function viewClip(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const clipName: string = args.shift();

	if (clipName === undefined) {
		channel.send('!clips view <name>');
		return;
	}

	const clip: Clip = db.getClipsDB().getClip(clipName);
	if (clip === undefined) {
		channel.send(`Clip ${clipName} not found!`);
		return;
	}

	channel.send({
		files: [
			{
				attachment: clip.path,
				nane: clip.name,
			},
		],
	});
}

export default ClipsCommand;
