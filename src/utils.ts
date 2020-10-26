import fetch from 'node-fetch';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { DB_DATA_DIR } from './database/types';
import { DBImage } from './db/types';
import { knex } from './db/utils';

const streamPipeline = util.promisify(require('stream').pipeline);

export function msToTime(ms: number) {
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);

	return `${hours} hours ${minutes} minutes`;
}

export async function downloadImage(dbImage: DBImage): Promise<boolean> {
	const imgDir: string = path.resolve(DB_DATA_DIR, 'imgs');
	const response = await fetch(dbImage.original_link, {
		size: 1024 * 1024 * 20,
	});
	if (response.ok) {
		await streamPipeline(
			response.body,
			fs.createWriteStream(`${imgDir}/${dbImage.name}`),
		);

		await knex<DBImage>('images').insert(dbImage);

		return true;
	} else {
		return false;
	}
}
