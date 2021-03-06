import { UnnecessaryStats } from '../api/routes/demoworker/types';

export type CsgoProfile = {
	name: string;
	id: string;
	steamLink: string;
	avatarLink: string;
	matchesPlayed: number;
	won: number;
	lost: number;
	tied: number;
	gameAverages: CsgoGameStats;
	gameHighest: CsgoGameStats;
	dateMatches: DateMatches[];
	mapStatistics: MapStatistics;
};

export type CsgoGameStats = {
	ping?: CsgoGameStatsValues;
	kills?: CsgoGameStatsValues;
	assists?: CsgoGameStatsValues;
	deaths?: CsgoGameStatsValues;
	mvps?: CsgoGameStatsValues;
	hsp?: CsgoGameStatsValues;
	score?: CsgoGameStatsValues;
	matchDuration?: CsgoGameStatsValues;
	waitTime?: CsgoGameStatsValues;
};

export type CsgoGameStatsValues = {
	value: number;
	matchId?: number;
	standardDeviation?: number;
	standardError?: number;
};

export type CsgoMapStats = {
	name: string;
	timesPlayed: number;
	averageMatchDuration: number;
	averageWaitTime: number;
};

export type CsgoUser = {
	name: string;
	id: string;
};

export type CsgoPlayer = {
	name: string;
	playerId: string;
	steamLink: string;
	avatar: string;
	ping: number;
	kills: number;
	assists: number;
	deaths: number;
	mvps: number;
	hsp: number;
	score: number;
	side: string;
	unnecessaryStats?: UnnecessaryStats;
};

export type SteamUser = {
	name: string;
	steamId: string;
	steamLink: string;
	avatar: string;
};

export type CsgoMatch = {
	date: number;
	players: CsgoPlayer[];
	map: string;
	matchDuration: number;
	waitTime: number;
	ctRounds: number;
	tRounds: number;
	winner: string;
};

export type GameWithStats = {
	id: number;
	date: number;
	map: string;
	matchDuration: number;
	ctRounds: number;
	tRounds: number;
	player: CsgoPlayer;
};

export type AddResponse = {
	alreadyExists: boolean;
};

export type CsgoMap = {
	name: string;
	timesPlayed: number;
};

export type MapStatistics = {
	maps: CsgoMap[];
};

export type DateMatches = {
	date: number;
	matches: number;
};

export type BuiltProfile = {
	name: string;
	id: string;
	steamLink: string;
	avatarLink: string;
	matchesCount: number;
};
