// import BlackjackGame from '../blackjack';
// import { BlackjackPlayer, Card, GameState, PlayerState } from '../types';

// test('should join blackjack game', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');

// 	const player: BlackjackPlayer = game.getPlayers().get('123');
// 	expect(player.id).toBe('123');
// 	expect(player.state).toBe(PlayerState.WAITING);
// });

// test('game should initialize on first join', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');

// 	expect(game.getCards().length).toBe(52 * 4);
// });

// test('start deals cards', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.start();

// 	const dealer: BlackjackPlayer = game.getPlayers().get('dealer');
// 	const player: BlackjackPlayer = game.getPlayers().get('123');

// 	expect(dealer.cards.length).toBe(2);
// 	expect(player.cards.length).toBe(2);
// });

// test('normal card string works', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();

// 	const player: BlackjackPlayer = {
// 		id: '123',
// 		state: PlayerState.WAITING,
// 		cards: [deck.find((x) => x.name === '5 ♥'), deck.find((x) => x.name === '6 ♥')],
// 	};

// 	expect(game.getCardsTotalString(player)).toBe('11');
// });

// test('soft 18 card string', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();

// 	const player: BlackjackPlayer = {
// 		id: '123',
// 		state: PlayerState.WAITING,
// 		cards: [deck.find((x) => x.name === '7 ♥'), deck.find((x) => x.name === 'Ace ♥')],
// 	};

// 	expect(game.getCardsTotalString(player)).toBe('8/18');
// });

// test('over 21 18 card string', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();

// 	const player: BlackjackPlayer = {
// 		id: '123',
// 		state: PlayerState.WAITING,
// 		cards: [
// 			deck.find((x) => x.name === '7 ♥'),
// 			deck.find((x) => x.name === 'Ace ♥'),
// 			deck.find((x) => x.name === 'King ♥'),
// 		],
// 	};

// 	expect(game.getCardsTotalString(player)).toBe('18');
// });

// test('blackjack card string', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();

// 	const player: BlackjackPlayer = {
// 		id: '123',
// 		state: PlayerState.WAITING,
// 		cards: [deck.find((x) => x.name === 'Ace ♥'), deck.find((x) => x.name === 'King ♥')],
// 	};

// 	expect(game.getCardsTotalString(player)).toBe('Blackjack');
// });

// test('stand soft 18', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();

// 	const player: BlackjackPlayer = {
// 		id: '123',
// 		state: PlayerState.STAND,
// 		cards: [deck.find((x) => x.name === '7 ♥'), deck.find((x) => x.name === 'Ace ♥')],
// 	};

// 	expect(game.getCardsTotalString(player)).toBe('18');
// });

// test('dealer soft 17', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();

// 	const player: BlackjackPlayer = {
// 		id: 'dealer',
// 		state: PlayerState.WAITING,
// 		cards: [deck.find((x) => x.name === '6 ♥'), deck.find((x) => x.name === 'Ace ♥')],
// 	};

// 	expect(game.getCardsTotalString(player)).toBe('17');
// });

// test('hit should give a new card to player', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.start();
// 	game.hit('123');

// 	const player: BlackjackPlayer = game.getPlayers().get('123');
// 	expect(player.cards.length).toBe(3);
// });

// test('player state should be busted when cards more than 21', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	const player: BlackjackPlayer = game.getPlayers().get('123');
// 	player.cards.push(
// 		deck.find((x) => x.name === 'King ♥'),
// 		deck.find((x) => x.name === 'Queen ♥'),
// 		deck.find((x) => x.name === 'Jack ♥'),
// 	);
// 	game.forceUpdatePlayerStates();

// 	expect(player.state).toBe(PlayerState.BUSTED);
// });

// test('player should be able to stand', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	const player: BlackjackPlayer = game.getPlayers().get('123');
// 	player.cards.push(
// 		deck.find((x) => x.name === 'King ♥'),
// 		deck.find((x) => x.name === 'Queen ♥'),
// 	);
// 	game.stand('123');

// 	expect(player.state).toBe(PlayerState.STAND);
// });

// test('soft hand should collapse on stand', () => {
// 	const deck: Card[] = createDeck();
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	const player: BlackjackPlayer = game.getPlayers().get('123');
// 	player.cards.push(
// 		deck.find((x) => x.name === 'Ace ♥'),
// 		deck.find((x) => x.name === '8 ♥'),
// 	);
// 	game.stand('123');

// 	expect(player.state).toBe(PlayerState.STAND);
// 	expect(game.getCardsTotalString(player)).toBe('19');
// });

// test('game should end after only player stand', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.start();
// 	game.stand('123');

// 	expect(game.getGameState()).toBe(GameState.ENDED);
// });

// test('game should not end after only one player stands', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.join('666');
// 	game.start();
// 	game.stand('123');

// 	expect(game.getGameState()).toBe(GameState.RUNNING);
// });

// test('game should end when both players stand in correct order', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.join('666');
// 	game.start();
// 	game.stand('123');
// 	game.stand('666');

// 	expect(game.getGameState()).toBe(GameState.ENDED);
// });

// test('game should end when both players stand in wrong order', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.join('666');
// 	game.start();
// 	game.stand('666');
// 	game.stand('123');

// 	expect(game.getGameState()).toBe(GameState.ENDED);
// });

// test('game should not end when later player stands', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.join('666');
// 	game.start();
// 	game.stand('666');

// 	expect(game.getGameState()).toBe(GameState.RUNNING);
// });

// test('game should end when first busts and second stands', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.join('666');
// 	game.start();
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.stand('666');

// 	expect(game.getGameState()).toBe(GameState.ENDED);
// });

// test('game should end when first busts and second stands in wrong order', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.join('666');
// 	game.start();
// 	game.stand('666');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');
// 	game.hit('123');

// 	expect(game.getGameState()).toBe(GameState.ENDED);
// });

// test('dealer should be delt cards until stop when game ends', () => {
// 	const game: BlackjackGame = new BlackjackGame();
// 	game.join('123');
// 	game.start();
// 	game.stand('123');
// 	const dealer: BlackjackPlayer = game.getPlayers().get('dealer');

// 	expect(game.getGameState()).toBe(GameState.ENDED);
// 	expect(dealer.state).not.toBe(PlayerState.WAITING);
// });
