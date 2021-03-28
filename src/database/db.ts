import { Client, Guild, TextChannel } from 'discord.js';
import * as fs from 'fs';
import Clips from '../clips/clips';
import {
	DBCsgoMatch,
	DBCsgoPlayer,
	DBCsgoStats,
	DBPlayerStatsWithMatch,
	DBPlayerStatsWithPlayerInfo,
	DBUploadedCsgoMatch,
} from '../db/types';
import { knex } from '../db/utils';
import RRSG from '../randomReadableStringGenerator';
import { logCacheHit, logCacheMiss } from '../utils';
import ClipsDB from './clipsDB';
import ImgDB from './imgDB';
import QuoteDB from './quoteDB';
import { DBConfig, DB_CONFIG_FILE, DB_DATA_DIR } from './types';

class DB {
	changeUsernameEvent: (username: string, video?: string) => void;

	private quoteDB: QuoteDB;
	private imgDB: ImgDB;
	private rrsg: RRSG;
	private clips: Clips;
	private clipsDB: ClipsDB;

	private config: DBConfig;

	private csgoPlayerCache: DBCsgoPlayer[];
	private csgoPlayersWithMatchesCache: DBPlayerStatsWithMatch[];
	private csgoMatchCache: DBCsgoMatch[];
	private csgoPlayersWithStatsCache: DBPlayerStatsWithPlayerInfo[];
	private csgoStatsCache: DBCsgoStats[];

	private csgoMatchWithPlayersCache: Map<number, DBPlayerStatsWithPlayerInfo[]>;
	private csgoPlayerMatchIds: Map<string, number[]>;

	constructor() {
		this.quoteDB = new QuoteDB();
		this.imgDB = new ImgDB();
		this.rrsg = new RRSG();
		this.clips = new Clips(this);
		this.clipsDB = new ClipsDB();

		this.config = {};

		this.csgoPlayerCache = [];
		this.csgoPlayersWithMatchesCache = [];
		this.csgoMatchCache = [];
		this.csgoPlayersWithStatsCache = [];
		this.csgoStatsCache = [];

		this.csgoMatchWithPlayersCache = new Map();
		this.csgoPlayerMatchIds = new Map();
	}

	setup(channel: TextChannel) {
		const { guild } = channel;
		this.config.guild = guild;

		this.writeToDisk();
	}

	updateGuild(client: Client) {
		if (this.config.guild === undefined) {
			return;
		}

		this.config.guild = client.guilds.cache.get(this.config.guild.id);
	}

	getGuild(): Guild {
		return this.config.guild;
	}

	getQuoteDB(): QuoteDB {
		return this.quoteDB;
	}

	getImgDB(): ImgDB {
		return this.imgDB;
	}

	getRRSG(): RRSG {
		return this.rrsg;
	}

	getClips(): Clips {
		return this.clips;
	}

	getClipsDB(): ClipsDB {
		return this.clipsDB;
	}

	load() {
		if (!fs.existsSync(DB_DATA_DIR)) {
			fs.mkdirSync(DB_DATA_DIR);
			return;
		}

		if (!fs.existsSync(`${DB_DATA_DIR}/${DB_CONFIG_FILE}`)) {
			this.writeToDisk();
		} else {
			const configString: string = fs.readFileSync(`${DB_DATA_DIR}/${DB_CONFIG_FILE}`, 'utf-8');
			this.config = JSON.parse(configString);
		}

		this.quoteDB.load();
		this.rrsg.load();
		this.clips.setup();
	}

	async findOldCsgoMatch(map: string, date: number, matchDuration: number): Promise<DBCsgoMatch> {
		if (this.csgoMatchCache.length !== 0) {
			const oldMatch: DBCsgoMatch = this.csgoMatchCache.find(
				(match) => match.map === map && match.date === date && match.match_duration === matchDuration,
			);

			logCacheHit('cache_db_find_old_csgo_match');
			return oldMatch;
		}

		const oldMatch: DBCsgoMatch = await knex<DBCsgoMatch>('csgo_games')
			.where({
				match_duration: matchDuration,
				map,
				date,
			})
			.first();

		logCacheMiss('cache_db_find_old_csgo_match');
		return oldMatch;
	}

	async getCsgoPlayerMatchIds(steamId: string): Promise<number[]> {
		if (this.csgoPlayerMatchIds.has(steamId)) {
			logCacheHit('cache_db_get_csgo_player_match_ids');
			return this.csgoPlayerMatchIds.get(steamId);
		}

		logCacheMiss('cache_db_get_csgo_player_match_ids');
		if (this.csgoPlayersWithStatsCache.length === 0) {
			await this.getCsgoPlayersWithStats();
		}

		const ids: number[] = this.csgoPlayersWithStatsCache
			.filter((stats) => stats.player_id === steamId)
			.map((stats) => stats.match_id);

		this.csgoPlayerMatchIds.set(steamId, ids);
		return ids;
	}

