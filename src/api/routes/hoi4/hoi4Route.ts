import expressPromiseRouter from 'express-promise-router';
import { getGames, processHoi4File, getGame } from '../../../hoi4/hoi4';
import { GameInfo, Hoi4Save } from '../../../hoi4/types';

const router = expressPromiseRouter();

router.post('/game', async (req, res) => {
	console.log('received', req['files']);
	const { tempFilePath } = req['files']['hoi4'];
	const gameId: number = await processHoi4File(tempFilePath);
	res.json({ error: false, game: gameId });
});

router.get('/games', async (req, res) => {
	const games: GameInfo[] = await getGames();
	res.json({ error: false, games });
});

router.get('/game/:gameId', async (req, res) => {
	const { gameId } = req.params;

	if (gameId === undefined) {
		res.status(404).json({ error: true, message: 'Game not found' });
		return;
	}

	const game: Hoi4Save = await getGame(parseInt(gameId));
	if (game === undefined) {
		res.status(404).json({ error: true, message: 'Game not found' });
		return;
	}

	res.json({ error: false, game });
});

export default router;
