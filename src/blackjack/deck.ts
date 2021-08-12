import { Card } from './types';
import { createDeck } from './utils';

const PERCETANGE_TO_PLAY_TO_SHUFFLE: number = 0.2;
export const NUMBER_OF_DECKS: number = 6;

class Deck {
	private cards: Card[];

	constructor() {
		this.cards = [];
	}

	newRound(): boolean {
		if (
			this.cards.length < 52 * NUMBER_OF_DECKS - 52 * NUMBER_OF_DECKS * PERCETANGE_TO_PLAY_TO_SHUFFLE ||
			this.cards.length == 0
		) {
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
			this.cards.push(...createDeck());
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
}

const inst: Deck = new Deck();
export default inst;
