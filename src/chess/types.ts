export type ChessPlayer = {
	id: string;
	name: string;
	currentRating: number;
	ratings: {
		[name: string]: number[],
	},
	openingsSelf: {
		[name: string]: number;
	},
	openingsAgainst: {
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
	blunders: {
		[name: string]: { count: number, data: number },
	},
	mistakes: {
		[name: string]: { count: number, data: number },
	},
}