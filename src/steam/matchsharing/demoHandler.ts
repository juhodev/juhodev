import { ChildProcess, exec } from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { DemoDownload } from './types';
import { saveFinalScoreboard } from './demoUtils';

const streamPipeline = util.promisify(require('stream').pipeline);

class DemoHandler {
	private downloadQueue: DemoDownload[];
	private working: boolean;

	constructor() {
		this.downloadQueue = [];
		this.working = false;
	}

	add(demo: DemoDownload) {
		if (demo === undefined) {
			return;
		}

		this.downloadQueue.push(demo);
		this.process();
	}

	private async process() {
		// Don't process a new demo if one demo is already being worked on
		if (this.working || this.downloadQueue.length === 0) {
			return;
		}

		this.working = true;
		const demo: DemoDownload = this.downloadQueue.shift();

		const filePath: string = await this.downloadDemo(demo.link);
		if (filePath === undefined) {
			console.error(
				`Couldn't process demo ${JSON.stringify(
					demo,
				)}. filePath is undefined`,
			);
			return;
		}

		await this.decompressWithBzip2(filePath);
		await saveFinalScoreboard(
			filePath.substr(0, filePath.length - 4),
			demo.date,
		);
		this.working = false;
		this.process();
	}

	private async downloadDemo(demoLink: string): Promise<string> {
		const demoName: string = demoLink.substr(
			demoLink.lastIndexOf('/') + 1,
			demoLink.length - 1,
		);

		const filePath: string = `data/csgo/demos/${demoName}`;

		const response = await fetch(demoLink);
		if (response.ok) {
			await streamPipeline(response.body, fs.createWriteStream(filePath));
			return filePath;
		} else {
			return undefined;
		}
	}

	private async decompressWithBzip2(path: string): Promise<void> {
		return new Promise((resolve) => {
			const command: string = `bzip2 -d ${path}`;
			const process: ChildProcess = exec(command);
			process.on('exit', () => {
				resolve();
			});
		});
	}
}

export default DemoHandler;
