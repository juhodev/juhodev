import { Card } from './deck/types';

export enum PlayerState {
	WAITING = 'WAITING',
	HIT = 'HIT',
	STAND = 'STAND',
	BUSTED = 'BUSTED',
}

export type BlackjackPlayer = {
	id: string;
	cards: Card[];
	state: PlayerState;
};
