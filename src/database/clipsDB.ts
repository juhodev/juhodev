import { Clip } from '../clips/types';
import { knex } from '../db/utils';
import { DBClip } from '../db/types';
import { User } from 'discord.js';

class ClipsDB {
	async save(clip: Clip, user: User) {
		await knex<DBClip>('clips').insert({
			name: clip.name,
			path: clip.path,
			original_link: clip.originalVideoLink,
			views: clip.views,
			submission_by: user.id,
			submission_date: new Date().getTime(),
			clip_length: clip.length,
			clip_start: clip.start,
			deleted: false,
		});
	}

	async addView(clipName: string) {
		const clips: DBClip[] = await knex<DBClip>('clips').where({
			name: clipName,
		});

		if (clips.length !== 1) {
			return;
		}

		await knex<DBClip>('clips')
			.increment('views')
			.where({ name: clipName });
	}

	async getClips(): Promise<Clip[]> {
		const dbClips: DBClip[] = await knex<DBClip>('clips').whereNot({
			deleted: false,
		});

		const clips: Clip[] = dbClips.map(
			(dbClip): Clip => {
				return {
					name: dbClip.name,
					length: dbClip.clip_length,
					originalVideoLink: dbClip.original_link,
					path: dbClip.path,
					start: dbClip.clip_start,
					views: dbClip.views,
				};
			},
		);

		return clips;
	}

	async getClip(name: string): Promise<Clip> {
		const clips: DBClip[] = await knex<DBClip>('clips').where({ name });

		if (clips.length !== 1) {
			return undefined;
		}

		await knex<DBClip>('clips').increment('views').where({ name });

		const dbClip: DBClip = clips.shift();
		return {
			name: dbClip.name,
			length: dbClip.clip_length,
			originalVideoLink: dbClip.original_link,
			path: dbClip.path,
			start: dbClip.clip_start,
			views: dbClip.views,
		};
	}

	async hasClip(name: string): Promise<boolean> {
		const clips: DBClip[] = await knex<DBClip>('clips').where({ name });

		return clips.length === 1;
	}
}

export default ClipsDB;
