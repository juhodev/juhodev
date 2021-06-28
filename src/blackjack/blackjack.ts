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
import { BlackjackPlayer, GameState, PlayerState } from './types';

class Blackjack {
	private cards: Card[];

	private dealer: BlackjackPlayer;
	private currentPlayer: string;
	private players: Map<string, BlackjackPlayer>;

	private gameMessage: Message;
	private errorMessages: string[];
	private historyMessages: string[];
	private gameState: GameState;

	private willUpdate: boolean;
	private updateTimeout: NodeJS.Timeout;

	constructor() {
		this.cards = [];
		this.players = new Map();
		this.willUpdate = false;
		this.errorMessages = [];
		this.historyMessages = [];
	}

	onReaction(reaction: MessageReaction, user: User | PartialUser) {
		if (isNil(this.gameMessage) || reaction.message.id !== this.gameMessage.id) {
			return;
		}

		if (user.bot) {
			return;
		}

		reaction.message.reactions.resolve(reaction.emoji.name).users.remove(user.id);

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
		if (this.gameState === GameState.RUNNING) {
			channel.send('A blackjack game has already been created!');
			return;
		}

		if (this.gameState === GameState.ENDED) {
			this.resetGame();
		}

		const embed: MessageEmbed = this.createMessageEmbed();

		const msg: Message = await channel.send(embed);
		this.gameMessage = msg;

		await msg.react('✅');
		await msg.react('💵');
		await msg.react('➕');
		await msg.react('➖');
	}

	private updateRound() {
		if (isNil(this.currentPlayer)) {
			return;
		}

		const player: BlackjackPlayer = this.players.get(this.currentPlayer);
		if (isNil(player)) {
			console.error(`[Blackjack] Player not found! ${this.currentPlayer}`);
			return;
		}

		if (player.state === PlayerState.HIT) {
			this.dealToPlayer(player.id);
			this.update();
		}

		if (player.state === PlayerState.STAND) {
			this.updatePlayer();
			this.update();
		}
	}

	private join(snowflake: string) {
		if (this.cards.length === 0) {
			this.initialize(2);
			this.shuffleDeck();
			this.dealer = { cards: [], id: '-1', state: PlayerState.WAITING };
		}

		this.players.set(snowflake, { id: snowflake, cards: [], state: PlayerState.WAITING });
		if (isNil(this.currentPlayer)) {
			this.currentPlayer = snowflake;
		}

		this.addMessage(`<@${snowflake}> joined!`);
		this.update();
	}

	private start() {
		this.gameState = GameState.RUNNING;

		this.dealCardToPlayers();
		this.dealCardToPlayers();

		this.update();
	}

	private async updateGameState() {
		if (isNil(this.gameMessage)) {
			return;
		}

		const embed: MessageEmbed = this.createMessageEmbed();
		if (!isNil(this.dealer)) {
			embed.addField(
				'Dealer',
				`(${this.calculateCards(this.dealer)}) ${this.getPlayerCardString(this.dealer.cards)}`,
			);

			let cardString: string = '';
			for (const player of this.players) {
				cardString += `<@${player[0]}>: (${this.calculateCards(player[1])}) ${this.getPlayerCardString(
					player[1].cards,
				)} **[${player[1].state}]**`;
			}
			embed.addField('Players', cardString);
		}

		await this.gameMessage.edit(embed);
		this.willUpdate = false;
	}

	private createMessageEmbed(): MessageEmbed {
		const embed: MessageEmbed = new MessageEmbed({ title: 'Blackjack' });
		embed.addField('Reactions', '✅: Join\n💵: Start game', true);
		embed.addField('\u200B', '➕: Hit\n➖: Stand', true);

		if (this.errorMessages.length > 0) {
			const oneErrorMessage: string = this.errorMessages.join('\n');
			embed.addField('Error', oneErrorMessage);
		}

		if (this.historyMessages.length > 0) {
			const oneMessage: string = this.historyMessages.join('\n');
			embed.addField('History', oneMessage);
		}

		embed.setTimestamp();
		embed.setThumbnail('https://cdn.betterttv.net/emote/6094368d39b5010444d0cc16/3x.gif');
		return embed;
	}

