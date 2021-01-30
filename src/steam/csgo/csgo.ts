import { db, siteMetrics } from '../..';
import LFUCache from '../../cache/LFUCache';
import { DBCsgoMatch, DBPlayerStatsWithPlayerInfo } from '../../db/types';
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
			filteredPlayers.push({ name: player[1].name, id: player[1].id });
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
		console.log('id', id);
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

		this.csgoProfiles.insert(id, createdProfile);
		return createdProfile;
	}
}

export default Csgo;
