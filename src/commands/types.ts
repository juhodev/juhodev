import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import DB from '../database/db';

export type Command = {
	execute: (
		channel: TextChannel | DMChannel | NewsChannel,
		author: User,
		args: string[],
		db: DB,
	) => void;
	alias: string[];
};
