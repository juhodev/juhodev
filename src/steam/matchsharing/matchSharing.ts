import fetch from 'node-fetch';
import { DBCsgoMatch, DBCsgoPlayer, DBCsgoStats, DBMatchSharingAccount, DBMatchSharingCode } from '../../db/types';
import { knex } from '../../db/utils';
import * as SteamID from 'steamid';
import * as xml2js from 'xml2js';
import { SteamLinkResponse, SteamError } from '../../api/routes/steam/types';
import { GetNextMatchSharingCodeResponse } from './types';
import { Match, Player } from '../../api/routes/demoworker/types';
import { csgo, db } from '../..';
import { demoMaster, steam } from '../../api/server';

export async function linkAccount(
	profileLink: string,
	authenticationCode: string,
	knownCode: string,
): Promise<SteamLinkResponse> {
	const steamId64: string = await getSteamId64(profileLink);
	const steamId3: string = convertSteamId64ToSteamId3(steamId64);
	const newCode: string = await fetchNewCode(steamId64, authenticationCode, knownCode);

	if (newCode === 'AUTH_ERROR') {
		return {
			error: true,
			errorCode: SteamError.COULD_NOT_FETCH_MATCH_CODE,
		};
	}

	await saveMatchSharingAccount(steamId3, profileLink, authenticationCode, steamId64);
	await saveSharingCode(steamId3, knownCode);
	await saveSharingCode(steamId3, newCode);

	fetchUserCodes(steamId3, steamId64, authenticationCode, newCode);

	return {
		error: false,
	};
}

/**
 * Fetches the user's next match sharing code from the Steam API.
 *
 * @param steamId64 The user's steamid64
 * @param authenticationCode The user's authentication code for fetching matches
 * @param knownCode A known matching code that'll be used to get the next code
 * @returns If there is a code available then this returns the next match sharing code. If there is an authentication error then this'll return 'AUTH_ERROR'. If there is no new code available this'll return
 * 			undefined.
 */
export async function fetchNewCode(steamId64: string, authenticationCode: string, knownCode: string): Promise<string> {
	const { STEAM_API_KEY } = process.env;
	const url: string = `https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1?key=${STEAM_API_KEY}&steamid=${steamId64}&steamidkey=${authenticationCode}&knowncode=${knownCode}`;

	const response = await fetch(url);
	// If the status code is 403 the user's authentication is most likely wrong.
	if (response.status === 403) {
		return 'AUTH_ERROR';
	}

	const data: GetNextMatchSharingCodeResponse = await response.json();
	if (data.result !== undefined) {
		const { result } = data;
		// If nextcode equals to "n/a" the player hasn't played any more matches after the last sharing code.
		if (result.nextcode && result.nextcode !== 'n/a') {
			return result.nextcode;
		}
	}

	return undefined;
}

/**
 * This function gets the user's steamid64 from their steam profile page.
 *
 * I can get the profile as XML by appending '?xml=1' to the end of the UR and then I can just read
 * it from there.
 *
 * @param profileLink Link to the profile you want to save data from
 */
export async function getSteamId64(profileLink: string): Promise<string> {
	const profileXMLLink: string = `${profileLink}?xml=1`;
	console.log('fetch', profileXMLLink);
	const response = await fetch(profileXMLLink);
	console.log('done');

	if (response.status < 200 && response.status >= 300) {
		return undefined;
	}

	const page: string = await response.text();
	const obj: object = await xml2js.parseStringPromise(page);
	const steamId64: string = obj['profile']['steamID64'][0];

	return steamId64;
}

/**
 * Tries to fetch new codes for every user registered once a day.
 */
export function startUpdatingUserCodes() {
	setInterval(async () => {
		const users: DBMatchSharingAccount[] = await knex<DBMatchSharingAccount>('match_sharing_accounts').where({});

		for (const user of users) {
			await fetchCodesForUser(user);
		}
	}, 1000 * 60 * 60 * 24);
}

export async function fetchSharingCodesWithSteamId3(steamId3: string) {
	// Look for an acocunt with the steamId3. This function is most likely called when someone gets a profile
	// the steamId3 is the same that I save from the steam page when scraping.
	const registeredSteamAccount: DBMatchSharingAccount = await knex<DBMatchSharingAccount>('match_sharing_accounts')
		.where({ id: steamId3 })
		.first();

	// If there is no user with this steamid3 then we can just return because we can't fetch matches
	// without the user linking their steam account.
	if (registeredSteamAccount === undefined) {
		return;
	}

	await fetchCodesForUser(registeredSteamAccount);
}

async function fetchCodesForUser(user: DBMatchSharingAccount) {
	const lastUserMatchSharingCode: DBMatchSharingCode = await knex<DBMatchSharingCode>('match_sharing_codes')
		.orderBy('saved_at')
		.where({ player_id: user.id })
		.first();

	await fetchUserCodes(user.id, user.steamid64, user.authentication_code, lastUserMatchSharingCode.sharing_code);
}

