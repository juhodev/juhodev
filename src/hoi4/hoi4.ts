import { ChildProcess, exec } from 'child_process';
import { makeId } from '../utils';
import * as path from 'path';
import * as fs from 'fs';
import { siteMetrics } from '..';
import {
	Ace,
	ActiveRelation,
	CorpsCommander,
	Country,
	Diplomacy,
	GameInfo,
	Hoi4Save,
	NavyLeader,
	PoliticalParty,
	PoliticalPartyLeader,
	Politics,
} from './types';
import { DBHoi4Game } from '../db/types';
import { knex } from '../db/utils';

async function processHoi4File(filePath: string): Promise<number> {
	const game: DBHoi4Game = await parseGame(filePath);
	const save: Hoi4Save = createGameStatistics(game.path);
	const gameId: number = await saveParsedGame(game.name, save);

	return gameId;
}

async function getGames(): Promise<GameInfo[]> {
	const dbGames: DBHoi4Game[] = await knex<DBHoi4Game>('hoi4_games').where(
		{},
	);

	return dbGames.map((game) => {
		return {
			id: game.id,
			name: game.name,
		};
	});
}

async function getGame(gameId: number): Promise<Hoi4Save> {
	const game: DBHoi4Game = await knex<DBHoi4Game>('hoi4_games')
		.where({
			id: gameId,
		})
		.first();

	const saveGame: Hoi4Save = JSON.parse(fs.readFileSync(game.path, 'utf-8'));
	return saveGame;
}

async function saveParsedGame(name: string, save: Hoi4Save): Promise<number> {
	const folderPath: string = path.resolve('data', 'hoi4');

	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}

	const savePath: string = path.resolve(folderPath, `${name}.json`);
	fs.writeFileSync(savePath, JSON.stringify(save));

	const gameId: number = await knex<DBHoi4Game>('hoi4_games')
		.insert({
			name: name,
			path: savePath,
		})
		.returning('id');

	return gameId;
}

async function parseGame(filePath: string): Promise<DBHoi4Game> {
	return new Promise((resolve) => {
		siteMetrics.time('process_hoi4_file');
		console.log(`Processing hoi4 file ${filePath}`);

		const gameName: string = `game-${makeId(8)}`;
		const outFileName: string = `hoi4/${gameName}`;
		const jarPath: string = path.resolve('hoi4', 'HOI4-1.jar');
		// I have to figure out good Xmx and Xms sizes for this (I know that it'll use a shit ton of memory so I'll just
		// start it with the Xms400M)
		// UPDATE: Ok it ran out of memory with -Xmx400M so lets not cap it and hope for the best
		const command: string = `java -jar ${jarPath} -json -file ${filePath} -out ${outFileName}`;

		const process: ChildProcess = exec(command);
		process.stderr.on('data', (data) => {
			console.log('hoi4broke', data);
		});
		process.on('exit', () => {
			const outFile: string = path.resolve(`${outFileName}.json`);
			console.log('hoi4 file processed!', outFile);
			siteMetrics.timeEnd('process_hoi4_file');
			resolve({ name: gameName, path: outFile });
		});
	});
}

function createGameStatistics(filePath: string): Hoi4Save {
	const dataStr: string = fs.readFileSync(filePath, 'utf-8');
	const data: object = JSON.parse(dataStr);

	const date: string = data['date'];
	const mods: string[] = data['mods'];
	const player: string = data['player'];
	const startDate: string = data['start_date'];
	const gameUniqueId: string = data['game_unique_id'];
	const gameUniqueSeed: number = data['game_unique_seed'];
	const version: string = data['version'];
	const difficulty: string = data['difficulty'];
	const countries: Country[] = [];

	const hoi4countries = data['countries'];
	for (const c of Object.keys(hoi4countries)) {
		const country = hoi4countries[c];

		const capital: number = country['capital'];
		const originalCapital: number = country['original_capital'];
		const airExperienceDaily: number = country['air_experience_daily'];
		const stability: number = country['stability'];
		const armyExperience: number = country['army_experience'];
		const aces: Ace[] = getCountryAces(country);
		const diplomacy: Diplomacy = getCountryDiplomacy(country);
		const navyLeaders: NavyLeader[] = getNavyLeaders(country);
		const corpsCommanders: CorpsCommander[] = getCorpsCommanders(country);
		const politics: Politics = getPolitics(country);

		const countryObject: Country = {
			name: c,
			aces,
			airExperienceDaily,
			armyExperience,
			capital,
			corpsCommanders,
			diplomacy,
			navyLeaders,
			originalCapital,
			politics,
			stability,
		};

		countries.push(countryObject);
	}

	return {
		date,
		mods,
		countries,
		difficulty,
		gameUniqueId,
		gameUniqueSeed,
		player,
		startDate,
		version,
	};
}

