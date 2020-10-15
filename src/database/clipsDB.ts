import { Clip } from '../clips/types';
import * as fs from 'fs';
import * as path from 'path';
import { DB_CLIPS_FILE, DB_DATA_DIR } from './types';

class ClipsDB {
	private clips: Clip[];

	constructor() {
		this.clips = [];
	}

	save(clip: Clip) {
		this.clips.push(clip);
		this.writeToDisk();
	}

	getClips() {
		return this.clips;
	}

	addView(clipName: string) {
		const clip = this.clips.find((x) => x.name === clipName);

		if (clip === undefined) {
			return;
		}

		clip.views++;
		this.writeToDisk();
	}

	getClip(name: string): Clip {
		return this.clips.find((clip) => clip.name === name);
	}

	load() {
		const clipDBFile = path.resolve(DB_DATA_DIR, DB_CLIPS_FILE);
		if (!fs.existsSync(clipDBFile)) {
			this.writeToDisk();
			return;
		}

		const clipsString: string = fs.readFileSync(clipDBFile, 'utf-8');
		this.clips = JSON.parse(clipsString);
	}

	private writeToDisk() {
		const clipDBFile = path.resolve(DB_DATA_DIR, DB_CLIPS_FILE);
		fs.writeFileSync(clipDBFile, JSON.stringify(this.clips));
	}
}

export default ClipsDB;
