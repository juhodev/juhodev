import {
	DBCsgoMatch,
	DBCsgoPlayer,
	DBCsgoStats,
	DBPlayerStatsWithMatch,
	DBPlayerStatsWithPlayerInfo,
} from '../db/types';
import { knex } from '../db/utils';
import {
	CsgoMatch,
	CsgoGameStats,
	CsgoMapStats,
	CsgoPlayer,
	CsgoProfile,
	CsgoUser,
	ExtensionMatch,
	ExtensionMapData,
	ExtensionPlayerData,
	UploadCode,
	AddResponse,
	GameWithStats,
	SteamUser,
	MapStatistics,
	CsgoMap,
	DateMatches,
} from './types';
import { downloadTxt, makeId } from '../utils';
import { db } from '..';

type GameData = {
	averages: CsgoGameStats;
	highest: CsgoGameStats;
	mapStats: CsgoMapStats[];
};

type StatsBatch = {
	dbPlayers: DBCsgoPlayer[];
	dbStats: DBCsgoStats[];
};

class Steam {
	private profiles: CsgoProfile[];
	private csgoUsers: CsgoUser[];
	private csgoMatchCache: Map<number, CsgoMatch>;
	private csgoMapStatisticsCache: Map<string, MapStatistics>;

	private uploadCodes: UploadCode[];

	constructor() {
		this.profiles = [];
		this.csgoUsers = [];
		this.csgoMatchCache = new Map();
		this.uploadCodes = [];
		this.csgoMapStatisticsCache = new Map();
	}

	async getProfile(id: string): Promise<CsgoProfile> {
		const oldProfile: CsgoProfile = this.profiles.find(
			(prof) => prof.id === id,
		);
		if (oldProfile !== undefined) {
			return oldProfile;
		}

		const profile: CsgoProfile = await this.buildProfile(id);
		return profile;
	}

	async getProfileWithLink(link: string): Promise<CsgoProfile> {
		if (link.endsWith('/')) {
			link = link.substr(0, link.length - 1);
		}

		const player: DBCsgoPlayer = await knex<DBCsgoPlayer>('csgo_players')
			.where({ steam_link: link })
			.first();

		if (player === undefined) {
			return undefined;
		}

		return await this.getProfile(player.id);
	}

