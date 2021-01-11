export type Hoi4Save = {
	date: string;
	mods: string[];
	countries: Country[];
	player: string;
	startDate: string;
	gameUniqueId: string;
	gameUniqueSeed: number;
	version: string;
	difficulty: string;
};

export type Country = {
	name: string;
	capital: number;
	originalCapital: number;
	aces: Ace[];
	airExperienceDaily: number;
	stability: number;
	armyExperience: number;
	diplomacy: Diplomacy;
	navyLeaders: NavyLeader[];
	corpsCommanders: CorpsCommander[];
	politics: Politics;
};

export type Ace = {
	alive: boolean;
	surname: string;
	modifier: string;
	name: string;
	callsign: string;
	portrait: number;
};

export type Focus = {
	paused: boolean;
	progress: number;
	completed: string[];
	currentContinuous: string;
};

export type Diplomacy = {
	legitimacy: number;
	hostingOurGovernmentInExile?: string;
	activeRelations: ActiveRelation[];
	capitulated: boolean;
	exileArmyLeaders: number;
	factionJoinDate: string;
};

export type ActiveRelation = {
	country: string;
	borderFrictionClaim: number;
	cachedSum: number;
	attitude?: string;
	hasChanged?: boolean;
	lastSendDiplomat?: string;
	opinion?: ActiveRelationOpinion;
};

export type ActiveRelationOpinion = {
	date: string;
	modifier: string;
	value: number;
};

export type NavyLeader = {
	attackSkill: number;
	coordinationSkill: number;
	penalty: number;
	experience: number;
	maneuveringSkill: number;
	skill: number;
	defenseSkill: number;
	name: string;
	gfx: string;
};

export type CorpsCommander = {
	attackSkill: number;
	traits: string[];
	planningSkill: number;
	experience: number;
	logisticsSkill: number;
	skill: number;
	defenseSkill: number;
	name: string;
	gfx: string;
};

export type Politics = {
	electionsAllowed: boolean;
	politicalPower: number;
	rulingParty: string;
	ideas: string[];
	lastElection: string;
	electionFrequency: number;
	parties: PoliticalParty[];
};

export type PoliticalParty = {
	type: string;
	popularity: number;
	name: string;
	longName: string;
	countryLeaders: PoliticalPartyLeader[];
};

export type PoliticalPartyLeader = {
	expire: string;
	name: string;
	ideology: string;
	picture: string;
	desc: string;
};

export type GameInfo = {
	id: number;
	name: string;
};
