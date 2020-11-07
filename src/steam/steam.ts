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
} from './types';
import { downloadTxt } from '../utils';
import * as fs from 'fs';
import { time } from 'console';

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
	private profiles: Map<string, CsgoProfile>;
	private csgoUsers: CsgoUser[];
	private csgoMatchCache: Map<number, CsgoMatch>;

	constructor() {
		this.profiles = new Map();
		this.csgoUsers = [];
		this.csgoMatchCache = new Map();
	}

	async saveData(url: string) {
		const filePath: string = await downloadTxt(url);
		const data = this.readData(filePath);
		const players: DBCsgoPlayer[] = [];
		const stats: DBCsgoStats[] = [];

		for (const game of data) {
			const statsBatch: StatsBatch = await this.save(game, players);

			players.push(...statsBatch.dbPlayers);
			stats.push(...statsBatch.dbStats);
		}

		const oldPlayers: DBCsgoPlayer[] = await knex<DBCsgoPlayer>(
			'csgo_players',
		).where({});
		const oldStats: DBCsgoStats[] = await knex<DBCsgoStats>(
			'csgo_stats',
		).where({});

		const newPlayers: DBCsgoPlayer[] = players.filter((player) => {
			const oldPlayer: DBCsgoPlayer = oldPlayers.find(
				(x) => x.id === player.id,
			);

			return oldPlayer === undefined;
		});

		const newStats: DBCsgoStats[] = stats.filter((stat) => {
			const oldStat: DBCsgoStats = oldStats.find(
				(x) =>
					x.player_id === stat.player_id &&
					x.match_id === stat.match_id,
			);

			return oldStat === undefined;
		});

		await knex<DBCsgoPlayer>('csgo_players').insert(newPlayers);
		await knex<DBCsgoStats>('csgo_stats').insert(newStats);

		// Remove all caches profiles and players when new data is added.
		this.profiles.clear();
		this.csgoUsers = [];
	}

	async getProfile(id: string): Promise<CsgoProfile> {
		if (this.profiles.has(id)) {
			return this.profiles.get(id);
		}

		await this.buildProfile(id);
		return this.profiles.get(id);
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

	private readData(filePath: string) {
		const fileString: string = fs.readFileSync(filePath, 'utf-8');
		const lines: string[] = fileString.split('\n');

		for (const line of lines) {
			if (line.startsWith('[{"game')) {
				return JSON.parse(line);
			}
		}

		return undefined;
	}

	private async save(
		game: object,
		oldPlayers: DBCsgoPlayer[],
	): Promise<StatsBatch> {
		const gameId: number = await this.saveGame(game['game']);

		const players = game['players'];
		const dbPlayersArray: DBCsgoPlayer[] = [];
		const dbStatsArray: DBCsgoStats[] = [];
		for (const player of players) {
			const dbPlayer: DBCsgoPlayer = await this.getPlayer(
				player,
				oldPlayers,
			);
			const dbStats: DBCsgoStats = this.getStats(player, gameId);

			if (dbPlayer !== undefined) {
				dbPlayersArray.push(dbPlayer);
			}
			dbStatsArray.push(dbStats);
		}

		return {
			dbPlayers: dbPlayersArray,
			dbStats: dbStatsArray,
		};
	}

	private async saveGame(game: object): Promise<number> {
		const map: string = game['map'].split(' ')[1];
		const date: number = new Date(game['date']).getTime();

		const waitTimeString: string = game['waitTime'].split('Time: ')[1];
		const waitTimeSplit: string[] = waitTimeString.split(':');
		const waitTime: number =
			parseInt(waitTimeSplit[0]) * 60 + parseInt(waitTimeSplit[1]);

		const matchDurationString: string = game['matchDuration'].split(
			'Duration: ',
		)[1];
		const matchDurationSplit: string[] = matchDurationString.split(':');
		const matchDuration: number =
			parseInt(matchDurationSplit[0]) * 60 +
			parseInt(matchDurationSplit[1]);

		const oldGame: DBCsgoGame = await knex<DBCsgoGame>('csgo_games')
			.where({ map, date })
			.first();
		if (oldGame !== undefined) {
			return oldGame.id;
		}

		const gameId: number = await knex<DBCsgoGame>('csgo_games')
			.insert({
				map,
				date,
				wait_time: waitTime,
				match_duration: matchDuration,
			})
			.returning('id');

		return gameId;
	}

	private async getPlayer(
		player: object,
		oldPlayers: DBCsgoPlayer[],
	): Promise<DBCsgoPlayer> {
		const id: string = player['miniprofile'];
		if (oldPlayers.find((player) => player.id === id)) {
			return undefined;
		}

		const steamLink: string = '';
		const avatarLink: string = player['avatarSrc'];
		const name: string = player['name'].replace(/[\u0800-\uFFFF]/g, '');

		return {
			id,
			steam_link: steamLink,
			avatar_link: avatarLink,
			name,
		};
	}

	private getStats(player: object, gameId: number): DBCsgoStats {
		const id: string = player['miniprofile'];
		const ping: number = player['ping'];
		const kills: number = player['kills'];
		const assists: number = player['assists'];
		const deaths: number = player['deaths'];
		const mvps: number = player['mvps'];
		const hsp: number = player['hsp'];
		const score: number = player['score'];
		const side: string = player['side'];

		return {
			match_id: gameId,
			player_id: id,
			ping,
			kills,
			assists,
			deaths,
			mvps,
			hsp,
			score,
			side,
		};
	}

	private async buildProfile(id: string) {
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

		const { name, steam_link: steamLink, avatar_link: avatarLink } = player;
		const matchesPlayed: number = userGames.length;
		const gameData: GameData = this.getGameData(userGames);

		const profile: CsgoProfile = {
			name,
			id,
			steamLink,
			avatarLink,
			matchesPlayed,
			gameAverages: gameData.averages,
			gameHighest: gameData.highest,
			mapStats: gameData.mapStats,
		};

		this.profiles.set(id, profile);
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
			ctRounds: dbMatch.ctRounds,
			tRounds: dbMatch.tRounds,
			winner: dbMatch.winner,
		};

		return game;
	}

	async addDataFromExtension(matches: ExtensionMatch[]) {
		for (const match of matches) {
			await this.addMatchFromExtension(match);
		}
	}

	async addMatchFromExtension(extensionMatch: ExtensionMatch) {
		const mapData: ExtensionMapData = extensionMatch.game;
		const dbGame: DBCsgoGame = this.dbCsgoGameFromExtensionGame(mapData);

		const oldMatch: DBCsgoGame = await knex<DBCsgoGame>('csgo_games')
			.where({
				map: dbGame.map,
				date: dbGame.date,
				match_duration: dbGame.match_duration,
			})
			.first();

		let matchId: number;

		if (oldMatch === undefined) {
			matchId = await knex<DBCsgoGame>('csgo_games')
				.insert(dbGame)
				.returning('id');
		} else {
			matchId = oldMatch.id;
		}

		const players: ExtensionPlayerData[] = extensionMatch.players;
		for (const player of players) {
			const oldPlayer: DBCsgoPlayer = await knex<DBCsgoPlayer>(
				'csgo_players',
			)
				.where({
					id: player.miniprofile,
				})
				.first();

			if (oldPlayer === undefined) {
				await knex<DBCsgoPlayer>('csgo_players').insert({
					avatar_link: player.avatarSrc,
					id: player.miniprofile,
					name: player.name,
					steam_link: player.steamLink,
				});
			}

			const oldStats: DBCsgoStats = await knex<DBCsgoStats>('csgo_stats')
				.where({
					match_id: matchId,
					player_id: player.miniprofile,
				})
				.first();

			if (oldStats === undefined) {
				await knex<DBCsgoStats>('csgo_stats').insert({
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
				});
			}
		}
	}

	private dbCsgoGameFromExtensionGame(mapData: ExtensionMapData): DBCsgoGame {
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
			mapFirstSpaceIndex,
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
			ctRounds,
			tRounds,
			winner,
			date,
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
}

export default Steam;
