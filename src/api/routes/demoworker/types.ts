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
	unnecessaryStats: UnnecessaryStats;
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

export type UnnecessaryStats = {
	jumps: number;
	fallDamage: number;
	weaponFire: WeaponFire[];
	weaponZooms: number;
	damageTaken: DamageTaken[];
	blind: Blind;
	itemPickup: ItemPickup[];
	reloads: number;
	footsteps: number;
	bombPlants: number;
	firingHeatmap?: HeatmapPosition[];
};

export type HeatmapPosition = {
	x: number;
	y: number;
	value: number;
};

export type Position = {
	x: number;
	y: number;
};

export type WeaponFire = {
	weapon: string;
	count: number;
};

export type DamageTaken = {
	weapon: string;
	amount: number;
};

export type Blind = {
	times: number;
	duration: number;
};

export type ItemPickup = {
	item: string;
	count: number;
	silent: number;
};
