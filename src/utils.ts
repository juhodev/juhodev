import fetch from 'node-fetch';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { DB_DATA_DIR } from './database/types';
import { DBImage } from './db/types';
import { knex } from './db/utils';
import { uuid } from 'uuidv4';
import { siteMetrics } from '.';

const streamPipeline = util.promisify(require('stream').pipeline);

/**
 * Logs a 1 in siteMetrics with the given `name`.
 *
 * A 0 is a cache miss and a 1 is a cache hit.
 *
 * @param name Name of the function where the cache hit happened
 */
export function logCacheHit(name: string) {
	siteMetrics.log(name, 1);
}

/**
 * Logs a 0 in siteMetrics with the given `name`.
 *
 * A 0 is a cache miss and a 1 is a cache hit.
 *
 * @param name Name of the function where the cache miss happened
 */
export function logCacheMiss(name: string) {
	siteMetrics.log(name, 0);
}

export function msToTime(ms: number) {
	const hours = Math.floor(ms / (1000 * 60 * 60));
	const minutes = Math.floor((ms / (1000 * 60)) % 60);

	return `${hours} hours ${minutes} minutes`;
}

export async function downloadImage(dbImage: DBImage): Promise<boolean> {
	const imgDir: string = path.resolve(DB_DATA_DIR, 'imgs');
	const response = await fetch(dbImage.original_link, {
		size: 1024 * 1024 * 20,
	});
	if (response.ok) {
		await streamPipeline(response.body, fs.createWriteStream(`${imgDir}/${dbImage.name}`));

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

// https://stackoverflow.com/a/1349426
export function makeId(length: number): string {
	let result: string = '';
	const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export function getAllDatesBetweenTwoDates(firstDate: Date, lastDate: Date): Date[] {
	const array: Date[] = [];
	const dayInMilliseconds: number = 1000 * 60 * 60 * 24;

	let currentDate: Date = firstDate;
	// 86400000 is one day in milliseconds. Added this to make sure that all dates are created
	while (currentDate.getTime() < lastDate.getTime() + 86400000) {
		const newDate: Date = new Date(0);
		newDate.setFullYear(currentDate.getFullYear());
		newDate.setMonth(currentDate.getMonth());
		newDate.setDate(currentDate.getDate());
		array.push(newDate);

		currentDate = new Date(currentDate.getTime() + dayInMilliseconds);
	}

	return array;
}
