export type Player = {
	name: string;
	steamId3: string;
	steamId64: string;
	kills: number;
	deaths: number;
	assists: number;
	hsp: number;
	mvps: number;
	ping: number;
	side: string;
	score: number;
};

export type Team = {
	winner: boolean;
	score: number;
	side: string;
	players: Player[];
};

export type Match = {
	score: number[];
	winner: string;
	map: string;
	date: number;
	terroristTeam: Team;
	counterTerroristTeam: Team;
	duration: number;
};
