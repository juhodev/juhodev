import {
	DBCsgoGame,
	DBCsgoPlayer,
	DBCsgoStats,
	DBPlayerStatsWithGame,
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
} from './types';
import { downloadTxt, makeId } from '../utils';

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

	private uploadCodes: UploadCode[];

	constructor() {
		this.profiles = [];
		this.csgoUsers = [];
		this.csgoMatchCache = new Map();
		this.uploadCodes = [];
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

		if (this.csgoUsers.length === 0) {
			const csgoUsers = await knex<CsgoUser>('csgo_players')
				.where({})
				.select('id', 'name');

			this.csgoUsers = csgoUsers;
		}

		return this.csgoUsers
			.filter((user) =>
				user.name.toLowerCase().startsWith(name.toLowerCase()),
			)
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	private async buildProfile(id: string): Promise<CsgoProfile> {
		const player: DBCsgoPlayer = await knex('csgo_players')
			.where({ id })
			.first();

		if (player === undefined) {
			return undefined;
		}

		const dbGames: DBPlayerStatsWithGame[] = await knex('csgo_stats')
			.join('csgo_games', 'csgo_games.id', 'csgo_stats.match_id')
			.select('*');

		const userGames: DBPlayerStatsWithGame[] = dbGames.filter(
			(game) => game.player_id === id,
		);

		const tenBestDbGames: DBPlayerStatsWithGame[] = this.bestTenGamesInARow(
			userGames,
		);
		const tenBestCsgoGames: GameWithStats[] = tenBestDbGames.map(
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

	async getMatchFromDB(matchId: number): Promise<CsgoMatch> {
		const dbMatch: DBCsgoGame = await knex<DBCsgoGame>('csgo_games')
			.where({
				id: matchId,
			})
			.first();

		const dbPlayers: DBPlayerStatsWithPlayerInfo[] = await knex<
			DBPlayerStatsWithPlayerInfo
		>('csgo_players')
			.select('*')
			.innerJoin('csgo_stats', function () {
				this.on('csgo_stats.player_id', '=', 'csgo_players.id').andOn(
					'csgo_stats.match_id',
					'=',
					knex.raw(dbMatch.id),
				);
			});

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
		const dbPlayer: DBCsgoPlayer = await knex<DBCsgoPlayer>('csgo_players')
			.where({ id })
			.first();

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

		const oldPlayers: DBCsgoPlayer[] = await knex<DBCsgoPlayer>(
			'csgo_players',
		).where({});
		const oldStats: DBCsgoStats[] = await knex<DBCsgoStats>(
			'csgo_stats',
		).where({});

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

		this.profiles = [];
		this.csgoUsers = [];

		return addResponse;
	}

	async addMatchFromExtension(
		extensionMatch: ExtensionMatch,
		uploadCode: UploadCode,
		oldPlayers: DBCsgoPlayer[],
		oldStats: DBCsgoStats[],
	): Promise<{ addResponse: AddResponse; stats: StatsBatch }> {
		const mapData: ExtensionMapData = extensionMatch.game;
		const dbGame: DBCsgoGame = this.dbCsgoGameFromExtensionGame(
			mapData,
			uploadCode,
		);

		const oldMatch: DBCsgoGame = await knex<DBCsgoGame>('csgo_games')
			.where({
				map: dbGame.map,
				date: dbGame.date,
				match_duration: dbGame.match_duration,
			})
			.first();

		const alreadyExists: boolean = oldMatch !== undefined;

		let matchId: number;

		if (oldMatch === undefined) {
			matchId = await knex<DBCsgoGame>('csgo_games')
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
		const games: DBPlayerStatsWithGame[] = await this.getPlayerStatsWithGames(
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

	private async getPlayerStatsWithGames(
		playerId: string,
		page: number,
	): Promise<DBPlayerStatsWithGame[]> {
		const resultsInPage: number = 10;
		const firstResult: number = page * resultsInPage;

		const dbGames: DBPlayerStatsWithGame[] = await knex('csgo_stats')
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
	): DBCsgoGame {
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

	private getGameData(dbGames: DBPlayerStatsWithGame[]): GameData {
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
		games: DBPlayerStatsWithGame[],
	): DBPlayerStatsWithGame[] {
		const currentGames: DBPlayerStatsWithGame[] = [];
		let total: number = 0;

		let bestTotal: number = 0;
		let bestGames: DBPlayerStatsWithGame[] = [];

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

			const removedGame: DBPlayerStatsWithGame = currentGames.shift();
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
}

export default Steam;
