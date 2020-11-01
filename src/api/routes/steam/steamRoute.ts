import expressPromiseRouter from 'express-promise-router';
import { steam } from '../../server';
import { verifyIdentity } from '../middleware/middleware';
import { CsgoProfile, CsgoUser } from '../../../steam/types';
import { SteamRouteResponse, SteamSearchResponse } from './types';
import { UserData } from '../../types';
import { getUserDataWithBearer } from '../../user';

const router = expressPromiseRouter();

router.get('/search', [verifyIdentity], async (req, res) => {
	const { q } = req.query;

	const csgoUsers: CsgoUser[] = await steam.search(q);
	const response: SteamSearchResponse = {
		error: false,
		searchResult: csgoUsers,
	};

	res.json(response);
});

router.get('/:id', [verifyIdentity], async (req, res) => {
	const { id } = req.params;
	const profile: CsgoProfile = await steam.getProfile(id);

	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);

	const response: SteamRouteResponse = {
		error: false,
		userData,
		csgoProfile: profile,
	};

	res.json(response);
});

router.post('/', [], async (req, res) => {
	const { url } = req.body;

	await steam.saveData(url);
	res.sendStatus(200);
});

export default router;
