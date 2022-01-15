export type ChessPlayer = {
	id: string;
	name: string;
	currentRating: number;
	rating: {
		[name: string]: number[],
	},
	openings: {
		[name: string]: number;
	},
	wins: {
		[name: string]: number;
	},
	losses: {
		[name: string]: number;
	},
	draws: {
		[name: string]: number;
	},
	lastMatch: number,
	blunders: {
		total: number;
		gamesJudged: number;
	},
	mistakes: {
		total: number;
		gamesJudged: number;
	}
}