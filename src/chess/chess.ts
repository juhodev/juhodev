import { ChessPlayer } from './types';
import { knex } from '../db/utils';
import { DBChessGame, DBChessUser } from '../db/types';
import { isNil } from '../utils';
import fetch from 'node-fetch';

class Chess {
	private players: Map<string, ChessPlayer>;

	constructor() {
		this.players = new Map();
	}

	async load() {
		// // figure this out later
		// this.players = new Map();

		// const allGames: DBChessGame[] = await knex<DBChessGame>('chess_game');
		// allGames.sort((a, b) => a.created_at - b.created_at);

		// for (const game of allGames) {
		// 	this.updateUsers(game);
		// }
	}

	async getProfile(user: string): Promise<ChessPlayer> {
		const result = await fetch(`http://localhost:5000/api/chess/profile?user=${user}`);
		const json = await result.json();

		return json as ChessPlayer;
	}

	async getPlayerLastGame(user: string): Promise<number> {
		const dbUser: DBChessUser = await knex<DBChessUser>('chess_user').where({ user_id: user }).orderBy('last_loaded_game', 'desc').first();

		if (isNil(dbUser)) {
			return -1;
		}

		return dbUser.last_loaded_game;
	}
};

export default Chess;
