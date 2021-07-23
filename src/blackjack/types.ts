export enum PlayerState {
	WAITING = 'WAITING',
	HIT = 'HIT',
	STAND = 'STAND',
	BUSTED = 'BUSTED',
	WON = 'WON',
	LOST = 'LOST',
	PUSH = 'PUSH',
	BLACKJACK = 'BLACKJACK',
}

export enum GameState {
	NOT_STARTED = 'NOT_STARTED',
	RUNNING = 'RUNNING',
	ENDED = 'ENDED',
}

export type BlackjackPlayer = {
	id: string;
	cards: Card[];
	state: PlayerState;
};

export type Card = {
	name: string;
	numberString: string;
	suit: string;
	number: number;
};