	async getCsgoStats(): Promise<DBCsgoStats[]> {
		if (this.csgoStatsCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_stats');
			return this.csgoStatsCache;
		}
		logCacheMiss('cache_db_get_csgo_stats');

		const csgoStats: DBCsgoStats[] = await knex<DBCsgoStats>('csgo_stats').where({});

		this.csgoStatsCache = csgoStats;
		return csgoStats;
	}

	async getPlayerCsgoStats(playerId: string): Promise<DBCsgoStats[]> {
		if (this.csgoStatsCache.length !== 0) {
			logCacheHit('cache_db_get_player_csgo_stats');
			return this.csgoStatsCache.filter((stat) => stat.player_id === playerId);
		}
		logCacheMiss('cache_db_get_player_csgo_stats');

		const dbStats: DBCsgoStats[] = await knex<DBCsgoStats>('csgo_stats').where({ player_id: playerId });

		return dbStats;
	}

	async getCsgoPlayersInAMatch(matchId: number): Promise<DBPlayerStatsWithPlayerInfo[]> {
		// First check if the match key/value cache contains the matchId, if it does we can
		// return from it
		if (this.csgoMatchWithPlayersCache.has(matchId)) {
			logCacheHit('cache_db_get_csgo_players_in_a_match');
			return this.csgoMatchWithPlayersCache.get(matchId);
		}

		// Next check if all csgo players with their stats are cached. This will be true if getCsgoPLayerWithStats() have been
		// called atleast once.
		if (this.csgoPlayersWithStatsCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_players_in_a_match');
			const players: DBPlayerStatsWithPlayerInfo[] = this.csgoPlayersWithStatsCache.filter(
				(player) => player.match_id === matchId,
			);

			// Add the match to the match with players cache for quick look up
			this.csgoMatchWithPlayersCache.set(matchId, players);
			return players;
		}

		logCacheMiss('cache_db_get_csgo_players_in_a_match');

		// Finally if we didn't hit any caches retrieve the data from the database and cache it
		const dbPlayers: DBPlayerStatsWithPlayerInfo[] = await knex<DBPlayerStatsWithPlayerInfo>('csgo_players')
			.select('*')
			.innerJoin('csgo_stats', function () {
				this.on('csgo_stats.player_id', '=', 'csgo_players.id').andOn(
					'csgo_stats.match_id',
					'=',
					knex.raw(matchId),
				);
			});

		this.csgoMatchWithPlayersCache.set(matchId, dbPlayers);
		return dbPlayers;
	}

	async getCsgoPlayersWithStats(): Promise<DBPlayerStatsWithPlayerInfo[]> {
		if (this.csgoPlayersWithStatsCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_players_with_stats');
			return this.csgoPlayersWithStatsCache;
		}

		logCacheMiss('cache_db_get_csgo_players_with_stats');
		const dbPlayers: DBPlayerStatsWithPlayerInfo[] = await knex<DBPlayerStatsWithPlayerInfo>('csgo_players')
			.select('*')
			.innerJoin('csgo_stats', function () {
				this.on('csgo_stats.player_id', '=', 'csgo_players.id');
			});

		this.csgoPlayersWithStatsCache = dbPlayers;
		return dbPlayers;
	}

	async getMatchUploadedByUser(matchId: number, playerId: string): Promise<DBUploadedCsgoMatch> {
		logCacheMiss('cache_db_get_match_uploaded_by_user');
		const game: DBUploadedCsgoMatch = await knex<DBUploadedCsgoMatch>('csgo_games_uploads')
			.where({ match_id: matchId, player_id: playerId })
			.first();

		return game;
	}

	/**
	 * First checks if the match is cached, if it isn't then retrieves it from the database.
	 *
	 * @param matchId id of the match you want to get
	 */
	async getCsgoMatch(matchId: number): Promise<DBCsgoMatch> {
		if (this.csgoMatchCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_match');
			return this.csgoMatchCache.find((match) => match.id === matchId);
		}

		logCacheMiss('cache_db_get_csgo_match');
		// If there aren't any matches cached we need to look for it in the database.
		const dbMatch: DBCsgoMatch = await knex<DBCsgoMatch>('csgo_games').where({ id: matchId }).first();
		return dbMatch;
	}

