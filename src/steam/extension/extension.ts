import { match } from 'assert';
import { db } from '../..';
import {
	DBCsgoMatch,
	DBCsgoPlayer,
	DBCsgoStats,
	DBUploadedCsgoMatch,
} from '../../db/types';
import { knex } from '../../db/utils';
import { makeId } from '../../utils';
import {
	ErrorCode,
	ExtensionSaveResponse,
	UploadCode,
	ExtensionMatch,
} from './types';

class Extension {
	// The upload codes are never saved to the database. They're just kept in memory because
	// there is no reason they'd need to survive a restart. And there is never going to be more
	// than say 50 at max.
	private uploadCodes: UploadCode[];

	constructor() {
		this.uploadCodes = [];
	}

	async saveMatches(
		matches: ExtensionMatch[],
		code: string,
	): Promise<ExtensionSaveResponse> {
		if (!this.validUploadCode(code)) {
			return {
				error: true,
				errorCode: ErrorCode.INVALID_UPLOAD_CODE,
			};
		}

		const uploadCode: UploadCode = this.uploadCodes.find(
			(x) => x.code === code,
		);

		let sameUploadCount: number = 0;
		for (const match of matches) {
			// Whether or not the same match was already uploaded by the same user.
			const alreadyUploaded: boolean = await this.saveExtensionMatch(
				match,
				uploadCode,
			);

			if (alreadyUploaded) {
				sameUploadCount++;
			}
		}

		return {
			error: false,
			alreadyExists: sameUploadCount === matches.length,
		};
	}

	getUploadCode(snowflake: string): UploadCode {
		const oldCode: UploadCode = this.uploadCodes.find(
			(x) => x.createdFor === snowflake,
		);
		if (oldCode !== undefined) {
			return oldCode;
		}

		const code = makeId(8).toUpperCase();

		const uploadCode: UploadCode = {
			createdAt: new Date().getTime(),
			createdFor: snowflake,
			code,
		};

		this.uploadCodes.push(uploadCode);
		return uploadCode;
	}

	/**
	 * Saves match data received from the extension to the database.
	 *
	 * @param extensionMatch Match data of a individual match sent from the extension.
	 * @param uploadCode The upload code the user used to upload the extension data.
	 * @returns true if the match was already uploaded by the same user.
	 */
	private async saveExtensionMatch(
		extensionMatch: ExtensionMatch,
		uploadCode: UploadCode,
	): Promise<boolean> {
		const matchInDbFormat: DBCsgoMatch = this.convertExtensionMatchToDBCsgoMatch(
			extensionMatch,
			uploadCode,
		);
		const insertedMatch: [
			boolean,
			DBCsgoMatch,
		] = await this.insertMatchToDatabase(matchInDbFormat);

		if (!insertedMatch[0]) {
			this.insertNewPlayers(extensionMatch, uploadCode);
			this.insertNewStats(
				extensionMatch,
				uploadCode,
				insertedMatch[1].id,
			);
			await knex<DBUploadedCsgoMatch>('csgo_games_uploads').insert({
				match_id: insertedMatch[1].id,
				player_id: uploadCode.createdFor,
			});
		} else {
			const uploadedByUser: boolean = await this.hasUserAlreadyUploadedMatch(
				matchInDbFormat,
				uploadCode.createdFor,
			);
			await knex<DBUploadedCsgoMatch>('csgo_games_uploads').insert({
				match_id: insertedMatch[1].id,
				player_id: uploadCode.createdFor,
			});

			return uploadedByUser;
		}

		return false;
	}

	private async insertNewStats(
		extensionMatch: ExtensionMatch,
		uploadCode: UploadCode,
		matchId: number,
	) {
		const { players } = extensionMatch;
		const newStats: DBCsgoStats[] = [];

		for (const player of players) {
			// When inserting stats this will most likely hit the database and not the cache. I should figure out a
			// way to skip the database read here to make this more faster.
			const dbStats: DBCsgoStats = await db.getPlayerStatsInAMatch(
				player.miniprofile,
				matchId,
			);

			if (dbStats === undefined) {
				const dbStats: DBCsgoStats = {
					assists: player.assists,
					deaths: player.deaths,
					hsp: player.hsp,
					player_id: player.miniprofile,
					kills: player.kills,
					mvps: player.mvps,
					ping: player.ping,
					score: player.score,
					side: player.side,
					match_id: matchId,
					uploaded_by: uploadCode.createdFor,
				};

				// Push the stats to the newStats array so I can later insert the new stats as a batch.
				// Doing it this way reduces writes from 10 to 1 per game
				newStats.push(dbStats);
			}
		}

		await knex<DBCsgoStats>('csgo_stats').insert(newStats);

		// It's a little unfortunate that I have to clear all caches related to csgo when I do this
		// but I don't have the time to work on a great caching system right now so it is what it is.
		db.clearCsgoCaches();
	}

