import fetch from 'node-fetch';
import { DBChessGame, DBChessUser } from '../db/types';
import { knex } from '../db/utils';
import { isNil } from '../utils';
import { chess } from '../index';

export async function fetchGames(user: string): Promise<void> {
	const playerLastMatch: number = await chess.getPlayerLastGame(user);

	let url: string;
	if (playerLastMatch !== -1) {
		url = `https://lichess.org/api/games/user/${user}?opening=true&evals=true&since=${playerLastMatch}`;
	} else {
		url = `https://lichess.org/api/games/user/${user}?opening=true&evals=true`;
	}

	const response = fetch(url, {
		headers: {
			accept: "application/x-ndjson",
		},
	});

	let newGames: number = 0;
	const onMessage = (obj: unknown) => {
		if (isNil(obj)) {
			return;
		}

		newGames++;
		saveGame(user, obj);
	};

	await response.then(readStream(onMessage));

	if (newGames > 0) {
		console.log(`${newGames} games loaded`);
		await chess.load();
	}
}

const onComplete = () => console.log('read');

async function saveGame(user: string, game: any) {
	const dbGames: DBChessGame[] = await knex<DBChessGame>('chess_game').where({ id: game['id'] });
	if (dbGames.length > 0) {
		return;
	}

	const dbUser: DBChessUser = await knex<DBChessUser>('chess_user').where({ user_id: user }).first();
	if (!isNil(dbUser)) {
		if (dbUser.last_loaded_game < game['lastMoveAt']) {
			await knex<DBChessUser>('chess_user').update({ last_loaded_game: game['lastMoveAt'] }).where({ user_id: user });
		}
	} else {
		await knex<DBChessUser>('chess_user').insert({ user_id: user, last_loaded_game: game['lastMoveAt'] });
	}

	if (game['speed'] === 'correspondence') {
		return;
	}

	const dbGame: DBChessGame = {
		id: game['id'],
		rated: game['rated'],
		variant: game['variant'],
		created_at: game['createdAt'],
		opening: !isNil(game['opening']) ? game['opening']['name'] : '',
		moves: game['moves'],
		status: game['status'],
		last_move_at: game['lastMoveAt'],
		player_white: !isNil(game['players']['white']['user']) ? game['players']['white']['user']['name'] : '',
		player_black: !isNil(game['players']['black']['user']) ? game['players']['black']['user']['name'] : '',
		player_white_rating: !isNil(game['players']['white']['user']) ? game['players']['white']['rating'] : -1,
		player_black_rating: !isNil(game['players']['black']['user']) ? game['players']['black']['rating'] : -1,
		player_white_id: !isNil(game['players']['white']['user']) ? game['players']['white']['user']['id'] : '',
		player_black_id: !isNil(game['players']['black']['user']) ? game['players']['black']['user']['id'] : '',
		analysis: game['analysis'] === undefined ? '' : JSON.stringify(game['analysis']),
		speed: game['speed'],
		initial_clock: game['initial'],
		clock_increment: game['increment'],
		winner: game['winner'],
	};

	await knex<DBChessGame>('chess_game').insert(dbGame);
}

/* FOR NODEJS
Utility function to read a ND-JSON HTTP stream.
`processLine` is a function taking a JSON object. It will be called with each element of the stream.
`response` is the result of a `fetch` request.
See usage example in the next file.
*/
const readStream = processLine => response => {
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf = '';
  return new Promise((resolve, fail) => {
    response.body.on('data', v => {
      const chunk = decoder.decode(v, { stream: true });
      buf += chunk;

      const parts = buf.split(matcher);
      buf = parts.pop();
      for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
    });
    response.body.on('end', () => {
      if (buf.length > 0) processLine(JSON.parse(buf));
      resolve(undefined);
    });
    response.body.on('error', fail);
  });
};