	async search(name: string): Promise<CsgoUser[]> {
		if (name.length < 2) {
			return [];
		}

		const players: DBCsgoPlayer[] = await db.getCsgoPlayers();
		return players
			.filter((user) =>
				user.name.toLowerCase().startsWith(name.toLowerCase()),
			)
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	private async buildProfile(id: string): Promise<CsgoProfile> {
		const player: DBCsgoPlayer = await db.getCsgoPlayer(id);
		if (player === undefined) {
			return undefined;
		}

		const dbMatches: DBPlayerStatsWithMatch[] = await db.getCsgoPlayersWithMatches();
		const userGames: DBPlayerStatsWithMatch[] = dbMatches.filter(
			(match) => match.player_id === id,
		);

		const tenBestDbMatches: DBPlayerStatsWithMatch[] = this.bestTenGamesInARow(
			userGames,
		);
		const tenBestCsgoGames: GameWithStats[] = tenBestDbMatches.map(
			(game): GameWithStats => {
				return {
					id: game.match_id,
					date: game.date,
					ctRounds: game.ct_rounds,
					tRounds: game.t_rounds,
					map: game.map,
					matchDuration: game.match_duration,
					player: {
						assists: game.assists,
						deaths: game.deaths,
						hsp: game.hsp,
						kills: game.kills,
						mvps: game.mvps,
						ping: game.ping,
						score: game.score,
						side: game.side,
						name: player.name,
						playerId: player.id,
						avatar: player.avatar_link,
						steamLink: player.steam_link,
					},
				};
			},
		);

		const { name, steam_link: steamLink, avatar_link: avatarLink } = player;
		const matchesPlayed: number = userGames.length;
		const gameData: GameData = this.getGameData(userGames);

		let won: number = 0;
		let lost: number = 0;
		let tied: number = 0;

		for (const game of userGames) {
			const playerSide: string = game.side;
			const winner: string = game.winner;

			if (winner === 'TIE') {
				tied++;
				continue;
			}

			if (playerSide === winner) {
				won++;
			} else {
				lost++;
			}
		}

		const profile: CsgoProfile = {
			name,
			id,
			steamLink,
			avatarLink,
			matchesPlayed,
			won,
			lost,
			tied,
			gameAverages: gameData.averages,
			gameHighest: gameData.highest,
			mapStats: gameData.mapStats,
			tenBestGames: tenBestCsgoGames,
		};

		this.profiles.push(profile);
		return profile;
	}

	async getMatch(matchId: number): Promise<CsgoMatch> {
		if (this.csgoMatchCache.has(matchId)) {
			return this.csgoMatchCache.get(matchId);
		}

		const game: CsgoMatch = await this.getMatchFromDB(matchId);
		this.csgoMatchCache.set(matchId, game);

		return game;
	}

	async getPlayerMatchFrequency(playerId: string): Promise<DateMatches[]> {
		const matches: DBPlayerStatsWithMatch[] = await db.getCsgoPlayerStatsWithMatches(
			playerId,
		);

		const roundedDates: Date[] = matches.map((match) => {
			const date: Date = new Date(match.date);
			const roundedDate: Date = new Date();
			roundedDate.setFullYear(date.getFullYear());
			roundedDate.setMonth(date.getMonth());
			roundedDate.setDate(date.getDate());

			return roundedDate;
		});

		const dateMatches: DateMatches[] = [];
		for (const date of roundedDates) {
			const oldDate: DateMatches = dateMatches.find(
				(dateMatch) => dateMatch.date === date.getTime(),
			);

			if (oldDate !== undefined) {
				oldDate.matches++;
				continue;
			}

			dateMatches.push({ date: date.getTime(), matches: 1 });
		}

		return dateMatches;
	}

	async getMatchFromDB(matchId: number): Promise<CsgoMatch> {
		const dbMatch: DBCsgoMatch = await db.getCsgoMatch(matchId);
		const dbPlayers: DBPlayerStatsWithPlayerInfo[] = await db.getCsgoPlayersInAMatch(
			dbMatch.id,
		);

		const players: CsgoPlayer[] = dbPlayers.map(
			(dbPlayer): CsgoPlayer => {
				return {
					name: dbPlayer.name,
					playerId: dbPlayer.player_id,
					avatar: dbPlayer.avatar_link,
					ping: dbPlayer.ping,
					kills: dbPlayer.kills,
					assists: dbPlayer.assists,
					deaths: dbPlayer.deaths,
					mvps: dbPlayer.mvps,
					hsp: dbPlayer.hsp,
					score: dbPlayer.score,
					steamLink: dbPlayer.steam_link,
					side: dbPlayer.side,
				};
			},
		);

		const game: CsgoMatch = {
			map: dbMatch.map,
			matchDuration: dbMatch.match_duration,
			players: players,
			waitTime: dbMatch.wait_time,
			ctRounds: dbMatch.ct_rounds,
			tRounds: dbMatch.t_rounds,
			winner: dbMatch.winner,
		};

		return game;
	}

	async getUser(id: string): Promise<SteamUser> {
		const dbPlayer: DBCsgoPlayer = await db.getCsgoPlayer(id);

		const user: SteamUser = {
			avatar: dbPlayer.avatar_link,
			name: dbPlayer.name,
			steamId: dbPlayer.id,
			steamLink: dbPlayer.steam_link,
		};

		return user;
	}

	async addDataFromExtension(
		matches: ExtensionMatch[],
		code: string,
	): Promise<AddResponse> {
		const uploadCode: UploadCode = this.uploadCodes.find(
			(x) => x.code === code,
		);

		if (uploadCode === undefined) {
			return;
		}

		const addResponse: AddResponse = {
			alreadyExists: true,
		};

		const players: DBCsgoPlayer[] = [];
		const stats: DBCsgoStats[] = [];

		const oldPlayers: DBCsgoPlayer[] = await db.getCsgoPlayers();
		const oldStats: DBCsgoStats[] = await db.getCsgoStats();

		for (const match of matches) {
			const response: {
				addResponse: AddResponse;
				stats: StatsBatch;
			} = await this.addMatchFromExtension(
				match,
				uploadCode,
				oldPlayers,
				oldStats,
			);

			if (!response.addResponse.alreadyExists) {
				addResponse.alreadyExists = false;
			}

			players.push(...response.stats.dbPlayers);
			stats.push(...response.stats.dbStats);
			oldPlayers.push(...response.stats.dbPlayers);
			oldStats.push(...response.stats.dbStats);
		}

		await knex<DBCsgoPlayer>('csgo_players').insert(players);
		await knex<DBCsgoStats>('csgo_stats').insert(stats);

		db.clearCsgoCaches();
		this.invalidateCaches();
		return addResponse;
	}

	async addMatchFromExtension(
		extensionMatch: ExtensionMatch,
		uploadCode: UploadCode,
		oldPlayers: DBCsgoPlayer[],
		oldStats: DBCsgoStats[],
	): Promise<{ addResponse: AddResponse; stats: StatsBatch }> {
		const mapData: ExtensionMapData = extensionMatch.game;
		const dbGame: DBCsgoMatch = this.dbCsgoGameFromExtensionGame(
			mapData,
			uploadCode,
		);

		const oldMatch: DBCsgoMatch = await db.findOldCsgoMatch(
			dbGame.map,
			dbGame.date,
			dbGame.match_duration,
		);

		const alreadyExists: boolean = oldMatch !== undefined;

		let matchId: number;
		if (oldMatch === undefined) {
			matchId = await knex<DBCsgoMatch>('csgo_games')
				.insert(dbGame)
				.returning('id');
		} else {
			matchId = oldMatch.id;
		}

		const dbPlayersArray: DBCsgoPlayer[] = [];
		const dbStatsArray: DBCsgoStats[] = [];

		const players: ExtensionPlayerData[] = extensionMatch.players;
		for (const player of players) {
			const dbPlayer: DBCsgoPlayer = {
				avatar_link: player.avatarSrc,
				id: player.miniprofile,
				name: player.name,
				steam_link: player.steamLink,
				uploaded_by: uploadCode.createdFor,
			};

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

			const oldPlayer: DBCsgoPlayer = oldPlayers.find(
				(p) => p.id === dbPlayer.id,
			);
			if (oldPlayer === undefined) {
				dbPlayersArray.push(dbPlayer);
			}

			const oldStat: DBCsgoStats = oldStats.find(
				(s) =>
					s.match_id === dbStats.match_id &&
					s.player_id === dbStats.player_id,
			);

			if (oldStat === undefined) {
				dbStatsArray.push(dbStats);
			}
		}

		const statsBatch: StatsBatch = {
			dbPlayers: dbPlayersArray,
			dbStats: dbStatsArray,
		};

		return { addResponse: { alreadyExists }, stats: statsBatch };
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

	async getPlayerMatches(
		playerId: string,
		page: number,
	): Promise<GameWithStats[]> {
		const games: DBPlayerStatsWithMatch[] = await this.getPlayerStatsWithGames(
			playerId,
			page,
		);

		const gamesWithStats: GameWithStats[] = games.map(
			(game): GameWithStats => {
				return {
					id: game.match_id,
					date: game.date,
					ctRounds: game.ct_rounds,
					tRounds: game.t_rounds,
					map: game.map,
					matchDuration: game.match_duration,
					player: {
						assists: game.assists,
						deaths: game.deaths,
						hsp: game.hsp,
						kills: game.kills,
						mvps: game.mvps,
						ping: game.ping,
						score: game.score,
						side: game.side,
						name: '',
						playerId: playerId,
						avatar: '',
						steamLink: '',
					},
				};
			},
		);

		return gamesWithStats;
	}

	async getPlayerMapStatistics(playerId: string): Promise<MapStatistics> {
		if (this.csgoMapStatisticsCache.has(playerId)) {
			return this.csgoMapStatisticsCache.get(playerId);
		}

		const dbGames: DBPlayerStatsWithMatch[] = await db.getCsgoPlayerStatsWithMatches(
			playerId,
		);
		const maps: CsgoMap[] = [];

		for (const game of dbGames) {
			const oldMap: CsgoMap = maps.find((x) => x.name === game.map);

			if (oldMap !== undefined) {
				oldMap.timesPlayed++;
				continue;
			}

			maps.push({ name: game.map, timesPlayed: 1 });
		}

		const statistics: MapStatistics = { maps };
		this.csgoMapStatisticsCache.set(playerId, statistics);

		return statistics;
	}

	private async getPlayerStatsWithGames(
		playerId: string,
		page: number,
	): Promise<DBPlayerStatsWithMatch[]> {
		const resultsInPage: number = 10;
		const firstResult: number = page * resultsInPage;

		// For now I'll query the database for these. In the future stop skipping the db cache and use it.
		const dbGames: DBPlayerStatsWithMatch[] = await knex('csgo_stats')
			.innerJoin('csgo_games', function () {
				this.on('csgo_games.id', '=', 'csgo_stats.match_id').andOn(
					'csgo_stats.player_id',
					'=',
					knex.raw(playerId),
				);
			})
			.limit(10)
			.offset(firstResult)
			.orderBy('csgo_games.date');

		return dbGames;
	}

	private dbCsgoGameFromExtensionGame(
		mapData: ExtensionMapData,
		uploadCode: UploadCode,
	): DBCsgoMatch {
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

	private getGameData(dbGames: DBPlayerStatsWithMatch[]): GameData {
		const totalData: CsgoGameStats = {
			assists: { value: 0 },
			deaths: { value: 0 },
			hsp: { value: 0 },
			kills: { value: 0 },
			matchDuration: { value: 0 },
			waitTime: { value: 0 },
			mvps: { value: 0 },
			ping: { value: 0 },
			score: { value: 0 },
		};
		const highestData: CsgoGameStats = {
			assists: { value: 0, matchId: 0 },
			deaths: { value: 0, matchId: 0 },
			hsp: { value: 0, matchId: 0 },
			kills: { value: 0, matchId: 0 },
			matchDuration: { value: 0, matchId: 0 },
			waitTime: { value: 0, matchId: 0 },
			mvps: { value: 0, matchId: 0 },
			ping: { value: 0, matchId: 0 },
			score: { value: 0, matchId: 0 },
		};
		const mapStats: CsgoMapStats[] = [];
		const fields = [
			'assists',
			'deaths',
			'hsp',
			'kills',
			'mvps',
			'ping',
			'score',
		];

		for (const dbGame of dbGames) {
			for (const field of fields) {
				totalData[field].value += dbGame[field];

				if (highestData[field].value < dbGame[field]) {
					highestData[field].value = dbGame[field];
					highestData[field].matchId = dbGame['match_id'];
				}
			}

			const { wait_time, match_duration, map } = dbGame;
			totalData.waitTime.value += wait_time;
			totalData.matchDuration.value += match_duration;

			if (highestData.waitTime.value < wait_time) {
				highestData.waitTime.value = wait_time;
				highestData.waitTime.matchId = dbGame['match_id'];
			}

			if (highestData.matchDuration.value < match_duration) {
				highestData.matchDuration.value = match_duration;
				highestData.matchDuration.matchId = dbGame['match_id'];
			}

			let mapData: CsgoMapStats = mapStats.find(
				(oldMap) => oldMap.name === map,
			);

			if (mapData === undefined) {
				mapData = {
					name: map,
					averageMatchDuration: 0,
					averageWaitTime: 0,
					timesPlayed: 0,
				};
			}

			mapData.averageMatchDuration += match_duration;
			mapData.averageWaitTime += wait_time;
			mapData.timesPlayed++;

			if (mapData.timesPlayed === 1) {
				mapStats.push(mapData);
			}
		}

		return {
			highest: highestData,
			averages: {
				assists: { value: totalData.assists.value / dbGames.length },
				deaths: { value: totalData.deaths.value / dbGames.length },
				hsp: { value: totalData.hsp.value / dbGames.length },
				kills: { value: totalData.kills.value / dbGames.length },
				matchDuration: {
					value: totalData.matchDuration.value / dbGames.length,
				},
				waitTime: { value: totalData.waitTime.value / dbGames.length },
				mvps: { value: totalData.mvps.value / dbGames.length },
				ping: { value: totalData.ping.value / dbGames.length },
				score: { value: totalData.score.value / dbGames.length },
			},
			mapStats: mapStats.map(
				(map): CsgoMapStats => {
					return {
						averageMatchDuration:
							map.averageMatchDuration / map.timesPlayed,
						averageWaitTime: map.averageWaitTime / map.timesPlayed,
						name: map.name,
						timesPlayed: map.timesPlayed,
					};
				},
			),
		};
	}

	private bestTenGamesInARow(
		games: DBPlayerStatsWithMatch[],
	): DBPlayerStatsWithMatch[] {
		const currentGames: DBPlayerStatsWithMatch[] = [];
		let total: number = 0;

		let bestTotal: number = 0;
		let bestGames: DBPlayerStatsWithMatch[] = [];

		for (const game of games) {
			if (currentGames.length <= 10) {
				total += game.score;
				currentGames.push(game);

				if (currentGames.length === 10) {
					bestTotal = total;
					bestGames = [...currentGames];
				}
				continue;
			}

			const removedGame: DBPlayerStatsWithMatch = currentGames.shift();
			total -= removedGame.score;

			currentGames.push(game);
			total += game.score;

			if (total > bestTotal) {
				bestTotal = total;
				bestGames = [...currentGames];
			}
		}

		return bestGames;
	}

	/**
	 * This invalidates all caches when new data is received from the extension. In reality I shouldn't need to
	 * clear all the caches but this will happen so infrequently that building new data isn't going to be a
	 * problem.
	 */
	private invalidateCaches() {
		this.csgoUsers = [];
		this.profiles = [];
		this.csgoMapStatisticsCache.clear();
	}
}

export default Steam;
