import { Card } from "./types";

export function createDeck() {
	const cards: Card[] = [];

	for (let i = 0; i < 4; i++) {
		const suit: string = this.getSuit(i);
		for (let j = 0; j < 13; j++) {
			const cardNumberThing: string = this.getCardStr(j);
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