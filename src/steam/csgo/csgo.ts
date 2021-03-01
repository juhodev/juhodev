import { db, siteMetrics } from '../..';
import { Match, Player } from '../../api/routes/demoworker/types';
import LFUCache from '../../cache/LFUCache';
import { DBCsgoMatch, DBCsgoPlayer, DBPlayerStatsWithPlayerInfo } from '../../db/types';
import { knex } from '../../db/utils';
import { fetchSharingCodesWithSteamId3 } from '../matchsharing/matchSharing';
import { BuiltProfile, CsgoProfile, CsgoUser, SteamUser } from '../types';
import CsgoPlayer from './csgoPlayer';
import { CsgoMatch, PlayerStatistics, Side } from './types';

class Csgo {
	private matches: Map<number, CsgoMatch>;

	// This might need to be replaced with an LFU cache if the player
	// base grows too big but I doubt that'll happen
	private players: Map<string, CsgoPlayer>;

	private csgoProfiles: LFUCache<CsgoProfile>;

	constructor() {
		this.matches = new Map();
		this.players = new Map();
		this.csgoProfiles = new LFUCache(512);
	}

	search(query: string): CsgoUser[] {
		if (query.length < 2) {
			return [];
		}

		const filteredPlayers: CsgoUser[] = [];
		for (const player of this.players.entries()) {
			if (player[1].name.toLowerCase().startsWith(query.toLowerCase())) {
				filteredPlayers.push({ name: player[1].name, id: player[1].id });
			}
		}

		return filteredPlayers;
	}

	async load() {
		console.log('loading players');
		siteMetrics.time('csgo_load');

		const stats: DBPlayerStatsWithPlayerInfo[] = await db.getCsgoPlayersWithStats();
		for (const row of stats) {
			let player: CsgoPlayer;
			if (this.players.has(row.player_id)) {
				player = this.players.get(row.player_id);
			} else {
				player = new CsgoPlayer(row.player_id, row.steam_link, row.avatar_link, row.name, []);
				this.players.set(player.id, player);
			}

			let match: CsgoMatch;
			if (this.matches.has(row.match_id)) {
				match = this.matches.get(row.match_id);
			} else {
				const dbMatch: DBCsgoMatch = await db.getCsgoMatch(row.match_id);
				if (dbMatch === undefined) {
					continue;
				}

				match = {
					ctRounds: dbMatch.ct_rounds,
					date: dbMatch.date,
					id: dbMatch.id,
					map: dbMatch.map,
					matchDuration: dbMatch.match_duration,
					tRounds: dbMatch.t_rounds,
					waitTime: dbMatch.wait_time,
					winner: dbMatch.winner as Side,
					players: [],
				};
				this.matches.set(match.id, match);
			}

			match.players.push({
				kills: row.kills,
				assists: row.assists,
				deaths: row.deaths,
				hsp: row.hsp,
				mvps: row.mvps,
				ping: row.ping,
				player: {
					id: player.id,
					name: player.name,
					steamLink: player.steamLink,
					avatarLink: player.avatarLink,
				},
				score: row.score,
				side: row.side as Side,
				unnecessaryStats: row.unnecessary_stats !== undefined ? JSON.parse(row.unnecessary_stats) : undefined,
			});

			player.addMatch(match);
		}

		siteMetrics.timeEnd('csgo_load');
	}

	getPlayer(id: string): CsgoPlayer {
		return this.players.get(id);
	}

	getMatch(id: number): CsgoMatch {
		return this.matches.get(id);
	}

	getTopProfilePreviews(): BuiltProfile[] {
		const array: CsgoPlayer[] = [...this.players.entries()].map((x) => x[1]);
		const sorted: CsgoPlayer[] = array.sort((a, b) => b.getMatchesPlayed() - a.getMatchesPlayed());

		return sorted.slice(0, 10).map(
			(player): BuiltProfile => {
				return {
					id: player.id,
					name: player.name,
					avatarLink: player.avatarLink,
					matchesCount: player.getMatchesPlayed(),
					steamLink: player.steamLink,
				};
			},
		);
	}

	getUser(id: string): SteamUser {
		const player: CsgoPlayer = this.players.get(id);

		return {
			avatar: player.avatarLink,
			name: player.name,
			steamId: player.id,
			steamLink: player.steamLink,
		};
	}

