import { ChessPlayer } from './types';
import { knex } from '../db/utils';
import { DBChessGame, DBChessUser } from '../db/types';
import { isNil } from '../utils';

class Chess {
	private players: Map<string, ChessPlayer>;

	constructor() {
		this.players = new Map();
	}

	async load() {
		// figure this out later
		this.players = new Map();

		const allGames: DBChessGame[] = await knex<DBChessGame>('chess_game');
		allGames.sort((a, b) => a.created_at - b.created_at);

		for (const game of allGames) {
			this.updateUsers(game);
		}
	}

	getProfile(user: string): ChessPlayer | null {
		return this.players.get(user);
	}

	async getPlayerLastGame(user: string): Promise<number> {
		const dbUser: DBChessUser = await knex<DBChessUser>('chess_user').where({ user_id: user }).orderBy('last_loaded_game', 'desc').first();

		if (isNil(dbUser)) {
			return -1;
		}

		return dbUser.last_loaded_game;
	}

	private updateUsers(game: DBChessGame) {
		let whitePlayer: ChessPlayer;
		let blackPlayer: ChessPlayer;

		if (!this.players.has(game.player_white_id)) {
			whitePlayer = {
				id: game.player_white_id,
				name: game.player_white,
				currentRating: game.player_white_rating,
				rating: {},
				wins: {},
				losses: {},
				draws: {},
				lastMatch: 0,
				openings: {},
				blunders: {
					total: 0,
					gamesJudged: 0,
				},
				mistakes: {
					total: 0,
					gamesJudged: 0,
				},
			};

			this.players.set(whitePlayer.id, whitePlayer);
		} else {
			whitePlayer = this.players.get(game.player_white_id);
		}

		if (!this.players.has(game.player_black_id)) {
			blackPlayer = {
				id: game.player_black_id,
				name: game.player_black,
				currentRating: game.player_black_rating,
				rating: {},
				wins: {},
				losses: {},
				draws: {},
				lastMatch: 0,
				openings: {},
				blunders: {
					total: 0,
					gamesJudged: 0,
				},
				mistakes: {
					total: 0,
					gamesJudged: 0,
				},
			};

			this.players.set(blackPlayer.id, blackPlayer);
		} else {
			blackPlayer = this.players.get(game.player_black_id);
		}

		if (isNil(whitePlayer.rating[game.speed])) {
			whitePlayer.rating[game.speed] = [];
		}

		if (game.rated) {
			whitePlayer.rating[game.speed].push(game.player_white_rating);
		}

		if (isNil(blackPlayer.rating[game.speed])) {
			blackPlayer.rating[game.speed] = [];
		}

		if (game.rated) {
			blackPlayer.rating[game.speed].push(game.player_black_rating);
		}

		if (isNil(whitePlayer.wins[game.speed])) {
			whitePlayer.wins[game.speed] = 0;
		}

		if (isNil(whitePlayer.losses[game.speed])) {
			whitePlayer.losses[game.speed] = 0;
		}

		if (isNil(whitePlayer.draws[game.speed])) {
			whitePlayer.draws[game.speed] = 0;
		}

		if (isNil(blackPlayer.wins[game.speed])) {
			blackPlayer.wins[game.speed] = 0;
		}

		if (isNil(blackPlayer.losses[game.speed])) {
			blackPlayer.losses[game.speed] = 0;
		}

		if (isNil(blackPlayer.draws[game.speed])) {
			blackPlayer.draws[game.speed] = 0;
		}

		if (isNil(game.winner)) {
			whitePlayer.draws[game.speed]++;
			blackPlayer.draws[game.speed]++;
		} else {
			if (game.winner === 'white') {
				whitePlayer.wins[game.speed]++;
				blackPlayer.losses[game.speed]++;
			} else {
				blackPlayer.wins[game.speed]++;
				whitePlayer.losses[game.speed]++;
			}
		}

		if (isNil(whitePlayer.openings[game.opening])) {
			whitePlayer.openings[game.opening] = 0;
		}

		whitePlayer.openings[game.opening]++;

		if (game.analysis.length > 0) {
			const analysisJson: any = JSON.parse(game.analysis);
			whitePlayer.blunders.gamesJudged++;
			blackPlayer.blunders.gamesJudged++;
			whitePlayer.mistakes.gamesJudged++;
			blackPlayer.mistakes.gamesJudged++;

			for (let i = 0; i < analysisJson.length; i++) {
				const move = analysisJson[i];

				if (isNil(move['judgment'])) {
					continue;
				}

				const player: ChessPlayer = i % 2 === 0 ? whitePlayer : blackPlayer;
				if (move['judgment']['name'] === 'Blunder') {
					player.blunders.total++;
				}

				if (move['judgment']['name'] === 'Mistake') {
					player.mistakes.total++;
				}
			}
		}
	}
};

export default Chess;
