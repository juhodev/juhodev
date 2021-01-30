import { DBCsgoMatch, DBCsgoPlayer, DBPlayerStatsWithMatch, DBPlayerStatsWithPlayerInfo } from '../db/types';
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

class Steam {
	private profiles: CsgoProfile[];
	private csgoLeaderboardCache: DBPlayerStatsWithPlayerInfo[];
	private csgoPlayerSoloQueueCache: Map<string, number[]>;

	private extension: Extension;

	constructor() {
		this.profiles = [];
		this.csgoLeaderboardCache = [];
		this.csgoPlayerSoloQueueCache = new Map();

		this.extension = new Extension();
		startUpdatingUserCodes();
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

	async addMatchSharingCode(
		profileLink: string,
		authenticationCode: string,
		knownCode: string,
	): Promise<SteamLinkResponse> {
		return linkAccount(profileLink, authenticationCode, knownCode);
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

	async addDataFromExtension(matches: ExtensionMatch[], code: string): Promise<ExtensionSaveResponse> {
		const response: ExtensionSaveResponse = await this.extension.saveMatches(matches, code);

		this.invalidateCaches();
		return response;
	}

	getExtension() {
		return this.extension;
	}
	/**
	 * This invalidates all caches when new data is received from the extension. In reality I shouldn't need to
	 * clear all the caches but this will happen so infrequently that building new data isn't going to be a
	 * problem.
	 */
	invalidateCaches() {
		this.csgoPlayerSoloQueueCache.clear();
		this.csgoLeaderboardCache = [];
	}
}

export default Steam;