function getCountryAces(country: object): Ace[] {
	const aces: Ace[] = [];

	let acesObject = country['aces'];
	if (acesObject === undefined) {
		return [];
	}

	// This is so dirty I hate it
	if (!Array.isArray(acesObject)) {
		acesObject = [acesObject];
	}

	for (const aceObj of acesObject) {
		aces.push({
			alive: aceObj['alive'],
			callsign: aceObj['callsign'],
			modifier: aceObj['modifier'],
			name: aceObj['name'],
			portrait: aceObj['portrait'],
			surname: aceObj['surname'],
		});
	}

	return aces;
}

function getCountryDiplomacy(country: object): Diplomacy {
	const diplomacy: object = country['diplomacy'];
	const legitimacy: number = diplomacy['legitimacy'];
	const hostingOurGovernmentInExile: string =
		diplomacy['hosting_our_government_in_exile'];
	const capitulated: boolean = diplomacy['capitulated'];
	const exileArmyLeaders: number = diplomacy['exile_army_leaders'];
	const factionJoinDate: string = diplomacy['faction_join_date'];
	const activeRelations: ActiveRelation[] = [];

	for (const c of Object.keys(diplomacy['active_relations'])) {
		const activeRelationsCountry = diplomacy['active_relations'][c];

		const borderFrictionClaim: number =
			activeRelationsCountry['border_friction_claim'];
		const cachedSum: number = activeRelationsCountry['cached_sum'];
		const attitude: string = activeRelationsCountry['attitude'];
		const hasChanged: boolean = activeRelationsCountry['has_changed'];
		const lastSendDiplomat: string =
			activeRelationsCountry['last_send_diplomat'];

		const activeRelation: ActiveRelation = {
			country: c,
			borderFrictionClaim,
			cachedSum,
			attitude,
			hasChanged,
			lastSendDiplomat,
		};

		const opinionObject = activeRelationsCountry['opinion'];
		if (opinionObject !== undefined) {
			activeRelation.opinion = {
				date: opinionObject['date'],
				modifier: opinionObject['modifier'],
				value: opinionObject['value'],
			};
		}

		activeRelations.push(activeRelation);
	}

	return {
		activeRelations,
		capitulated,
		exileArmyLeaders,
		factionJoinDate,
		legitimacy,
		hostingOurGovernmentInExile,
	};
}

function getNavyLeaders(country: object): NavyLeader[] {
	let navyLeader = country['navy_leader'];

	if (navyLeader === undefined) {
		return [];
	}

	if (!Array.isArray(navyLeader)) {
		navyLeader = [navyLeader];
	}

	const navyLeaderArray: NavyLeader[] = [];
	for (const leader of navyLeader) {
		navyLeaderArray.push({
			attackSkill: leader['attack_skill'],
			coordinationSkill: leader['coordination_skill'],
			experience: leader['experience'],
			maneuveringSkill: leader['maneuvering_skill'],
			name: leader['name'],
			defenseSkill: leader['defense_skill'],
			gfx: leader['gfx'],
			penalty: leader['penalty'],
			skill: leader['skill'],
		});
	}

	return navyLeaderArray;
}

function getCorpsCommanders(country: object): CorpsCommander[] {
	let corpsCommander = country['corps_commander'];

	if (corpsCommander === undefined) {
		return [];
	}

	if (!Array.isArray(corpsCommander)) {
		corpsCommander = [corpsCommander];
	}

	const corpsCommanderArray: CorpsCommander[] = [];
	for (const commander of corpsCommander) {
		corpsCommanderArray.push({
			attackSkill: commander['attack_skill'],
			experience: commander['experience'],
			name: commander['name'],
			defenseSkill: commander['defense_skill'],
			gfx: commander['gfx'],
			skill: commander['skill'],
			logisticsSkill: commander['logistics_skill'],
			planningSkill: commander['planning_skill'],
			traits: commander['traits'],
		});
	}

	return corpsCommanderArray;
}

function getPolitics(country: object): Politics {
	const politics = country['politics'];
	const electionsAllowed: boolean = politics['elections_allowed'];
	const politicalPower: number = politics['political_power'];
	const rulingParty: string = politics['ruling_party'];
	const ideas: string[] = politics['ideas'];
	const lastElection: string = politics['last_election'];
	const electionFrequency: number = politics['election_frequency'];
	const politicalParties: PoliticalParty[] = [];

	const parties: object = politics['parties'];
	for (const partyType of Object.keys(parties)) {
		const party = parties[partyType];

		const name: string = party['name'];
		const longName: string = party['long_name'];
		const popularity: number = party['popularity'];
		const leaders: PoliticalPartyLeader[] = [];

		let countryLeader = party['country_leader'];
		if (!Array.isArray(countryLeader)) {
			countryLeader = [countryLeader];
		}

		for (const leader of countryLeader) {
			leaders.push({
				desc: leader['desc'],
				expire: leader['expire'],
				name: leader['name'],
				ideology: leader['ideology'],
				picture: leader['picture'],
			});
		}

		politicalParties.push({
			countryLeaders: leaders,
			type: partyType,
			longName,
			name,
			popularity,
		});
	}

	return {
		parties: politicalParties,
		electionFrequency,
		electionsAllowed,
		ideas,
		lastElection,
		politicalPower,
		rulingParty,
	};
}

export { processHoi4File, getGames, getGame };
