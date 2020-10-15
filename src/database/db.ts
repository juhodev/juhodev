import { Client, Guild, TextChannel } from 'discord.js';
import * as fs from 'fs';
import Clips from '../clips/clips';
import RRSG from '../randomReadableStringGenerator';
import ClipsDB from './clipsDB';
import ImgDB from './imgDB';
import MetricsDB from './metricsDB';
import QuoteDB from './quoteDB';
import { DBConfig, DB_CONFIG_FILE, DB_DATA_DIR } from './types';

class DB {
	private quoteDB: QuoteDB;
	private metricsDB: MetricsDB;
	private imgDB: ImgDB;
	private rrsg: RRSG;
	private clips: Clips;
	private clipsDB: ClipsDB;

	private config: DBConfig;

	constructor() {
		this.quoteDB = new QuoteDB();
		this.metricsDB = new MetricsDB();
		this.imgDB = new ImgDB();
		this.rrsg = new RRSG();
		this.clips = new Clips(this);
		this.clipsDB = new ClipsDB();

		this.config = {};
	}

	setup(channel: TextChannel) {
		const { guild } = channel;
		this.config.guild = guild;

		this.writeToDisk();
	}

	updateGuild(client: Client) {
		if (this.config.guild === undefined) {
			return;
		}

		this.config.guild = client.guilds.cache.get(this.config.guild.id);
	}

	getGuild(): Guild {
		return this.config.guild;
	}

	getQuoteDB(): QuoteDB {
		return this.quoteDB;
	}

	getMetricsDB(): MetricsDB {
		return this.metricsDB;
	}

	getImgDB(): ImgDB {
		return this.imgDB;
	}

	getRRSG(): RRSG {
		return this.rrsg;
	}

	getClips(): Clips {
		return this.clips;
	}

	getClipsDB(): ClipsDB {
		return this.clipsDB;
	}

	load() {
		if (!fs.existsSync(DB_DATA_DIR)) {
			fs.mkdirSync(DB_DATA_DIR);
			return;
		}

		if (!fs.existsSync(`${DB_DATA_DIR}/${DB_CONFIG_FILE}`)) {
			this.writeToDisk();
		} else {
			const configString: string = fs.readFileSync(
				`${DB_DATA_DIR}/${DB_CONFIG_FILE}`,
				'utf-8',
			);
			this.config = JSON.parse(configString);
		}

		this.quoteDB.load();
		this.metricsDB.load();
		this.rrsg.load();
		this.clipsDB.load();

		this.clips.setup();
	}

	private writeToDisk() {
		fs.writeFileSync(
			`${DB_DATA_DIR}/${DB_CONFIG_FILE}`,
			JSON.stringify(this.config),
		);
	}
}

export default DB;
