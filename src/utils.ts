import fetch from 'node-fetch';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { DB_DATA_DIR } from './database/types';
import { DBImage } from './db/types';
import { knex } from './db/utils';
import { uuid } from 'uuidv4';

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

export async function downloadTxt(url: string): Promise<string> {
	const dir: string = path.resolve(DB_DATA_DIR, 'downloads');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	const response = await fetch(url, { size: 1024 * 1024 * 20 });
	if (response.ok) {
		const fileName = `download-${uuid()}.txt`;
		const file = path.resolve(dir, fileName);
		await streamPipeline(response.body, fs.createWriteStream(file));

		return file;
	} else {
		return undefined;
	}
}
