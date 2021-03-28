import expressPromiseRouter from 'express-promise-router';
import { verifyIdentity } from '../middleware/middleware';
import { getCommandLeaderboard, getDiscordCommands } from '../../../metrics/discord';
import { CommandCount } from '../../../metrics/types';

const router = expressPromiseRouter();

router.get('/commands', [verifyIdentity], async (req, res) => {
	const commands: string[] = await getDiscordCommands();
	res.json(commands);
});

router.get('/command', [verifyIdentity], async (req, res) => {
	const { q } = req.query;
	const commands: CommandCount[] = await getCommandLeaderboard(q);
	res.json(commands);
});

export default router;