	/**
	 * Inserts all the new players in the database.
	 * This first checks if the player is already in the database and if not inserts it.
	 *
	 * @param extensionMatch Match data that a user has uploaded with the extension.
	 * @param uploadCode The upload code the user used to upload the extension data.
	 */
	private async insertNewPlayers(
		extensionMatch: ExtensionMatch,
		uploadCode: UploadCode,
	) {
		const { players } = extensionMatch;
		const newPlayers: DBCsgoPlayer[] = [];

		for (const player of players) {
			// When inserting players this will most likely hit the database and not the cache. I should figure out a
			// way to skip the database read here to make this more faster.
			const dbPlayer: DBCsgoPlayer = await db.getCsgoPlayer(
				player.miniprofile,
			);

			if (dbPlayer === undefined) {
				const dbPlayer: DBCsgoPlayer = {
					avatar_link: player.avatarSrc,
					id: player.miniprofile,
					name: player.name,
					steam_link: player.steamLink,
					uploaded_by: uploadCode.createdFor,
				};

				// Push the player to the newPlayers array so I can later insert the new players as a batch.
				// Doing it this way reduces writes from 10 to 1 per game
				newPlayers.push(dbPlayer);
			}
		}

		await knex<DBCsgoPlayer>('csgo_players').insert(newPlayers);

		// It's a little unfortunate that I have to clear all caches related to csgo when I do this
		// but I don't have the time to work on a great caching system right now so it is what it is.
		db.clearCsgoCaches();
	}

	/**
	 * Currently only checks whether or not the upload code exists. In the future there might
	 * need to be more checks for better security (there is quite literally no security here at the moment except
	 * that you need a valid upload code).
	 *
	 * @param code Upload code supplied by the user
	 */
	private validUploadCode(code: string) {
		const uploadCode: UploadCode = this.uploadCodes.find(
			(x) => x.code === code,
		);

		return uploadCode !== undefined;
	}

	/**
	 * This either inserts a new match into the database or if the match is already in the database returns the
	 * old id.
	 *
	 * @param dbMatch Match you want to insert into the database.
	 * @retunrs A boolean representing whether or not the match already exists (true if the match already existed) and the match that was inserted or
	 * 			was already in the database.
	 */
	private async insertMatchToDatabase(
		dbMatch: DBCsgoMatch,
	): Promise<[boolean, DBCsgoMatch]> {
		const oldMatch: DBCsgoMatch = await db.findOldCsgoMatch(
			dbMatch.map,
			dbMatch.date,
			dbMatch.match_duration,
		);

		let matchAlreadyExists: boolean;
		let matchId: number;
		if (oldMatch === undefined) {
			matchId = await knex<DBCsgoMatch>('csgo_games')
				.insert(dbMatch)
				.returning('id');
			matchAlreadyExists = false;
		} else {
			matchId = oldMatch.id;
			matchAlreadyExists = true;
		}

		dbMatch.id = matchId;
		const matchToReturn: DBCsgoMatch =
			oldMatch === undefined ? dbMatch : oldMatch;
		return [matchAlreadyExists, matchToReturn];
	}

	private async hasUserAlreadyUploadedMatch(
		dbMatch: DBCsgoMatch,
		playerId: string,
	): Promise<boolean> {
		const game: DBUploadedCsgoMatch = await db.getMatchUploadedByUser(
			dbMatch.id,
			playerId,
		);

		return game !== undefined;
	}

	/**
	 * Converts match data received from the extension to a format that can be used to store it in the database.
	 *
	 * @param extensionMatch Match data of an individual match that the user has uploaded with the extension.
	 * @param uploadCode The upload code the user used to upload the extension data.
	 */
	private convertExtensionMatchToDBCsgoMatch(
		extensionMatch: ExtensionMatch,
		uploadCode: UploadCode,
	): DBCsgoMatch {
		const { game: mapData } = extensionMatch;

		const date: number = new Date(mapData.date).getTime();

		const timeAsString: string = mapData.matchDuration.split(': ')[1];
		const timeSplit: string[] = timeAsString.split(':');

		const durationMinutes: number = parseInt(timeSplit[0]);
		const durationSeconds: number = parseInt(timeSplit[1]);
		const matchDuration: number = durationMinutes * 60 + durationSeconds;

		const waitAsString: string = mapData.waitTime.split(': ')[1];
		const waitSplit: string[] = waitAsString.split(':');

		const waitMinutes: number = parseInt(waitSplit[0]);
		const waitSeconds: number = parseInt(waitSplit[1]);
		const waitTime: number = waitMinutes * 60 + waitSeconds;

		const mapFirstSpaceIndex: number = mapData.map.indexOf(' ');
		const map: string = mapData.map.substr(
			mapFirstSpaceIndex + 1,
			mapData.map.length,
		);

		const scoreSplit: string[] = mapData.score.split(':');
		const ctRounds: number = parseInt(scoreSplit[0]);
		const tRounds: number = parseInt(scoreSplit[1]);
		let winner: string;
		if (ctRounds > tRounds) {
			winner = 'CT';
		} else if (tRounds > ctRounds) {
			winner = 'T';
		} else {
			winner = 'TIE';
		}

		return {
			match_duration: matchDuration,
			wait_time: waitTime,
			map,
			ct_rounds: ctRounds,
			t_rounds: tRounds,
			winner,
			date,
			uploaded_by: uploadCode.createdFor,
		};
	}
}

export default Extension;
