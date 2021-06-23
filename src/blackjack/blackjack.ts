import { DMChannel, MessageEmbed, NewsChannel, TextChannel } from 'discord.js';
import { createDeck } from './deck/deck';
import { Card } from './deck/types';

class Blackjack {
	private cards: Card[];

	private dealer: Card[];
	private players: Map<string, Card[]>;

	constructor() {
		this.cards = [];
		this.players = new Map();
	}

	initialize(numberOfDecks: number) {
		for (let i = 0; i < numberOfDecks; i++) {
			this.cards.push(...createDeck());
		}
	}

	shuffleDeck() {
		for (let i = 0; i < this.cards.length - 2; i++) {
			const randomIndex: number = Math.floor(Math.random() * (this.cards.length - 2 - i));
			const temp: Card = this.cards[randomIndex];
			this.cards[randomIndex] = this.cards[i];
			this.cards[i] = temp;
		}
	}

	join(snowflake: string) {
		if (this.cards.length === 0) {
			this.initialize(2);
			this.shuffleDeck();
		}

		console.log(this.cards);
		this.players.set(snowflake, []);
	}

	start() {
		console.log('start');
		this.dealer = [];

		this.dealCardToPlayers();
		this.dealCardToPlayers();
		console.log(this.players);
	}

	dealToPlayer(snowflake: string) {
		this.players.get(snowflake).push(this.cards.pop());
	}

	sendCards(channel: DMChannel | TextChannel | NewsChannel) {
		let str = '';
		let count = 0;
		for (const card of this.cards) {
			count++;
			if (str.length !== 0) {
				str + ', ';
			}

			str += card.name;
			if (count % (52 / 4) === 0) {
				str += '\n';
			}
		}

		channel.send(str);
	}

	sendPlayers(channel: DMChannel | TextChannel | NewsChannel) {
		const embed: MessageEmbed = new MessageEmbed({ title: 'Cards' });

		embed.addField('Dealer', this.getPlayerCardString(this.dealer));

		let cardString: string = '';
		for (const player of this.players) {
			cardString += `<@${player[0]}>: (${this.calculateCards(player[1])}) ${this.getPlayerCardString(player[1])}`;
		}
		embed.addField('Players', cardString);

		channel.send(embed);
	}

	private calculateCards(cards: Card[]): string {
		let hasAce: boolean = false;
		let count: number = 0;

		for (const card of cards) {
			if (card.name === 'Ace') {
				hasAce = true;
			}

			count += card.number;
		}

		if (count === 10 && this.cards.length === 2 && hasAce) {
			return `Blackjack`;
		}

		if (count < 10 && hasAce) {
			return `${count - 10}/${count}`;
		}

		return count.toString();
	}

	private getPlayerCardString(cards: Card[]): string {
		let str: string = '';

		for (const card of cards) {
			if (str.length !== 0) {
				str += '\t';
			}

			str += card.name;
		}

		return str;
	}

	private dealCardToPlayers() {
		for (const player of this.players) {
			const cards: Card[] = player[1];

			cards.push(this.cards.pop());
		}

		this.dealer.push(this.cards.pop());
	}
}

export default Blackjack;
