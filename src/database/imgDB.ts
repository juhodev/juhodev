import { DMChannel, NewsChannel, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { DB_DATA_DIR, Image, IMG_DIR } from './types';
import fetch from 'node-fetch';
import * as util from 'util';
import { uuid } from 'uuidv4';
import RandomString from '../randomString';
import * as path from 'path';

const streamPipeline = util.promisify(require('stream').pipeline);

class ImgDB {
	private random: RandomString;
	constructor() {
		this.random = new RandomString();
	}

	hasImage(name: string): boolean {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		const files = fs.readdirSync(imgDir);
		return files.includes(name);
	}

	getRandomImage(): Image {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

		const images: string[] = this.getImages();
		const randomImage = this.random.pseudoRandom(images);

		return { path: path.resolve(imgDir, randomImage), name: randomImage };
	}

	getImage(name: string): Image {
		const imgDir = `${DB_DATA_DIR}/${IMG_DIR}`;
		if (!fs.existsSync(imgDir)) {
			fs.mkdirSync(imgDir);
		}

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

		if (this.hasImage(imgName)) {
			channel.send(`File with the name "${imgName}" already exists`);
			return;
		}

		const response = await fetch(url, { size: 1024 * 1024 * 20 });
		if (response.ok) {
			await streamPipeline(
				response.body,
				fs.createWriteStream(`${imgDir}/${imgName}`),
			);

			channel.send(`Image added`);
		} else {
			channel.send('response not ok');
		}
	}
}

export default ImgDB;
