import { User } from 'discord.js';
import { DBBaavo } from '../db/types';
import { knex } from '../db/utils';

export async function saveBaavo(name: string, user: User) {
	await knex<DBBaavo>('baavo_imgs').insert({
		name,
		submission_by: user.id,
		submission_date: new Date().getTime(),
		views: 0,
	});
}

export async function addView(name: string) {
	await knex<DBBaavo>('baavo_imgs').increment('views');
}
