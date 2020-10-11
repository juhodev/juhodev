import { DMChannel, NewsChannel, TextChannel } from 'discord.js';
import DB from '../database/db';

export type Command = {
	execute: (
		channel: TextChannel | DMChannel | NewsChannel,
		args: string[],
		db: DB,
	) => void;
	alias: string[];
};