	getProfile(id: string): CsgoProfile {
		const profile: CsgoProfile = this.csgoProfiles.get(id);
		if (profile !== undefined) {
			fetchSharingCodesWithSteamId3(profile.id);
			return profile;
		}

		const player: CsgoPlayer = this.players.get(id);
		if (player === undefined) {
			return undefined;
		}

		const createdProfile: CsgoProfile = {
			name: player.name,
			id: player.id,
			avatarLink: player.avatarLink,
			steamLink: player.steamLink,
			won: player.getMatchesWon(),
			lost: player.getMatchesLost(),
			tied: player.getMatchesTied(),
			matchesPlayed: player.getMatchesPlayed(),
			mapStatistics: player.getMapStatistics(),
			gameAverages: player.getAverageStatistics(),
			gameHighest: player.getHighestStatistics(),
			dateMatches: player.getMatchFrequency(),
		};

		fetchSharingCodesWithSteamId3(createdProfile.id);
		this.csgoProfiles.insert(id, createdProfile);
		return createdProfile;
	}

	async getByUrl(url: string): Promise<CsgoProfile> {
		const dbPlayer: DBCsgoPlayer = await knex<DBCsgoPlayer>('csgo_players').where({ steam_link: url }).first();

		if (dbPlayer === undefined || dbPlayer === null) {
			return undefined;
		}

		return this.getProfile(dbPlayer.id);
	}

	/**
	 * This updates the in memory cache of all the stats when a new match is received from
	 * a demo worker. The demo worker only updates the database so I need to do this
	 * in order to keep everything up-to-date.
	 *
	 * @param match Match received from a demo worker
	 * @param matchId The id of the match in the database. This is needed to later create links to the match
	 * @param newPlayers An array of the new players that were inserted in to the database. I pass this in here so I don't need to
	 * 					 duplicate all the logic for fetching the user avatar, etc etc
	 */
	updateWithNewMatch(match: Match, matchId: number, newPlayers: DBCsgoPlayer[]) {
		const alreadyHasMatch: boolean = this.matches.has(matchId);
		if (alreadyHasMatch) {
			return;
		}

		const csgoMatch: CsgoMatch = {
			id: matchId,
			ctRounds: match.counterTerroristTeam.score,
			tRounds: match.terroristTeam.score,
			date: match.date,
			matchDuration: match.duration,
			waitTime: -1,
			winner: match.winner as Side,
			map: match.map,
			players: [],
		};

		const playersInGame: Player[] = [...match.counterTerroristTeam.players, ...match.terroristTeam.players];
		const playerStatistics: PlayerStatistics[] = playersInGame.map((player) => {
			const { name, kills, deaths, assists, mvps, score, hsp, ping, side, unnecessaryStats, steamId3 } = player;

			const csgoPlayer: CsgoPlayer = this.findOrCreateCsgoPlayer(steamId3, newPlayers);

			return {
				name,
				kills,
				deaths,
				assists,
				mvps,
				score,
				hsp,
				ping,
				side: side as Side,
				unnecessaryStats,
				player: {
					avatarLink: csgoPlayer.avatarLink,
					id: csgoPlayer.id,
					name: csgoPlayer.name,
					steamLink: csgoPlayer.steamLink,
				},
			};
		});

		csgoMatch.players.push(...playerStatistics);
		for (const stats of playerStatistics) {
			const player: CsgoPlayer = this.players.get(stats.player.id);
			player.addMatch(csgoMatch);
		}

		this.matches.set(csgoMatch.id, csgoMatch);
	}

	/**
	 * This either finds an old player with the `id` from memory or creates a new player
	 * with the id and data from `newPlayers` and saves it to `players` map.
	 *
	 * @param id Id of the player
	 * @param newPlayers An array of the new players inserted to the database from that match
	 *
	 * @returns The `CsgoPlayer` that was either found or created
	 */
	private findOrCreateCsgoPlayer(id: string, newPlayers: DBCsgoPlayer[]): CsgoPlayer {
		let csgoPlayer: CsgoPlayer;
		if (this.players.has(id)) {
			csgoPlayer = this.players.get(id);
		} else {
			const dbPlayer: DBCsgoPlayer = newPlayers.find((x) => x.id === id);
			csgoPlayer = new CsgoPlayer(dbPlayer.id, dbPlayer.steam_link, dbPlayer.avatar_link, dbPlayer.name, []);
			this.players.set(csgoPlayer.id, csgoPlayer);
		}

		return csgoPlayer;
	}
}

export default Csgo;
