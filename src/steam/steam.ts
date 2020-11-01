import {
	DBCsgoGame,
	DBCsgoPlayer,
	DBCsgoStats,
	DBPlayerStatsWithGame,
} from '../db/types';
import { knex } from '../db/utils';
import { CsgoGameStats, CsgoMapStats, CsgoProfile, CsgoUser } from './types';
import { downloadTxt } from '../utils';
import * as fs from 'fs';

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

	constructor() {
		this.profiles = new Map();
		this.csgoUsers = [];
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
			.filter((user) => user.name.toLowerCase().startsWith(name))
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

	private getGameData(dbGames: DBPlayerStatsWithGame[]): GameData {
		const totalData: CsgoGameStats = {
			assists: 0,
			deaths: 0,
			hsp: 0,
			kills: 0,
			matchDuration: 0,
			waitTime: 0,
			mvps: 0,
			ping: 0,
			score: 0,
		};
		const highestData: CsgoGameStats = {
			assists: 0,
			deaths: 0,
			hsp: 0,
			kills: 0,
			matchDuration: 0,
			waitTime: 0,
			mvps: 0,
			ping: 0,
			score: 0,
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
				totalData[field] += dbGame[field];

				if (highestData[field] < dbGame[field]) {
					highestData[field] = dbGame[field];
				}
			}

			const { wait_time, match_duration, map } = dbGame;
			totalData.waitTime += wait_time;
			totalData.matchDuration += match_duration;

			if (highestData.waitTime < wait_time) {
				highestData.waitTime = wait_time;
			}

			if (highestData.matchDuration < match_duration) {
				highestData.matchDuration = match_duration;
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
				assists: totalData.assists / dbGames.length,
				deaths: totalData.deaths / dbGames.length,
				hsp: totalData.hsp / dbGames.length,
				kills: totalData.kills / dbGames.length,
				matchDuration: totalData.matchDuration / dbGames.length,
				waitTime: totalData.waitTime / dbGames.length,
				mvps: totalData.mvps / dbGames.length,
				ping: totalData.ping / dbGames.length,
				score: totalData.score / dbGames.length,
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
