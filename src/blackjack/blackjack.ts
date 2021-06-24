import {
	DMChannel,
	Message,
	MessageEmbed,
	MessageReaction,
	NewsChannel,
	PartialUser,
	TextChannel,
	User,
} from 'discord.js';
import { createDeck } from './deck/deck';
import { Card } from './deck/types';
import { isNil } from '../utils';
import { BlackjackPlayer, PlayerState } from './types';

class Blackjack {
	private cards: Card[];

	private dealer: Card[];
	private currentPlayer: string;
	private players: Map<string, BlackjackPlayer>;

	private gameMessage: Message;
	private errorMessage: string;

	private willUpdate: boolean;

	constructor() {
		this.cards = [];
		this.players = new Map();
		this.willUpdate = false;
	}

	onReaction(reaction: MessageReaction, user: User | PartialUser) {
		if (isNil(this.gameMessage) || reaction.message.id !== this.gameMessage.id) {
			return;
		}

		switch (reaction.emoji.name) {
			case '✅':
				this.join(user.id);
				break;

			case '💵':
				this.start();
				break;

			case '➕':
				this.dealToPlayer(user.id);
				break;

			case '➖':
				this.playerStand(user.id);
				break;
		}
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

	async sendInitial(channel: TextChannel | DMChannel | NewsChannel) {
		const embed: MessageEmbed = this.createMessageEmbed();

		const msg: Message = await channel.send(embed);
		await msg.react('✅');
		await msg.react('💵');
		await msg.react('➕');
		await msg.react('➖');

		this.gameMessage = msg;
	}

	private updateRound() {
		const currentPlayer: BlackjackPlayer = this.players.get(this.currentPlayer);

		if (currentPlayer.state === PlayerState.STAND || currentPlayer.state === PlayerState.HIT) {
			this.dealToPlayer(currentPlayer.id);

			this.update();
		}
	}

	private join(snowflake: string) {
		if (this.cards.length === 0) {
			this.initialize(2);
			this.shuffleDeck();
			this.dealer = [];
		}

		this.players.set(snowflake, { id: snowflake, cards: [], state: PlayerState.WAITING });
		if (isNil(this.currentPlayer)) {
			this.currentPlayer = snowflake;
		}

		this.update();
	}

	private start() {
		this.dealCardToPlayers();
		this.dealCardToPlayers();

		this.update();
	}

	private updateGameState() {
		if (isNil(this.gameMessage)) {
			console.error('game message is null');
			return;
		}

		const embed: MessageEmbed = this.createMessageEmbed();
		if (!isNil(this.dealer)) {
			embed.addField('Dealer', `(${this.calculateCards(this.dealer)}) ${this.getPlayerCardString(this.dealer)}`);

			let cardString: string = '';
			for (const player of this.players) {
				cardString += `<@${player[0]}>: (${this.calculateCards(player[1].cards)}) ${this.getPlayerCardString(
					player[1].cards,
				)} **[${player[1].state}]**`;
			}
			embed.addField('Players', cardString);
		}

		this.gameMessage.edit(embed);
	}

	private createMessageEmbed(): MessageEmbed {
		const embed: MessageEmbed = new MessageEmbed({ title: 'Blackjack' });
		embed.addField('Reactions', '✅: Join\n💵: Start game\n➕: Hit\n➖: Stand');

		if (!isNil(this.errorMessage)) {
			embed.addField('Error', this.errorMessage);
		}

		embed.setTimestamp();
		embed.setThumbnail('https://cdn.betterttv.net/emote/6094368d39b5010444d0cc16/3x.gif');
		return embed;
	}

	private dealToPlayer(snowflake: string) {
		if (!this.players.has(snowflake)) {
			this.errorMessage = `<@${snowflake}> you must first join the game`;
			this.update();
			return;
		}

		const player: BlackjackPlayer = this.players.get(snowflake);
		player.cards.push(this.cards.pop());

		if (this.hasBusted(player.cards)) {
			player.state = PlayerState.BUSTED;
		} else {
			player.state = PlayerState.WAITING;
		}

		this.update();
	}

	private updatePlayer() {
		let selectNext: boolean = false;
		for (const player of this.players) {
			if (selectNext) {
				this.currentPlayer === player[0];
				this.update();
				return;
			}

			if (player[0] === this.currentPlayer) {
				selectNext = true;
			}
		}

		this.endGame();
	}

	private endGame() {
		if (this.hasBusted(this.dealer)) {
			// Everyone wins
			return;
		}

		
	}

	private playerStand(snowflake: string) {
		if (!this.players.has(snowflake)) {
			this.errorMessage = `<@${snowflake}> you must first join the game`;
			this.update();
			return;
		}

		this.players.get(snowflake).state = PlayerState.STAND;
		this.update();
	}

	private hasBusted(cards: Card[]): boolean {
		const cardResult: string = this.calculateCards(cards);

		if (cardResult == 'Blackjack') {
			return false;
		}

		if (cardResult.includes('/')) {
			return false;
		}

		if (parseInt(cardResult) <= 21) {
			return false;
		}

		return true;
	}

	private calculateCards(cards: Card[]): string {
		let hasAce: boolean = false;
		let count: number = 0;

		for (const card of cards) {
			if (card.number === 1) {
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
			const cards: Card[] = player[1].cards;

			cards.push(this.cards.pop());
		}

		this.dealer.push(this.cards.pop());
	}

	private update() {
		this.updateRound();

		if (this.willUpdate) {
			return;
		}

		this.willUpdate = true;
		setTimeout(() => {
			this.updateGameState();
			this.willUpdate = false;
		}, 500);
	}
}

export default Blackjack;