	private dealToPlayer(snowflake: string) {
		if (!this.players.has(snowflake)) {
			this.addErrorMessage(`<@${snowflake}> you must first join the game`);
			return;
		}

		if (this.gameState !== GameState.RUNNING) {
			this.addErrorMessage('The game has not started yet!');
			return;
		}

		const player: BlackjackPlayer = this.players.get(snowflake);
		const newCard: Card = this.cards.pop();
		player.cards.push(newCard);
		this.addMessage(`<@${player.id}> hits (${newCard.suit}${newCard.numberString})`);

		if (this.hasBusted(player)) {
			player.state = PlayerState.BUSTED;
			this.addMessage(`<@${player.id}> busted`);
			this.updatePlayer();
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

		this.currentPlayer = undefined;
		this.endGame();
	}

	private endGame() {
		if (this.gameState === GameState.ENDED) {
			return;
		}

		this.gameState = GameState.ENDED;
		this.drawToDealerUntil17OrAbove();

		const dealerCount: number = parseInt(this.calculateCards(this.dealer));
		if (dealerCount > 21) {
			this.dealer.state = PlayerState.BUSTED;
			this.addMessage('Dealer busted');
		}

		for (const player of this.players) {
			const state: PlayerState = player[1].state;

			if (state === PlayerState.BUSTED || this.dealer.state === PlayerState.BLACKJACK) {
				player[1].state = PlayerState.LOST;
				continue;
			}

			if (this.dealer.state === PlayerState.BUSTED) {
				player[1].state = PlayerState.WON;
				continue;
			}

			const playerCount: number = parseInt(this.calculateCards(player[1]));
			if (dealerCount > playerCount) {
				player[1].state = PlayerState.LOST;
				continue;
			}

			if (dealerCount === playerCount) {
				player[1].state = PlayerState.PUSH;
				continue;
			}

			if (dealerCount < playerCount) {
				player[1].state = PlayerState.WON;
				continue;
			}
		}

		this.addMessage('Game ended');
		this.forceUpdate();
	}

	private resetGame() {
		this.dealer = undefined;
		this.cards = [];
		this.players.clear();
		this.gameMessage = undefined;
		this.errorMessages = [];
		this.historyMessages = [];
	}

	private drawToDealerUntil17OrAbove() {
		while (this.dealerShouldHit()) {
			const newCard: Card = this.cards.pop();
			this.dealer.cards.push(newCard);
			this.addMessage(`+ Dealer ${newCard.suit}${newCard.numberString}`);

			const dealerCount: string = this.calculateCards(this.dealer);
			if (dealerCount === 'Blackjack') {
				this.dealer.state = PlayerState.BLACKJACK;
				return;
			}
		}
	}

	private dealerShouldHit(): boolean {
		const dealerCount: string = this.calculateCards(this.dealer);
		if (dealerCount === 'Blackjack') {
			return false;
		}

		if (dealerCount.includes('/')) {
			const highNumber: number = parseInt(dealerCount.split('/')[1]);

			if (highNumber < 17) {
				return true;
			}

			return false;
		}

		if (parseInt(dealerCount) < 17) {
			return true;
		}

		return false;
	}

	private playerStand(snowflake: string) {
		if (!this.players.has(snowflake)) {
			this.addErrorMessage(`<@${snowflake}> you must first join the game`);
			return;
		}

		if (this.gameState !== GameState.RUNNING) {
			this.addErrorMessage('The game has not started yet!');
			return;
		}

		const player: BlackjackPlayer = this.players.get(snowflake);
		player.state = PlayerState.STAND;
		this.addMessage(`<@${player.id}> stands`);

		this.updatePlayer();
		this.update();
	}

	private hasBusted(player: BlackjackPlayer): boolean {
		const cardResult: string = this.calculateCards(player);

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

	private calculateCards(player: BlackjackPlayer): string {
		let hasAce: boolean = false;
		let count: number = 0;

		for (const card of player.cards) {
			if (card.number === 1) {
				hasAce = true;
			}

			count += card.number;
		}

		if (count === 11 && player.cards.length === 2 && hasAce) {
			return 'Blackjack';
		}

		if (count <= 10 && hasAce && player.state !== PlayerState.STAND) {
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

			const newCard: Card = this.cards.pop();
			cards.push(newCard);
			this.addMessage(`+ <@${player[1].id}> ${newCard.suit}${newCard.numberString}`);
		}

		const dealerCard: Card = this.cards.pop();
		this.dealer.cards.push(dealerCard);
		this.addMessage(`+ Dealer ${dealerCard.suit}${dealerCard.numberString}`);

		const dealerCount: string = this.calculateCards(this.dealer);
		if (dealerCount === 'Blackjack') {
			this.dealer.state = PlayerState.BLACKJACK;
		}
	}

	private addErrorMessage(errorMessage: string) {
		if (this.errorMessages.length >= 3) {
			this.errorMessages.shift();
		}

		this.errorMessages.push(errorMessage);
		this.update();
	}

	private addMessage(message: string) {
		if (this.historyMessages.length >= 5) {
			this.historyMessages.shift();
		}

		this.historyMessages.push(message);
		this.update();
	}

	private forceUpdate() {
		this.updateRound();
		this.willUpdate = false;
		if (!isNil(this.updateTimeout)) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = undefined;
		}

		this.updateGameState();
	}

	private update() {
		this.updateRound();

		if (this.willUpdate) {
			return;
		}

		this.willUpdate = true;
		this.updateTimeout = setTimeout(() => {
			this.updateGameState();
			this.updateTimeout = undefined;
		}, 500);
	}
}

export default Blackjack;
