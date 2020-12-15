import * as Steam from 'steam';
import * as csgo from 'csgo';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { knex } from '../../db/utils';
import { DBMatchSharingCode } from '../../db/types';
import { MatchSharingCsgoMatch, RoundStats } from './types';
import DemoHandler from './demoHandler';

class GameDownloader {
	private csgoClient: csgo.CSGOClient;
	private ready: boolean;
	private demoHandler: DemoHandler;
	private initialDownloadQueue: string[];

	constructor() {
		this.ready = false;
		this.initialDownloadQueue = [];
		const steamClient: Steam.SteamClient = new Steam.SteamClient();
		const steamUser: Steam.SteamUser = new Steam.SteamUser(steamClient);
		const steamGC: Steam.SteamGameCoordinator = new Steam.SteamGameCoordinator(
			steamClient,
			730,
		);
		this.csgoClient = new csgo.CSGOClient(steamUser, steamGC, false);
		steamClient.connect();
		steamClient.on('connected', () => {
			console.log('Connected to steam');
			let loginDetails: any = {
				account_name: process.env.CSGO_STEAM_ACCOUNT_NAME,
				password: process.env.CSGO_STEAM_ACCOUNT_PASSWORD,
			};

			if (fs.existsSync('data/sentry')) {
				loginDetails.sha_sentryfile = this.makeSha(
					fs.readFileSync('data/sentry'),
				);
			}

			steamUser.logOn(loginDetails);
		});

		steamUser.on('updateMachineAuth', (response, callback) => {
			fs.writeFileSync('data/sentry', response.bytes);
			callback({ sha_file: this.makeSha(response.bytes) });
		});

		steamClient.on('error', (err) => {
			console.error('error', err);
		});

		steamClient.on('logOnResponse', (response) => {
			if (response.eresult !== Steam.EResult.OK) {
				console.log("couldn't log in!");
				return;
			}
			console.log('Logged in to steam!');
			this.csgoClient.launch();
		});

		steamClient.on('sentry', (sentry) => {
			fs.writeFileSync('data/sentry', sentry);
		});

		this.csgoClient.on('ready', () => {
			console.log('CSGO client ready!');
			this.ready = true;

			while (this.initialDownloadQueue.length !== 0) {
				const code: string = this.initialDownloadQueue.shift();
				this.download(code);
			}
		});

		this.csgoClient.on('matchList', (list) => {
			// This event is used for other match requests as well but I only care about the first match because I'm using `requestGame`.
			const match: MatchSharingCsgoMatch = list.matches[0];
			fs.writeFileSync('data/test4.json', JSON.stringify(match));
			this.saveMatch(match);
		});

		this.createDirs();
		this.demoHandler = new DemoHandler();
	}

	async download(sharingCode: string) {
		if (!this.ready) {
			console.error(
				"Couldn't download csgo game. The client isn't ready!",
			);
			this.initialDownloadQueue.push(sharingCode);
			return;
		}

		const dbSharingCode: DBMatchSharingCode = await knex<DBMatchSharingCode>(
			'match_sharing_codes',
		)
			.where({ sharing_code: sharingCode })
			.first();

		if (dbSharingCode !== undefined) {
			return;
		}

		const decodedCode: {
			matchId: string;
			outcomeId: string;
			tokenId: string;
		} = new csgo.SharecodeDecoder(sharingCode).decode();

		await knex<DBMatchSharingCode>('match_sharing_codes')
			.update({ downloaded: true })
			.where({ sharing_code: sharingCode });

		this.csgoClient.requestGame(
			decodedCode.matchId,
			decodedCode.outcomeId,
			parseInt(decodedCode.tokenId),
		);
		console.log(`Game ${sharingCode} requested`);
	}

	private saveMatch(match: MatchSharingCsgoMatch) {
		fs.writeFileSync(
			`data/csgo/node-csgo/${new Date().getTime().toString}.json`,
			JSON.stringify(match),
		);

		const lastRound: RoundStats =
			match.roundstatsall[match.roundstatsall.length - 1];

		if (lastRound.map === undefined || lastRound.map === null) {
			console.error(`Couldn't download demo!`);
			return;
		}

		this.demoHandler.add({ link: lastRound.map, date: match.matchtime });
	}

	private createDirs() {
		if (!fs.existsSync('data/csgo')) {
			fs.mkdirSync('data/csgo');
		}

		if (!fs.existsSync('data/csgo/demos')) {
			fs.mkdirSync('data/csgo/demos');
		}

		if (!fs.existsSync('data/csgo/node-csgo')) {
			fs.mkdirSync('data/csgo/node-csgo');
		}
	}

	private makeSha(bytes) {
		const hash = crypto.createHash('sha1');
		hash.update(bytes);
		return hash.digest();
	}
}

export default GameDownloader;
