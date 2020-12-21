import expressPromiseRouter from 'express-promise-router';
import { demoMaster } from '../../server';
import { saveMatch } from '../../../steam/matchsharing/matchSharing';
import { WorkerStatus } from '../../../steam/matchsharing/demos/types';

const router = expressPromiseRouter();

router.get('/status', [], async (req, res) => {
	const status: WorkerStatus[] = await demoMaster.getStatus();

	res.json({ error: false, status });
});

router.post('/worker', [workerPasswordCheck], (req, res) => {
	const { address } = req.body;

	demoMaster.register(address);
	res.sendStatus(200);
});

router.post('/demo', [workerPasswordCheck], async (req, res) => {
	const { match, address } = req.body;

	// The match will be undefined if the worker couldn't download it
	if (match !== undefined) {
		await saveMatch(match);
	}

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
