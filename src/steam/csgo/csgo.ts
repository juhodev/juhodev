import { db, siteMetrics } from '../..';
import { DBCsgoMatch, DBPlayerStatsWithPlayerInfo } from '../../db/types';
import CsgoPlayer from './csgoPlayer';
import { CsgoMatch } from './types';

class Csgo {
	private matches: Map<number, CsgoMatch>;

	// This might need to be replaced with an LFU cache if the player
	// base grows too big but I doubt that'll happen
	private players: Map<string, CsgoPlayer>;

	constructor() {
		this.matches = new Map();
		this.players = new Map();
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
				match = {
					ctRounds: dbMatch.ct_rounds,
					date: dbMatch.date,
					id: dbMatch.id,
					map: dbMatch.map,
					matchDuration: dbMatch.match_duration,
					tRounds: dbMatch.t_rounds,
					waitTime: dbMatch.wait_time,
					winner: dbMatch.winner,
				};
				this.matches.set(match.id, match);
			}

			player.addMatch(match);
		}

		siteMetrics.timeEnd('csgo_load');
	}
}

export default Csgo;
