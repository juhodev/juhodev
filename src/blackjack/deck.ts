import { Card } from './types';

const PERCETANGE_TO_PLAY_TO_SHUFFLE: number = 0.2;
const NUMBER_OF_DECKS: number = 6;

class Deck {
	private cards: Card[];

	constructor() {
		this.cards = [];
	}

	newRound(): boolean {
		if (this.cards.length < 52 * NUMBER_OF_DECKS - 52 * NUMBER_OF_DECKS * PERCETANGE_TO_PLAY_TO_SHUFFLE) {
			this.cards = [];
			this.init();
			return true;
		}

		return false;
	}

	getCard(): Card {
		if (this.cards.length === 0) {
			this.init();
		}

		return this.cards.shift();
	}

	getCards() {
		return this.cards;
	}

	private init() {
		for (let i = 0; i < NUMBER_OF_DECKS; i++) {
			this.cards.push(...this.createDeck());
		}

		this.shuffleDeck();
	}

	private shuffleDeck() {
		for (let i = 0; i < this.cards.length - 2; i++) {
			const randomIndex: number = Math.floor(Math.random() * (this.cards.length - 2 - i));
			const temp: Card = this.cards[randomIndex];
			this.cards[randomIndex] = this.cards[i];
			this.cards[i] = temp;
		}
	}

	private createDeck() {
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

	private getSuit(x: number): string {
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

	private getCardStr(x: number): string {
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
}

const inst: Deck = new Deck();
export default inst;
