import * as fs from 'fs';
import * as demofile from 'demofile';
import * as xml2js from 'xml2js';
import fetch from 'node-fetch';
import { DBCsgoMatch, DBCsgoPlayer, DBCsgoStats } from '../../db/types';
import { knex } from '../../db/utils';
import { db } from '../..';

export async function saveFinalScoreboard(
	path: string,
	date: number,
): Promise<void> {
	return new Promise((resolve) => {
		console.log(`Saving demo ${path}`);
		const demoData: Buffer = fs.readFileSync(path);

		const demoFile = new demofile.DemoFile();
		const players: demofile.Player[] = [];

		demoFile.entities.on('create', (e) => {
			const { entity } = e;

			if (!(entity instanceof demofile.Player)) {
				return;
			}

			players.push(entity);
		});

		demoFile.on('error', (err) => {
			console.error(err);
			resolve();
		});

		demoFile.on('end', async () => {
			let winner: string;

			// The type is wrong in the package so this is a quick fix for the linter :)
			const ctTeamName: string = 'CT';
			const tRounds: number = demoFile.teams.find(
				(team) => team.teamName === ctTeamName,
			)?.score;
			const ctRounds: number = demoFile.teams.find(
				(team) => team.teamName === 'TERRORIST',
			)?.score;

			if (tRounds === undefined || ctRounds === undefined) {
				return;
			}

			if (tRounds === ctRounds) {
				winner = 'TIE';
			} else if (tRounds > ctRounds) {
				winner = 'T';
			} else {
				winner = 'CT';
			}

			const dbMatch: DBCsgoMatch = {
				ct_rounds: ctRounds,
				t_rounds: tRounds,
				map: changeMapName(demoFile.header.mapName),
				match_duration: Math.round(demoFile.header.playbackTime),
				uploaded_by: 'csgo',
				wait_time: -1,
				date: date * 1000, // Change to javascript timestamp
				winner,
			};

			const insertedMatch: [
				boolean,
				DBCsgoMatch,
			] = await insertMatchToDatabase(dbMatch);
			if (!insertedMatch[0]) {
				if (insertedMatch[1] === undefined) {
					console.log('inserted game was null!');
					resolve();
					return;
				}
				await savePlayers(players, insertedMatch[1].id);
				resolve();
			} else {
				resolve();
			}
		});

		demoFile.parse(demoData);
	});
}

function changeMapName(map: string): string {
	switch (map) {
		case 'de_dust2':
			return 'Dust II';

		case 'de_train':
			return 'Train';

		case 'de_mirage':
			return 'Mirage';

		case 'de_overpass':
			return 'Overpass';

		case 'de_nuke':
			return 'Nuke';

		case 'de_inferno':
			return 'Inferno';

		case 'de_ancient':
			return 'Ancient';

		case 'de_vertigo':
			return 'Vertigo';

		case 'de_cache':
			return 'Cache';

		case 'de_assult':
			return 'Assault';

		case 'cs_italy':
			return 'Italy';

		case 'de_biome':
			return 'Biome';

		case 'de_zoo':
			return 'Zoo';

		case 'de_canals':
			return 'Canals';

		case 'cs_agency':
			return 'Agency';

		case 'cs_office':
			return 'Office';

		default:
			return map;
	}
}

async function savePlayers(entities: demofile.Player[], matchId: number) {
	const newPlayers: DBCsgoPlayer[] = [];
	const newStats: DBCsgoStats[] = [];

	for (const entity of entities) {
		if (entity.userInfo.fakePlayer) {
			continue;
		}

		let player: DBCsgoPlayer;

		const oldPlayer: DBCsgoPlayer = await db.getCsgoPlayer(
			entity.userInfo.friendsId.toString(),
		);
		if (oldPlayer === undefined) {
			player = {
				id: entity.userInfo.friendsId.toString(),
				steam_link: `https://steamcommunity.com/profiles/${entity.steam64Id}`,
				avatar_link: await getUserAvatar(entity.steam64Id),
				name: entity.name,
				uploaded_by: 'csgo',
			};

			const alreadyInNewPlayers: DBCsgoPlayer = newPlayers.find(
				(p) => p.id === player.id,
			);

			if (alreadyInNewPlayers !== undefined) {
				continue;
			}

			newPlayers.push(player);
		} else {
			player = oldPlayer;
		}

		const oldStats: DBCsgoStats = await db.getPlayerStatsInAMatch(
			player.id,
			matchId,
		);
		if (oldStats === undefined) {
			const dbStats: DBCsgoStats = {
				player_id: entity.userInfo.friendsId.toString(),
				assists: entity.assists,
				deaths: entity.deaths,
				kills: entity.kills,
				mvps: entity.mvps,
				ping: 0,
				score: entity.score,
				uploaded_by: 'csgo',
				hsp: Math.round(
					(entity.matchStats
						.map((stat) => stat.headShotKills)
						.reduce((prev, curr) => (prev += curr)) /
						entity.matchStats.length) *
						100,
				),
				side: entity.team?.teamName === 'TERRORIST' ? 'T' : 'CT',
				match_id: matchId,
			};

			newStats.push(dbStats);
		}
	}

	await knex<DBCsgoPlayer>('csgo_players').insert(newPlayers);
	await knex<DBCsgoStats>('csgo_stats').insert(newStats);
	db.clearCsgoCaches();
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

/**
 * Right now I'm lazy and I copied this from `extension.ts`
 *
 * This either inserts a new match into the database or if the match is already in the database returns the
 * old id.
 *
 * @param dbMatch Match you want to insert into the database.
 * @retunrs A boolean representing whether or not the match already exists (true if the match already existed) and the match that was inserted or
 * 			was already in the database.
 */
async function insertMatchToDatabase(
	dbMatch: DBCsgoMatch,
): Promise<[boolean, DBCsgoMatch]> {
	const oldMatch: DBCsgoMatch = await db.findOldCsgoMatch(
		dbMatch.map,
		dbMatch.date,
		dbMatch.match_duration,
	);

	let matchAlreadyExists: boolean;
	let matchId: number;
	if (oldMatch === undefined) {
		matchId = await knex<DBCsgoMatch>('csgo_games')
			.insert(dbMatch)
			.returning('id');
		matchAlreadyExists = false;
	} else {
		matchId = oldMatch.id;
		matchAlreadyExists = true;
	}

	dbMatch.id = matchId;
	const matchToReturn: DBCsgoMatch =
		oldMatch === undefined ? dbMatch : oldMatch;
	return [matchAlreadyExists, matchToReturn];
}
