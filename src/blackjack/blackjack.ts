import { isNil } from '../utils';
import { BlackjackPlayer, Card, GameState, PlayerState } from './types';
import Deck from './deck';

class BlackjackGame {
	private players: BlackjackPlayer[];
	private currentPlayerIndex: number;
	private gameState: GameState;

	onMessage: (message: string) => void;

	constructor() {
		this.players = [];
		this.gameState = GameState.NOT_STARTED;
	}

	join(id: string): string {
		if (this.hasPlayer(id)) {
			return `<@${id}> you are already in the game`;
		}

		if (this.players.length === 0) {
			this.initialize();
		}

		const player: BlackjackPlayer = { cards: [], state: PlayerState.WAITING, id };
		this.players.push(player);
		this.currentPlayerIndex = 1;
		this.pubMessage(`<@${id}> joined the game`);
	}

	getCards() {
		return Deck.getCards();
	}

	hit(id: string): string {
		if (this.gameState !== GameState.RUNNING) {
			return 'Game has not started yet!';
		}

		if (!this.hasPlayer(id)) {
			return 'You are not in the game!';
		}

		const player: BlackjackPlayer = this.getPlayer(id);
		if (
			player.state === PlayerState.BLACKJACK ||
			player.state === PlayerState.BUSTED ||
			player.state === PlayerState.STAND
		) {
			return 'Your game has already ended';
		}

		player.state = PlayerState.HIT;
		this.updateRound();
	}

	stand(id: string): string {
		if (this.gameState !== GameState.RUNNING) {
			return 'Game has not started yet!';
		}

		if (!this.hasPlayer(id)) {
			return 'You are not in the game!';
		}

		const player: BlackjackPlayer = this.getPlayer(id);
		player.state = PlayerState.STAND;
		this.updateRound();
	}

	start(): string {
		if (this.gameState !== GameState.NOT_STARTED) {
			return 'Game has already started';
		}

		this.gameState = GameState.RUNNING;
		for (let i = 0; i < 2; i++) {
			for (const player of this.players) {
				this.dealToPlayer(player);
				this.updatePlayerState(player);
			}
		}
	}

	getCardsTotalString(player: BlackjackPlayer): string {
		let hasAce: boolean = false;
		let count: number = 0;

		let firstCard: boolean = true;
		for (const card of player.cards) {
			if (this.gameState !== GameState.ENDED && player.id === 'dealer' && firstCard) {
				firstCard = false;
				continue;
			}

			if (card.number === 1) {
				hasAce = true;
			}

			count += card.number;
		}

		if (count === 11 && player.cards.length === 2 && hasAce) {
			return 'Blackjack';
		}

		if (count <= 10 && hasAce && player.state !== PlayerState.STAND && player.id !== 'dealer') {
			return `${count}/${count + 10}`;
		}

		if (count <= 10 && hasAce && (player.state === PlayerState.STAND || player.id === 'dealer')) {
			return (count + 10).toString();
		}

		return count.toString();
	}

	forceUpdatePlayerStates() {
		for (const player of this.players) {
			this.updatePlayerState(player);
		}
	}

	getPlayers(): Map<string, BlackjackPlayer> {
		const playerMap: Map<string, BlackjackPlayer> = new Map();
		for (const player of this.players) {
			playerMap.set(player.id, player);
		}

		return playerMap;
	}

	getPlayersArray(): BlackjackPlayer[] {
		return this.players;
	}

	getGameState() {
		return this.gameState;
	}

	getPlayerPayouts(): Map<string, number> {
		const dealer: BlackjackPlayer = this.players[0];
		const payouts: Map<string, number> = new Map();

		for (const player of this.players) {
			if (player.id === 'dealer') {
				continue;
			}

			if (player.state === PlayerState.BUSTED) {
				payouts.set(player.id, 0);
				continue;
			}

			if (player.state === PlayerState.BLACKJACK && dealer.state !== PlayerState.BLACKJACK) {
				payouts.set(player.id, 2.25);
				continue;
			}

			if (dealer.state === PlayerState.BLACKJACK) {
				payouts.set(player.id, 0);
				continue;
			}

			if (dealer.state === PlayerState.BUSTED) {
				payouts.set(player.id, 2);
				continue;
			}

			const dealerNum: number = parseInt(this.getCardsTotalString(dealer));
			const playerNum: number = parseInt(this.getCardsTotalString(player));
			if (dealerNum === playerNum) {
				payouts.set(player.id, 1);
				continue;
			}

			if (playerNum > dealerNum) {
				payouts.set(player.id, 2);
				continue;
			}

			if (playerNum < dealerNum) {
				payouts.set(player.id, 0);
				continue;
			}
		}

		return payouts;
	}

