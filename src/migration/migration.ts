import * as fs from 'fs';
import * as path from 'path';
import { DB_DATA_DIR } from '../database/types';
import {
	DBBaavo,
	DBClip,
	DBCommandLog,
	DBImage,
	DBQuote,
	DBRandomString,
	DBVoiceLog,
} from '../db/types';
import { knex } from '../db/utils';

export default async function migrate() {
	await migrateClips();
	await migrateQuotes();
	await migrateMetrics();
	await migrateGeneratedStrings();
	await migrateBaavoImages();
	await migateImages();
}

async function migrateClips() {
	const file: string = path.resolve(DB_DATA_DIR, 'clips.json');
	const fileStr: string = fs.readFileSync(file, 'utf-8');
	const json: any = JSON.parse(fileStr);

	for (const o of json) {
		const { name, length, originalVideoLink, path, views } = o;

		const dbClip: DBClip = {
			clip_length: length,
			clip_start: 0,
			deleted: false,
			original_link: originalVideoLink,
			submission_by: '',
			submission_date: 0,
			name,
			path,
			views,
		};

		try {
			await knex<DBClip>('clips').insert(dbClip);
		} catch (e) {
			console.error(e);
		}
	}
	console.log('clips migrated');
}

async function migrateQuotes() {
	const file: string = path.resolve(DB_DATA_DIR, 'quotes.json');
	const fileStr: string = fs.readFileSync(file, 'utf-8');
	const json: any = JSON.parse(fileStr);

	for (const o of json) {
		const { title, content } = o;

		try {
			await knex<DBQuote>('quotes').insert({
				name: title,
				submission_date: 0,
				submission_by: '',
				views: 0,
				content,
			});
		} catch (e) {
			console.error(e);
		}
	}

	console.log('quotes migrated');
}

async function migrateMetrics() {
	const file: string = path.resolve(DB_DATA_DIR, 'metrics.json');
	const fileStr: string = fs.readFileSync(file, 'utf-8');
	const json: any = JSON.parse(fileStr);

	const { voiceChannelMetrics, commandMetrics } = json;
	const { users } = voiceChannelMetrics;
	for (const u of users) {
		const { channels, id, name } = u;
		for (const c of channels) {
			const { id, name: channelName, time } = c;

			const voiceLog: DBVoiceLog = {
				channel: channelName,
				snowflake: id,
				combined: `${id}-${channelName}`,
				time: time,
			};

			try {
				await knex<DBVoiceLog>('voice_log').insert(voiceLog);
			} catch (e) {
				console.error(e);
			}
		}
	}

	const { users: cmdUsers } = commandMetrics;
	for (const u of cmdUsers) {
		const { user, commands } = u;
		const { id, name } = user;
		for (const cmd of commands) {
			const { args, command, channel, date } = cmd;
			const { name } = channel;

			try {
				await knex<DBCommandLog>('command_log').insert({
					channel: name,
					snowflake: id,
					time: date,
					args,
					command,
				});
			} catch (e) {
				console.error(e);
			}
		}
	}

	console.log('metrics migrated');
}

async function migrateGeneratedStrings() {
	const file: string = path.resolve(DB_DATA_DIR, 'generatedStrings.json');
	const fileStr: string = fs.readFileSync(file, 'utf-8');
	const json: any = JSON.parse(fileStr);

	for (const str of json) {
		try {
			await knex<DBRandomString>('random_strings').insert({
				rand_string: str,
			});
		} catch (e) {
			console.error(e);
		}
	}

	console.log('random string migrated');
}

async function migrateBaavoImages() {
	const file: string = path.resolve(DB_DATA_DIR, 'baavo');
	const files: string[] = fs.readdirSync(file);

	for (const f of files) {
		const baavo: DBBaavo = {
			name: f,
			submission_by: '140233862235160577',
			submission_date: 0,
			views: 0,
		};

		try {
			await knex<DBBaavo>('baavo_imgs').insert(baavo);
		} catch (e) {
			console.error(e);
		}
	}

	console.log('baavo imgs migrated');
}

async function migateImages() {
	const file: string = path.resolve(DB_DATA_DIR, 'imgs');
	const files: string[] = fs.readdirSync(file);

	for (const f of files) {
		const img: DBImage = {
			name: f,
			submission_by: '140233862235160577',
			submission_date: 0,
			views: 0,
			deleted: false,
			original_link: '',
		};

		try {
			await knex<DBImage>('images').insert(img);
		} catch (e) {
			console.error(e);
		}
	}

	console.log('imgs migrated');
}