	/**
	 * Returns either a cached version of all csgo matches or retrieves them from the database.
	 */
	async getCsgoMatches(): Promise<DBCsgoMatch[]> {
		if (this.csgoMatchCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_matches');
			return this.csgoMatchCache;
		}

		logCacheMiss('cache_db_get_csgo_matches');
		const dbMatches: DBCsgoMatch[] = await knex<DBCsgoMatch>('csgo_games').where({});

		this.csgoMatchCache = dbMatches;
		return dbMatches;
	}

	async getCsgoPlayerStatsWithMatches(playerId: string): Promise<DBPlayerStatsWithMatch[]> {
		if (this.csgoPlayersWithMatchesCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_player_stats_with_matches');
			return this.csgoPlayersWithMatchesCache.filter((player) => player.player_id === playerId);
		}

		logCacheMiss('cache_db_get_csgo_player_stats_with_matches');
		const dbGames: DBPlayerStatsWithMatch[] = await knex('csgo_stats').innerJoin('csgo_games', function () {
			this.on('csgo_games.id', '=', 'csgo_stats.match_id').andOn('csgo_stats.player_id', '=', knex.raw(playerId));
		});

		return dbGames;
	}

	/**
	 * Returns either a cached version of the player stats with matches or retrieves them from the
	 * database.
	 */
	async getCsgoPlayersWithMatches(): Promise<DBPlayerStatsWithMatch[]> {
		// If the players are already cached we can just return from cache. They'll be cached 99% of the time
		// because we only invalidate the cache if new data is inserted frmo the extension which happens really
		// infrequently.
		if (this.csgoPlayersWithMatchesCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_players_with_matches');
			return this.csgoPlayersWithMatchesCache;
		}

		logCacheMiss('cache_db_get_csgo_players_with_matches');
		const dbGames: DBPlayerStatsWithMatch[] = await knex('csgo_stats')
			.join('csgo_games', 'csgo_games.id', 'csgo_stats.match_id')
			.select('*');
		this.csgoPlayersWithMatchesCache = dbGames;

		return dbGames;
	}

	/**
	 * Returns either a cached version of the stats or retrieves them from the database.
	 *
	 * @param playerId The id of the player whos stats you want to get
	 * @param matchId Id of a match the player was in
	 */
	async getPlayerStatsInAMatch(playerId: string, matchId: number): Promise<DBCsgoStats> {
		if (this.csgoStatsCache.length !== 0) {
			logCacheHit('cache_db_get_players_stats_in_a_match');
			return this.csgoStatsCache.find((stats) => stats.player_id === playerId && stats.match_id === matchId);
		}

		logCacheMiss('cache_db_get_players_stats_in_a_match');
		const stats: DBCsgoStats = await knex<DBCsgoStats>('csgo_stats')
			.where({
				player_id: playerId,
				match_id: matchId,
			})
			.first();

		return stats;
	}

	/**
	 * Returns either a cached version of the player or retrieves it from the database
	 *
	 * @param id The id of the player you want to find
	 */
	async getCsgoPlayer(id: string): Promise<DBCsgoPlayer> {
		// Because we cache all the players that are in the database we can assume that if the player would be in
		// the database and the data is cached we can just find it in the cache.
		if (this.csgoPlayerCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_players');
			return this.csgoPlayerCache.find((player) => player.id === id);
		}

		logCacheMiss('cache_db_get_csgo_players');
		// If there isn't any player data cached get the player from the database. Note this does not cache
		// anything.
		const player: DBCsgoPlayer = await knex<DBCsgoPlayer>('csgo_players').where({ id }).first();

		return player;
	}

	/**
	 * Returns either a cached version of all the players or retrieves them from the database. Once this
	 * is called you can assume that the players will be returned from cache.
	 */
	async getCsgoPlayers(): Promise<DBCsgoPlayer[]> {
		if (this.csgoPlayerCache.length !== 0) {
			logCacheHit('cache_db_get_csgo_players');
			return this.csgoPlayerCache;
		}

		logCacheMiss('cache_db_get_csgo_players');
		const players: DBCsgoPlayer[] = await knex<DBCsgoPlayer>('csgo_players').where({});
		this.csgoPlayerCache = players;

		return players;
	}

	/**
	 * Clears all CSGO RELATED caches. This should be called everytime new data is inserted from
	 * the csgo extension. The data will be like 10000/1 read/write so I can just cache them again
	 * when a request comes in.
	 */
	clearCsgoCaches() {
		this.csgoPlayerCache = [];
		this.csgoMatchCache = [];
		this.csgoPlayersWithMatchesCache = [];
		this.csgoPlayersWithStatsCache = [];
		this.csgoStatsCache = [];
		this.csgoPlayerMatchIds.clear();
	}

	private writeToDisk() {
		fs.writeFileSync(`${DB_DATA_DIR}/${DB_CONFIG_FILE}`, JSON.stringify(this.config));
	}
}

export default DB;