	private pubMessage(message: string) {
		if (isNil(this.onMessage)) {
			return;
		}

		this.onMessage(message);
	}

	private endGame() {
		if (this.gameState === GameState.ENDED) {
			return;
		}

		this.gameState = GameState.ENDED;
		const dealer: BlackjackPlayer = this.players[0];
		this.updatePlayerState(dealer);
		while (this.dealerShouldHit()) {
			this.dealToPlayer(dealer);
		}
	}

	private dealerShouldHit(): boolean {
		const dealer: BlackjackPlayer = this.players[0];
		return dealer.state === PlayerState.WAITING;
	}

	private updateRound() {
		const currentPlayer: BlackjackPlayer = this.players[this.currentPlayerIndex];

		if (currentPlayer.state === PlayerState.WAITING) {
			return;
		}

		if (currentPlayer.state === PlayerState.HIT) {
			this.dealToPlayer(currentPlayer);
			this.updateRound();
		}

		if (currentPlayer.state === PlayerState.STAND) {
			this.updatePlayerState(currentPlayer);
		}
	}

	private hasPlayer(id: string): boolean {
		return this.players.find((x) => x.id === id) !== undefined;
	}

	private getPlayer(id: string): BlackjackPlayer {
		return this.players.find((x) => x.id === id);
	}

	private moveToNextPlayer() {
		if (this.currentPlayerIndex + 1 >= this.players.length) {
			this.endGame();
			return;
		}

		this.currentPlayerIndex++;
		this.updateRound();
	}

	private updatePlayerState(player: BlackjackPlayer) {
		const cards: string = this.getCardsTotalString(player);
		if (cards.includes('/')) {
			player.state = PlayerState.WAITING;
			return;
		}

		if (cards === 'Blackjack') {
			player.state = PlayerState.BLACKJACK;
			if (player.id !== 'dealer') {
				this.pubMessage(`💵 <@${player.id}> **Blackjack**`);
			} else {
				this.pubMessage(`💵 Dealer **Blackjack**`);
			}
			this.moveToNextPlayer();
			return;
		}

		const cardsNum: number = parseInt(cards);
		if (cardsNum > 21) {
			player.state = PlayerState.BUSTED;
			if (player.id !== 'dealer') {
				this.pubMessage(`  <@${player.id}> busted`);
			} else {
				this.pubMessage(`  Dealer busted`);
			}
			this.moveToNextPlayer();
			return;
		}

		if (player.id === 'dealer' && cardsNum >= 17) {
			player.state = PlayerState.STAND;
			this.pubMessage('- Dealer stands');
			return;
		}

		if (player.state === PlayerState.STAND) {
			this.pubMessage(`- <@${player.id}> stands`);
			this.moveToNextPlayer();
		}
	}

	private dealToPlayer(player: BlackjackPlayer) {
		const card: Card = Deck.getCard();
		if (player.id !== 'dealer') {
			this.pubMessage(`+ <@${player.id}> ${card.name}`);
		} else {
			if (player.cards.length === 0) {
				this.pubMessage(`+ Dealer: ?`);
			} else {
				this.pubMessage(`+ Dealer: ${card.name}`);
			}
		}

		player.cards.push(card);
		player.state = PlayerState.WAITING;
		this.updatePlayerState(player);
	}

	private initialize() {
		let shuffled: boolean = Deck.newRound();
		if (shuffled) {
			this.pubMessage('Shuffled');
		}

		const dealer: BlackjackPlayer = { cards: [], state: PlayerState.WAITING, id: 'dealer' };
		this.players.push(dealer);
	}
}

export default BlackjackGame;