async function fetchUserCodes(playerId: string, steamId64: string, authenticationCode: string, knownCode: string) {
	let code: string = await fetchNewCode(steamId64, authenticationCode, knownCode);

	if (code === undefined || code === 'AUTH_ERROR') {
		return;
	}

	await saveSharingCode(playerId, code);
	setTimeout(() => {
		fetchUserCodes(playerId, steamId64, authenticationCode, code);
	}, 1000);
}

function convertSteamId64ToSteamId3(steamId64: string) {
	return new SteamID(steamId64).steam3().substr(5, 9);
}

async function saveSharingCode(playerId: string, code: string) {
	const dbCode: DBMatchSharingCode = await knex<DBMatchSharingCode>('match_sharing_codes')
		.where({
			player_id: playerId,
			sharing_code: code,
		})
		.first();

	// If the code already exists in the database we don't want to save it twice. I know that this shouldn't take
	// two db calls but right now I'm feeling really lazy.
	if (dbCode !== undefined) {
		return;
	}

	await knex<DBMatchSharingCode>('match_sharing_codes').insert({
		player_id: playerId,
		sharing_code: code,
		saved_at: new Date().getTime(),
		downloaded: false,
	});

	demoMaster.process(code);
}

async function saveMatchSharingAccount(playerId: string, link: string, authenticationCode: string, steamid64: string) {
	await knex<DBMatchSharingAccount>('match_sharing_accounts').insert({
		id: playerId,
		authentication_code: authenticationCode,
		registered_at: new Date().getTime(),
		steamid64,
		link,
	});
}

/**
 * Saves a match that was received from a demo worker
 *
 * @param match Match received from a demo worker
 */
export async function saveMatch(match: Match) {
	// First insert the match in the database
	// This first looks up if the match already exists in the database. If it does I don't want to
	// insert it again.
	const oldMatch: DBCsgoMatch = await db.findOldCsgoMatch(match.map, match.date, match.duration);

	if (oldMatch !== undefined) {
		return;
	}

	const matchId: number[] = await knex<DBCsgoMatch>('csgo_games')
		.insert({
			map: match.map,
			ct_rounds: match.counterTerroristTeam.score,
			t_rounds: match.terroristTeam.score,
			match_duration: match.duration,
			uploaded_by: 'csgo',
			wait_time: -1,
			winner: match.winner,
			date: match.date,
		})
		.returning('id');

	const players: Player[] = [...match.counterTerroristTeam.players, ...match.terroristTeam.players];

	// Insert the new players as a batch later
	const newPlayers: DBCsgoPlayer[] = [];
	const newStats: DBCsgoStats[] = [];

	for (const player of players) {
		let dbPlayer: DBCsgoPlayer;

		// First check if the player is already in the database. I don't want any duplicate players (and it would give an error because
		// the steamId3 is the player's primary key).
		const oldPlayer: DBCsgoPlayer = await db.getCsgoPlayer(player.steamId3);
		if (oldPlayer !== undefined) {
			dbPlayer = oldPlayer;
		} else {
			dbPlayer = {
				id: player.steamId3,
				name: player.name,
				steam_link: `https://steamcommunity.com/profiles/${player.steamId64}`,
				avatar_link: await getUserAvatar(player.steamId64),
				uploaded_by: 'csgo',
			};

			// For whatever reason sometimes the player is twice in the final scoreboard.
			const alreadyInNewPlayers: DBCsgoPlayer = newPlayers.find((p) => p.id === dbPlayer.id);

			if (alreadyInNewPlayers !== undefined) {
				continue;
			}

			newPlayers.push(dbPlayer);
		}

		const stats: DBCsgoStats = {
			assists: player.assists,
			deaths: player.deaths,
			hsp: player.hsp,
			kills: player.kills,
			match_id: matchId[0],
			mvps: player.mvps,
			ping: player.ping,
			player_id: player.steamId3,
			score: player.score,
			side: player.side,
			uploaded_by: 'csgo',
			unnecessary_stats: JSON.stringify(player.unnecessaryStats),
		};

		newStats.push(stats);
	}

	await knex<DBCsgoPlayer>('csgo_players').insert(newPlayers);
	await knex<DBCsgoStats>('csgo_stats').insert(newStats);

	csgo.updateWithNewMatch(match, matchId[0], newPlayers);

	// I really need to write a better cache system because
	// right now I need to clear the cache every time I save new data
	db.clearCsgoCaches();
	steam.invalidateCaches();
}

async function getUserAvatar(id: string): Promise<string> {
	const profileXMLLink: string = `https://steamcommunity.com/profiles/${id}?xml=1`;
	const response = await fetch(profileXMLLink);

	if (response.status < 200 && response.status >= 300) {
		return undefined;
	}

	let obj: object = { profile: { avatarMedium: [] } };
	const page: string = await response.text();
	try {
		obj = await xml2js.parseStringPromise(page);
	} catch (e) {
		console.error(e);
	}
	return obj['profile']['avatarMedium'][0];
}
