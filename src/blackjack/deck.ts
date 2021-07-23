import { Card } from './types';

export function createDeck(): Card[] {
	const cards: Card[] = [];

	for (let i = 0; i < 4; i++) {
		const suit: string = getSuit(i);
		for (let j = 0; j < 13; j++) {
			const cardNumberThing: string = getCard(j);
			const card: Card = {
				name: `${cardNumberThing} ${suit}`,
				numberString: cardNumberThing,
				number: Math.min(10, j + 1),
				suit,
			};
			cards.push(card);
		}
	}

	return cards;
}

function getSuit(x: number): string {
	switch (x) {
		case 0:
			return '♣';

		case 1:
			return '♦';

		case 2:
			return '♥';

		case 3:
			return '♠';
	}
}

function getCard(x: number): string {
	switch (x) {
		case 0:
			return 'Ace';

		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
			return (x + 1).toString();

		case 10:
			return 'Jack';

		case 11:
			return 'Queen';

		case 12:
			return 'King';
	}
}
