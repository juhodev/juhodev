import { ICrosshairInfo, IPlayerInfo, IPlayerRoundStats } from 'demofile';

export type GetNextMatchSharingCodeResponse = {
	result: {
		nextcode: string;
	};
};

export type MatchSharingCsgoMatch = {
	matchid: {
		low: number;
		high: number;
		unsigned: boolean;
	};
	matchtime: number;
	roundstatsall: RoundStats[];
};

export type RoundStats = {
	reservationid: number;
	reservation: {
		account_ids: number[];
	};
	kills: number[];
	assists: number[];
	deaths: number[];
	scores: number[];
	pings: number[];
	team_scores: number[];
	enemy_kills: number[];
	enemy_headshots: number[];
	mvps: number[];
	match_duration: number;
	map: string;
};

export type PlayerEntity = {
	userInfo: IPlayerInfo | null;
	userId: number;
	steamId: string;
	steam64Id: string;
	name: string;
	isFakePlayer: boolean;
	kills: number;
	assists: number;
	deaths: number;
	score: number;
	mvps: number;
	matchStats: IPlayerRoundStats[];
	headshotKills: number;
};

export type DemoDownload = {
	link: string;
	date: number;
};
