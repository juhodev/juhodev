import { DBCsgoMatch, DBCsgoPlayer, DBPlayerStatsWithMatch, DBPlayerStatsWithPlayerInfo } from '../db/types';
import { knex } from '../db/utils';
import {
	CsgoMatch,
	CsgoGameStats,
	CsgoMapStats,
	CsgoPlayer,
	CsgoProfile,
	CsgoUser,
	GameWithStats,
	SteamUser,
	MapStatistics,
	CsgoMap,
	DateMatches,
	BuiltProfile,
} from './types';
import { getAllDatesBetweenTwoDates, makeId } from '../utils';
import { db, siteMetrics } from '..';
import { ExtensionMatch, ExtensionSaveResponse } from './extension/types';
import Extension from './extension/extension';
import { SteamLinkResponse } from '../api/routes/steam/types';
import { fetchSharingCodesWithSteamId3, linkAccount, startUpdatingUserCodes } from './matchsharing/matchSharing';
import LFUCache from '../cache/LFUCache';

type GameData = {
	averages: CsgoGameStats;
	highest: CsgoGameStats;
	mapStats: CsgoMapStats[];
};

class Steam {
	private profiles: CsgoProfile[];
	private csgoMatchCache: LFUCache;
	private csgoMapStatisticsCache: LFUCache;
	private csgoMatchFrequency: LFUCache;
	private csgoLeaderboardCache: DBPlayerStatsWithPlayerInfo[];
	private csgoPlayerSoloQueueCache: Map<string, number[]>;

	private extension: Extension;

	constructor() {
		this.profiles = [];
		this.csgoMatchCache = new LFUCache(512);
		this.csgoMapStatisticsCache = new LFUCache(512);
		this.csgoMatchFrequency = new LFUCache(512);
		this.csgoLeaderboardCache = [];
		this.csgoPlayerSoloQueueCache = new Map();

		this.extension = new Extension();
		startUpdatingUserCodes();
	}

	async getProfile(id: string): Promise<CsgoProfile> {
		const oldProfile: CsgoProfile = this.profiles.find((prof) => prof.id === id);
		if (oldProfile !== undefined) {
			fetchSharingCodesWithSteamId3(oldProfile.id);
			// If the value was in the cache then log 1
			siteMetrics.log('cache_get_profile', 1);
			return oldProfile;
		}

		// If the value was not in the cache then log 0
		siteMetrics.log('cache_get_profile', 0);
		const profile: CsgoProfile = await this.buildProfile(id);
		fetchSharingCodesWithSteamId3(profile.id);
		return profile;
	}

