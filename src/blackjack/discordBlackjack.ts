import {
	DMChannel,
	Message,
	MessageEmbed,
	MessageManager,
	MessageReaction,
	NewsChannel,
	PartialUser,
	TextChannel,
	User,
} from 'discord.js';
import { bank } from '..';
import { BankChangeType } from '../bank/types';
import { isNil, isNumeric } from '../utils';
import BlackjackGame from './blackjackGame';
import { BlackjackPlayer, Card, GameState } from './types';

class DiscordBlackjack {
	private game: BlackjackGame;

	private errorMessages: string[];
	private historyMessages: string[];

	private gameMessage: Message;

	private bets: Map<string, number>;

	private willUpdate: boolean;
	private updateTimeout: NodeJS.Timeout;

	constructor() {
		this.game = undefined;
		this.errorMessages = [];
		this.historyMessages = [];
		this.gameMessage = undefined;
		this.bets = new Map();
		this.willUpdate = false;
	}

	onReaction(reaction: MessageReaction, user: User | PartialUser) {
		if (isNil(this.gameMessage) || reaction.message.id !== this.gameMessage.id) {
			return;
		}

		if (user.bot) {
			return;
		}

		const resolvedReaction = reaction.message.reactions.resolve(reaction.emoji.name);
		if (!isNil(resolvedReaction)) {
			resolvedReaction.users.remove(user.id);
		}

		let error: string = undefined;
		switch (reaction.emoji.name) {
			case '💵':
				error = this.game.start();
				break;

			case '➕':
				error = this.game.hit(user.id);
				break;

			case '➖':
				error = this.game.stand(user.id);
				break;

			default:
				break;
		}

		if (!isNil(error)) {
			this.addErrorMessage(error);
		}

		this.update();
	}

	async join(channel: DMChannel | NewsChannel | TextChannel, author: User, args: string[]) {
		if (this.bets.has(author.id)) {
			this.addErrorMessage(`<@${author.id}> you have already joined the game`);
			return;
		}

		const betStr: string = args.shift();
		if (!isNumeric(betStr)) {
			channel.send(`${betStr} must be a number`);
			return;
		}

		const bet: number = parseFloat(betStr);
		if (bet < 1) {
			channel.send('Bet must be more or equal to 1');
			return;
		}

		if (!bank.hasBalance(author.id, bet)) {
			channel.send(`<@${author.id}> you don't have enough points for that`);
			return;
		}

		bank.removeFromUser(author.id, bet, BankChangeType.BLACKJACK);
		this.bets.set(author.id, bet);
		this.addMessage(`<@${author.id}> bets ${bet} points`);

		if (isNil(this.game)) {
			await this.createGame(channel);
		}

		this.game.join(author.id);
		this.update();
	}

	private async createGame(channel: DMChannel | NewsChannel | TextChannel) {
		this.game = new BlackjackGame();
		this.game.onMessage = (message) => {
			this.addMessage(message);
		};
		await this.sendInitial(channel);
	}

	private async sendInitial(channel: DMChannel | NewsChannel | TextChannel) {
		const embed: MessageEmbed = this.createMessageEmbed();
		const msg: Message = await channel.send(embed);

		this.gameMessage = msg;
		await msg.react('💵');
		await msg.react('➕');
		await msg.react('➖');
	}

	private createMessageEmbed(): MessageEmbed {
		const embed: MessageEmbed = new MessageEmbed({ title: 'Blackjack' });
		embed.addField('Reactions', '➕: Hit\n➖: Stand', true);
		embed.addField('\u200B', '💵: Start game', true);

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

	private resetGame() {
		this.game = undefined;
		this.errorMessages = [];
		this.historyMessages = [];
		this.gameMessage = undefined;
		this.bets = new Map();
		this.willUpdate = false;
		if (!isNil(this.updateTimeout)) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = undefined;
		}
	}

	private update() {
		if (this.willUpdate) {
			return;
		}

		this.willUpdate = true;
		this.updateTimeout = setTimeout(() => {
			this.updateGameMessage();
			this.willUpdate = false;
			this.updateTimeout = undefined;
		}, 500);
	}

	private getPlayerCardString(cards: Card[], censorFirstCard: boolean): string {
		let str: string = '';

		for (const card of cards) {
			if (str.length !== 0) {
				str += '\t';
			}

			if (str.length === 0 && censorFirstCard) {
				str += '??';
			} else {
				str += card.name;
			}
		}

		return str;
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

	private async updateGameMessage() {
		if (isNil(this.gameMessage)) {
			return;
		}

		const embed: MessageEmbed = this.createMessageEmbed();
		if (this.game.getGameState() === GameState.NOT_STARTED) {
			const players: BlackjackPlayer[] = this.game.getPlayersArray();

			let cardString: string = '';
			for (const player of players) {
				if (player.id === 'dealer') {
					continue;
				}

				cardString += `<@${player.id}>: **[${player.state}]**\n`;
			}

			if (cardString.length > 0) {
				embed.addField('Players', cardString);
			}
		}

		if (this.game.getGameState() === GameState.RUNNING) {
			const players: BlackjackPlayer[] = this.game.getPlayersArray();
			const dealer: BlackjackPlayer = players[0];

			embed.addField(
				'Dealer',
				`(${this.game.getCardsTotalString(dealer)}) ${this.getPlayerCardString(dealer.cards, true)}`,
			);

			let cardString: string = '';
			for (const player of players) {
				if (player.id === 'dealer') {
					continue;
				}

				cardString += `<@${player.id}>: (${this.game.getCardsTotalString(player)}) ${this.getPlayerCardString(
					player.cards,
					false,
				)} **[${player.state}]**\n`;
			}

			embed.addField('Players', cardString);
		}

		if (this.game.getGameState() === GameState.ENDED) {
			const payouts: Map<string, number> = this.game.getPlayerPayouts();

			const players: BlackjackPlayer[] = this.game.getPlayersArray();
			const dealer: BlackjackPlayer = players[0];

			embed.addField(
				'Dealer',
				`(${this.game.getCardsTotalString(dealer)}) ${this.getPlayerCardString(dealer.cards, false)}`,
			);

			let cardString: string = '';
			for (const player of players) {
				if (player.id === 'dealer') {
					continue;
				}

				const playerBet: number = this.bets.get(player.id);
				const playerWin: number = playerBet * payouts.get(player.id);
				if (playerWin > 0) {
					bank.addToUser(player.id, playerWin, BankChangeType.BLACKJACK);
				}

				cardString += `<@${player.id}>: (${this.game.getCardsTotalString(player)}) ${this.getPlayerCardString(
					player.cards,
					false,
				)} **💵 ${playerWin} 💵**\n`;
			}

			embed.addField('Players', cardString);
			this.addMessage('**Game has ended**');

			setTimeout(() => {
				this.resetGame();
			}, 1000);
		}

		await this.gameMessage.edit(embed);
	}
}

export default DiscordBlackjack;
