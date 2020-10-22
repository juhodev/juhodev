import { DMChannel, NewsChannel, TextChannel, User } from 'discord.js';
import * as fs from 'fs';
import { DB_DATA_DIR, Image, IMG_DIR } from './types';
import fetch from 'node-fetch';
import * as util from 'util';
import { uuid } from 'uuidv4';
import RandomString from '../randomString';
import * as path from 'path';
import { knex } from '../db/utils';
import { DBImage } from '../db/types';

const streamPipeline = util.promisify(require('stream').pipeline);

class ImgDB {
	private random: RandomString;
	constructor() {
		this.random = new RandomString();
	}

	async removeImage(
		channel: TextChannel | DMChannel | NewsChannel,
		name: string,
	) {
		if (!this.hasImage(name)) {
			channel.send(`Image with the name "${name}" not found`);
			return;
		}

		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		const pathToImage: string = path.resolve(imgDir, name);

		fs.unlinkSync(pathToImage);

		await knex<DBImage>('images').update({ deleted: true }).where({ name });
		channel.send('Image removed');
	}

	async hasImage(name: string): Promise<boolean> {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		const result: DBImage[] = await knex<DBImage>('images').where({ name });
		return result.length > 0;
	}

	async getRandomImage(): Promise<Image> {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		const images: string[] = this.getImages();
		const randomImage = this.random.pseudoRandom(images);

		return await this.getImage(randomImage);
	}

	async getImage(name: string): Promise<Image> {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		await knex<DBImage>('images').increment('views').where({ name });
		return { path: path.resolve(imgDir, name), name };
	}

	getImages() {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		return fs.readdirSync(imgDir);
	}

	async addImage(
		channel: TextChannel | DMChannel | NewsChannel,
		author: User,
		args: string[],
	) {
		const url: string = args.shift();

		if (url === undefined) {
			channel.send('!img add <url>');
			return;
		}

		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		const lastDotIndex: number = url.lastIndexOf('.');
		const fileEnding: string = url.substr(lastDotIndex, url.length);

		let imgName: string = args.shift();
		if (imgName === undefined) {
			imgName = `${uuid()}.${fileEnding}`;
		} else {
			imgName += fileEnding;
		}

		if (await this.hasImage(imgName)) {
			channel.send(`File with the name "${imgName}" already exists`);
			return;
		}

		const response = await fetch(url, { size: 1024 * 1024 * 20 });
		if (response.ok) {
			await streamPipeline(
				response.body,
				fs.createWriteStream(`${imgDir}/${imgName}`),
			);

			await knex<DBImage>('images').insert({
				name: imgName,
				original_link: url,
				views: 0,
				submission_by: author.id,
				submission_date: new Date().getTime(),
				deleted: false,
			});

			channel.send(`Image added`);
		} else {
			channel.send('response not ok');
		}
	}
}

export default ImgDB;
