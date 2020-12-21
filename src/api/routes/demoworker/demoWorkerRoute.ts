import expressPromiseRouter from 'express-promise-router';
import { demoMaster } from '../../server';
import { saveMatch } from '../../../steam/matchsharing/matchSharing';

const router = expressPromiseRouter();

router.post('/worker', [workerPasswordCheck], (req, res) => {
	const { address } = req.body;

	demoMaster.register(address);
	res.sendStatus(200);
});

router.post('/demo', [workerPasswordCheck], async (req, res) => {
	const { match, address } = req.body;

	await saveMatch(match);
	demoMaster.jobFinished(address);
	res.sendStatus(200);
});

function workerPasswordCheck(req, res, next) {
	const { DEMO_WORKER_PASSWORD } = process.env;
	const { password } = req.body;

	if (DEMO_WORKER_PASSWORD !== password) {
		res.sendStatus(403);
		return;
	}

	next();
}

export default router;
