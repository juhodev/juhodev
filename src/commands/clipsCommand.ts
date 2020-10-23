import {
	DMChannel,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	User,
} from 'discord.js';
import { Clip } from '../clips/types';
import DB from '../database/db';
import { Command } from './types';

const ClipsCommand: Command = {
	execute: (channel, author, args, db) => {
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
				addClip(channel, author, args, db);
				break;

			case 'VIEW':
				viewClip(channel, args, db);
				break;
		}
	},
	alias: ['!clips'],
};

async function sendClipList(
	channel: TextChannel | DMChannel | NewsChannel,
	db: DB,
) {
	const clips: Clip[] = await db.getClipsDB().getClips();
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
	author: User,
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
	const superLowQualityOption: string = args.shift();

	let hasLowQualityOptionSet: boolean = false;

	if (
		superLowQualityOption !== undefined &&
		superLowQualityOption.toUpperCase() === 'LQ'
	) {
		hasLowQualityOptionSet = true;
	}

	if (
		superLowQualityOption === undefined &&
		name !== undefined &&
		name.toUpperCase() === 'LQ'
	) {
		hasLowQualityOptionSet = true;
	}

	db.getClips().createClip(
		channel,
		author,
		url,
		start,
		length,
		name,
		hasLowQualityOptionSet,
	);
}

async function viewClip(
	channel: TextChannel | DMChannel | NewsChannel,
	args: string[],
	db: DB,
) {
	const clipName: string = args.shift();

	if (clipName === undefined) {
		channel.send('!clips view <name>');
		return;
	}

	const clip: Clip = await db.getClipsDB().getClip(clipName);
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
