import CsgoPlayer from './csgoPlayer';

export type CsgoMatch = {
	id: number;
	map: string;
	date: number;
	waitTime: number;
	matchDuration: number;
	ctRounds: number;
	tRounds: number;
	winner: string;
};

export type PlayerStatistics = {
	player: CsgoPlayer;
	ping: number;
	kills: number;
	assists: number;
	deaths: number;
	mvps: number;
	hsp: number;
	score: number;
	side: Side;
};

export type Side = 'T' | 'CT';
