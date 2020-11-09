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
	mapStats: CsgoMapStats[];
};

export type CsgoGameStats = {
	ping: { value: number; matchId?: number };
	kills: { value: number; matchId?: number };
	assists: { value: number; matchId?: number };
	deaths: { value: number; matchId?: number };
	mvps: { value: number; matchId?: number };
	hsp: { value: number; matchId?: number };
	score: { value: number; matchId?: number };
	matchDuration: { value: number; matchId?: number };
	waitTime: { value: number; matchId?: number };
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
};

export type CsgoMatch = {
	players: CsgoPlayer[];
	map: string;
	matchDuration: number;
	waitTime: number;
	ctRounds: number;
	tRounds: number;
	winner: string;
};

export type ExtensionMatch = {
	game: ExtensionMapData;
	players: ExtensionPlayerData[];
};

export type ExtensionMapData = {
	map: string;
	matchDuration: string;
	date: string;
	score: string;
	waitTime: string;
};

export type ExtensionPlayerData = {
	avatarSrc: string;
	miniprofile: string;
	name: string;
	steamLink: string;
	assists: number;
	deaths: number;
	hsp: number;
	kills: number;
	mvps: number;
	ping: number;
	side: string;
	score: number;
};

export type UploadCode = {
	createdAt: number;
	code: string;
	createdFor: string;
};

export type AddResponse = {
	alreadyExists: boolean;
};