	async getProfileWithLink(link: string): Promise<CsgoProfile> {
		if (link.endsWith('/')) {
			link = link.substr(0, link.length - 1);
		}

		const player: DBCsgoPlayer = await knex<DBCsgoPlayer>('csgo_players').where({ steam_link: link }).first();

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
			.filter((user) => user.name.toLowerCase().startsWith(name.toLowerCase()))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * This will return 9 profiles that've been built. These are the 9 profiles with the most
	 * matches saved.
	 */
	getBuiltProfiles(): BuiltProfile[] {
		const sortedProfiles: CsgoProfile[] = this.profiles.sort((a, b) => a.matchesPlayed - b.matchesPlayed).reverse();
		const profilesWithMostMatches: CsgoProfile[] = sortedProfiles.slice(0, 8);
		const builtProfiles: BuiltProfile[] = profilesWithMostMatches.map(
			(profile): BuiltProfile => {
				return {
					id: profile.id,
					avatarLink: profile.avatarLink,
					matchesCount: profile.matchesPlayed,
					name: profile.name,
					steamLink: profile.steamLink,
				};
			},
		);

		return builtProfiles;
	}

	async getPlayerStatistics(playerId: string, type: string, soloQueue: boolean): Promise<number[]> {
		let stats: DBPlayerStatsWithMatch[] = await db.getCsgoPlayerStatsWithMatches(playerId);

		if (soloQueue) {
			const soloQueueMatches: number[] = await this.getSoloQueueMatches(playerId);
			stats = stats.filter((stat) => soloQueueMatches.includes(stat.match_id));
		}

		const sortedDates: DBPlayerStatsWithMatch[] = stats.sort((a, b) => a.date - b.date).reverse();

		switch (type) {
			case 'kills':
				return sortedDates.map((stat) => stat.kills);

			case 'deaths':
				return sortedDates.map((stat) => stat.deaths);

			case 'hsp':
				return sortedDates.map((stat) => stat.hsp);

			case 'mvps':
				return sortedDates.map((stat) => stat.mvps);

			case 'score':
				return sortedDates.map((stat) => stat.score);

			case 'ping':
				return sortedDates.map((stat) => stat.ping);

			case 'assists':
				return sortedDates.map((stat) => stat.assists);

			default:
				return [];
		}
	}

	async addMatchSharingCode(
		profileLink: string,
		authenticationCode: string,
		knownCode: string,
	): Promise<SteamLinkResponse> {
		return linkAccount(profileLink, authenticationCode, knownCode);
	}

	private async rebuildProfilesWithMostMatches(): Promise<CsgoProfile[]> {
		const sortedProfiles: CsgoProfile[] = this.profiles.sort((a, b) => a.matchesPlayed - b.matchesPlayed).reverse();
		const profilesWithMostMatches: CsgoProfile[] = sortedProfiles.slice(0, 8);

		const refreshedProfiles: CsgoProfile[] = [];
		for (const profile of profilesWithMostMatches) {
			const newProfile: CsgoProfile = await this.buildProfile(profile.id);
			refreshedProfiles.push(newProfile);
		}

		return refreshedProfiles;
	}

	private async buildProfile(id: string): Promise<CsgoProfile> {
		siteMetrics.time('build_profile');
		const player: DBCsgoPlayer = await db.getCsgoPlayer(id);
		if (player === undefined) {
			return undefined;
		}

		const dbMatches: DBPlayerStatsWithMatch[] = await db.getCsgoPlayersWithMatches();
		const userGames: DBPlayerStatsWithMatch[] = dbMatches.filter((match) => match.player_id === id);

		const tenBestDbMatches: DBPlayerStatsWithMatch[] = this.bestTenGamesInARow(userGames);
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

		const mapStatistics: MapStatistics = await this.getPlayerMapStatistics(id);
		const matchFrequency: DateMatches[] = await this.getPlayerMatchFrequency(id);

		const profile: CsgoProfile = {
			name,
			id,
			steamLink,
			avatarLink,
			matchesPlayed,
			won,
			lost,
			tied,
			mapStatistics,
			gameAverages: gameData.averages,
			gameHighest: gameData.highest,
			mapStats: gameData.mapStats,
			tenBestGames: tenBestCsgoGames,
			dateMatches: matchFrequency,
		};

		this.profiles.push(profile);
		siteMetrics.timeEnd('build_profile');
		return profile;
	}

	async getMatch(matchId: number): Promise<CsgoMatch> {
		const cachedMatch: CsgoMatch = this.csgoMatchCache.get(matchId.toString());
		if (cachedMatch !== undefined) {
			// If the value was in the cache then log 1
			siteMetrics.log('cache_get_match', 1);
			return cachedMatch;
		}
		// If the value was not in the cache then log 0
		siteMetrics.log('cache_get_match', 0);

		const game: CsgoMatch = await this.getMatchFromDB(matchId);
		this.csgoMatchCache.insert(matchId.toString(), game);

		return game;
	}

	async getPlayerMatchFrequency(playerId: string): Promise<DateMatches[]> {
		siteMetrics.time('get_player_match_frequency');
		const cachedMatchFrequency: DateMatches[] = this.csgoMatchFrequency.get(playerId);
		if (cachedMatchFrequency !== undefined) {
			// If the value was in the cache then log 1
			siteMetrics.log('cache_player_match_frequency', 1);
			siteMetrics.timeEnd('get_player_match_frequency');
			return cachedMatchFrequency;
		}
		// If the value was not in the cache then log 0
		siteMetrics.log('cache_player_match_frequency', 0);

		// This will most likely be cached so I don't really need to think about this
		const matches: DBPlayerStatsWithMatch[] = await db.getCsgoPlayerStatsWithMatches(playerId);

		// Find the player's earliest game. This'll be used for creating all dates between the first match
		// and the last match the player has played (that I know of).
		const earliestDate: number = matches
			.map((match) => match.date)
			.reduce((prev, curr) => (curr < prev ? (prev = curr) : prev));

		const allDates: Date[] = getAllDatesBetweenTwoDates(new Date(earliestDate), new Date(new Date()));

		const matchesPerDate: Map<number, DateMatches> = new Map();
		for (const date of allDates) {
			matchesPerDate.set(date.getTime(), {
				matches: 0,
				date: date.getTime(),
			});
		}

		for (const match of matches) {
			const matchRealDate: Date = new Date(match.date);

			const roundedDate: Date = new Date(0);
			roundedDate.setFullYear(matchRealDate.getFullYear());
			roundedDate.setMonth(matchRealDate.getMonth());
			roundedDate.setDate(matchRealDate.getDate());

			const oldMatchCount: DateMatches = matchesPerDate.get(roundedDate.getTime());
			oldMatchCount.matches += 1;
			matchesPerDate.set(roundedDate.getTime(), oldMatchCount);
		}

		const dateMatches: DateMatches[] = [];
		for (const dateMatch of matchesPerDate.values()) {
			dateMatches.push(dateMatch);
		}
		const sortedDates: DateMatches[] = dateMatches.sort((a, b) => a.date - b.date);

		this.csgoMatchFrequency.insert(playerId, dateMatches);
		siteMetrics.timeEnd('get_player_match_frequency');
		return sortedDates;
	}

	async getMatchFromDB(matchId: number): Promise<CsgoMatch> {
		const dbMatch: DBCsgoMatch = await db.getCsgoMatch(matchId);
		const dbPlayers: DBPlayerStatsWithPlayerInfo[] = await db.getCsgoPlayersInAMatch(dbMatch.id);

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
					unnecessaryStats:
						dbPlayer.unnecessary_stats !== undefined && dbPlayer.unnecessary_stats !== null
							? JSON.parse(dbPlayer.unnecessary_stats)
							: undefined,
				};
			},
		);

		const game: CsgoMatch = {
			date: dbMatch.date,
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

	async addDataFromExtension(matches: ExtensionMatch[], code: string): Promise<ExtensionSaveResponse> {
		const response: ExtensionSaveResponse = await this.extension.saveMatches(matches, code);

		this.invalidateCaches();
		return response;
	}

	getExtension() {
		return this.extension;
	}

	async getPlayerMatches(playerId: string, page: number): Promise<GameWithStats[]> {
		siteMetrics.time('get_player_matches');
		const games: DBPlayerStatsWithMatch[] = await this.getPlayerStatsWithGames(playerId, page);

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

		siteMetrics.timeEnd('get_player_matches');
		return gamesWithStats;
	}

	async getPlayerMapStatistics(playerId: string): Promise<MapStatistics> {
		siteMetrics.time('get_player_map_statistics');
		const cachedMapStatistics: MapStatistics = this.csgoMapStatisticsCache.get(playerId);
		if (cachedMapStatistics !== undefined) {
			// If the value was in the cache then log 1
			siteMetrics.log('cache_map_statistics_lookup', 1);
			siteMetrics.timeEnd('get_player_map_statistics');
			return cachedMapStatistics;
		}
		// If the value was not in the cache then log 0
		siteMetrics.log('cache_map_statistics_lookup', 0);

		const dbGames: DBPlayerStatsWithMatch[] = await db.getCsgoPlayerStatsWithMatches(playerId);
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
		this.csgoMapStatisticsCache.insert(playerId, statistics);
		siteMetrics.timeEnd('get_player_map_statistics');

		return statistics;
	}

	private async getPlayerStatsWithGames(playerId: string, page: number): Promise<DBPlayerStatsWithMatch[]> {
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
			.orderBy('csgo_games.date', 'desc');

		return dbGames;
	}

	async getLeaderboards(): Promise<CsgoPlayer[]> {
		if (this.csgoLeaderboardCache.length !== 0) {
			return this.csgoLeaderboardCache.map((dbPlayer) => {
				return {
					assists: dbPlayer.assists,
					avatar: dbPlayer.avatar_link,
					deaths: dbPlayer.deaths,
					hsp: dbPlayer.hsp,
					kills: dbPlayer.kills,
					mvps: dbPlayer.mvps,
					name: dbPlayer.name,
					ping: dbPlayer.ping,
					playerId: dbPlayer.player_id,
					score: dbPlayer.score,
					side: dbPlayer.side,
					steamLink: dbPlayer.steam_link,
				};
			});
		}

		const csgoPlayersWithStats: DBPlayerStatsWithPlayerInfo[] = await db.getCsgoPlayersWithStats();
		const leaderboard: DBPlayerStatsWithPlayerInfo[] = csgoPlayersWithStats
			.sort((a, b) => a.score - b.score)
			.reverse()
			.slice(0, 100);

		this.csgoLeaderboardCache = leaderboard;
		return leaderboard.map((dbPlayer) => {
			return {
				assists: dbPlayer.assists,
				avatar: dbPlayer.avatar_link,
				deaths: dbPlayer.deaths,
				hsp: dbPlayer.hsp,
				kills: dbPlayer.kills,
				mvps: dbPlayer.mvps,
				name: dbPlayer.name,
				ping: dbPlayer.ping,
				playerId: dbPlayer.player_id,
				score: dbPlayer.score,
				side: dbPlayer.side,
				steamLink: dbPlayer.steam_link,
			};
		});
	}

	private getGameData(dbGames: DBPlayerStatsWithMatch[]): GameData {
		const killStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.kills));
		const deathStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.deaths));
		const assistStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.assists));
		const hspStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.hsp));
		const mvpStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.mvps));
		const scoreStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.score));
		const pingStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.ping));
		const waitStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.wait_time));
		const lengthStandards = this.getStandardDeviationAndError(dbGames.map((game) => game.match_duration));

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
		const fields = ['assists', 'deaths', 'hsp', 'kills', 'mvps', 'ping', 'score'];

		for (const dbGame of dbGames) {
			for (const field of fields) {
				totalData[field].value += dbGame[field];

				if (highestData[field].value < dbGame[field]) {
					highestData[field].value = dbGame[field];
					highestData[field].matchId = dbGame['match_id'];
				}
			}

			const { wait_time, match_duration, map } = dbGame;
			const realWaitTime: number = wait_time === -1 ? 0 : wait_time;

			totalData.waitTime.value += realWaitTime;
			totalData.matchDuration.value += match_duration;

			if (highestData.waitTime.value < realWaitTime) {
				highestData.waitTime.value = realWaitTime;
				highestData.waitTime.matchId = dbGame['match_id'];
			}

			if (highestData.matchDuration.value < match_duration) {
				highestData.matchDuration.value = match_duration;
				highestData.matchDuration.matchId = dbGame['match_id'];
			}

			let mapData: CsgoMapStats = mapStats.find((oldMap) => oldMap.name === map);

			if (mapData === undefined) {
				mapData = {
					name: map,
					averageMatchDuration: 0,
					averageWaitTime: 0,
					timesPlayed: 0,
				};
			}

			mapData.averageMatchDuration += match_duration;
			mapData.averageWaitTime += realWaitTime;
			mapData.timesPlayed++;

			if (mapData.timesPlayed === 1) {
				mapStats.push(mapData);
			}
		}

		return {
			highest: highestData,
			averages: {
				assists: {
					value: totalData.assists.value / dbGames.length,
					standardDeviation: assistStandards.standardDeviation,
					standardError: assistStandards.standardError,
				},
				deaths: {
					value: totalData.deaths.value / dbGames.length,
					standardDeviation: deathStandards.standardDeviation,
					standardError: deathStandards.standardError,
				},
				hsp: {
					value: totalData.hsp.value / dbGames.length,
					standardDeviation: hspStandards.standardDeviation,
					standardError: hspStandards.standardError,
				},
				kills: {
					value: totalData.kills.value / dbGames.length,
					standardDeviation: killStandards.standardDeviation,
					standardError: killStandards.standardError,
				},
				matchDuration: {
					value: totalData.matchDuration.value / dbGames.length,
					standardDeviation: lengthStandards.standardDeviation,
					standardError: lengthStandards.standardError,
				},
				waitTime: {
					value: totalData.waitTime.value / dbGames.length,
					standardDeviation: waitStandards.standardDeviation,
					standardError: waitStandards.standardError,
				},
				mvps: {
					value: totalData.mvps.value / dbGames.length,
					standardDeviation: mvpStandards.standardDeviation,
					standardError: mvpStandards.standardError,
				},
				ping: {
					value: totalData.ping.value / dbGames.length,
					standardDeviation: pingStandards.standardDeviation,
					standardError: pingStandards.standardError,
				},
				score: {
					value: totalData.score.value / dbGames.length,
					standardDeviation: scoreStandards.standardDeviation,
					standardError: scoreStandards.standardError,
				},
			},
			mapStats: mapStats.map(
				(map): CsgoMapStats => {
					return {
						averageMatchDuration: map.averageMatchDuration / map.timesPlayed,
						averageWaitTime: map.averageWaitTime / map.timesPlayed,
						name: map.name,
						timesPlayed: map.timesPlayed,
					};
				},
			),
		};
	}

	private bestTenGamesInARow(games: DBPlayerStatsWithMatch[]): DBPlayerStatsWithMatch[] {
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

	private async getSoloQueueMatches(steamId: string): Promise<number[]> {
		if (this.csgoPlayerSoloQueueCache.has(steamId)) {
			return this.csgoPlayerSoloQueueCache.get(steamId);
		}

		const userGamesIds: number[] = await db.getCsgoPlayerMatchIds(steamId);

		const players: Map<string, number> = new Map();
		const soloQueueMatches: number[] = [];

		for (const matchId of userGamesIds) {
			const match: CsgoMatch = await this.getMatch(matchId);

			let soloQueue: boolean = true;

			for (const player of match.players) {
				if (player.playerId === steamId) {
					continue;
				}

				if (players.has(player.playerId)) {
					soloQueue = false;
					break;
				}

				players.set(player.playerId, 1);
			}

			if (soloQueue) {
				soloQueueMatches.push(matchId);
			}
		}

		this.csgoPlayerSoloQueueCache.set(steamId, soloQueueMatches);
		return soloQueueMatches;
	}

	private getStandardDeviationAndError(nums: number[]): { standardDeviation: number; standardError: number } {
		const mean: number = nums.reduce((prev, curr) => (prev += curr)) / nums.length;
		const calc: number[] = nums.map((x) => Math.pow(x - mean, 2));
		const meanDifference: number = (1 / nums.length) * calc.reduce((prev, curr) => (prev += curr));
		const standardDeviation: number = Math.sqrt(meanDifference);
		const standardError: number = standardDeviation / Math.sqrt(nums.length);

		return {
			standardDeviation: standardDeviation,
			standardError: standardError,
		};
	}

	/**
	 * This invalidates all caches when new data is received from the extension. In reality I shouldn't need to
	 * clear all the caches but this will happen so infrequently that building new data isn't going to be a
	 * problem.
	 */
	invalidateCaches() {
		this.csgoMapStatisticsCache.clear();
		this.csgoMatchFrequency.clear();
		this.csgoPlayerSoloQueueCache.clear();
		this.csgoLeaderboardCache = [];

		this.clearProfiles();
	}

	private async clearProfiles() {
		const newProfiles: CsgoProfile[] = await this.rebuildProfilesWithMostMatches();
		this.profiles = [];
		this.profiles = newProfiles;
	}
}

export default Steam;
