import { UnnecessaryStats } from '../../api/routes/demoworker/types';

export type CsgoMatch = {
	id: number;
	map: string;
	date: number;
	waitTime: number;
	matchDuration: number;
	ctRounds: number;
	tRounds: number;
	winner: Side;
	players: PlayerStatistics[];
};

export type PlayerStatistics = {
	player: PlayerData;
	ping: number;
	kills: number;
	assists: number;
	deaths: number;
	mvps: number;
	hsp: number;
	score: number;
	side: Side;
	unnecessaryStats?: UnnecessaryStats;
};

export type PlayerData = {
	name: string;
	id: string;
	avatarLink: string;
	steamLink: string;
};

export type Side = 'T' | 'CT' | 'TIE';
export type StatisticsType = 'kills' | 'deaths' | 'hsp' | 'mvps' | 'score' | 'ping' | 'assists';
export const RESULTS_IN_PAGE: number = 10;

export type MatchWithPlayerStats = {
	id: number;
	date: number;
	ctRounds: number;
	tRounds: number;
	map: string;
	matchDuration: number;
	player: PlayerStatistics;
};
