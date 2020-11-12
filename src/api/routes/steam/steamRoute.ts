import expressPromiseRouter from 'express-promise-router';
import { steam } from '../../server';
import { verifyIdentity } from '../middleware/middleware';
import {
	AddResponse,
	CsgoMatch,
	CsgoProfile,
	CsgoUser,
	GameWithStats,
	MapStatistics,
	SteamUser,
	UploadCode,
} from '../../../steam/types';
import {
	SteamGamesResponse,
	SteamMatchResponse,
	SteamRouteResponse,
	SteamSearchResponse,
	SteamUploadCodeResponse,
	SteamUserResponse,
} from './types';
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

router.get('/match', [verifyIdentity], async (req, res) => {
	const { id } = req.query;

	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);
	const csgoMatch: CsgoMatch = await steam.getMatchFromDB(id);

	const response: SteamMatchResponse = {
		error: false,
		csgoMatch,
		userData,
	};

	res.json(response);
});

router.post('/stats', [], async (req, res) => {
	const { games, uploadCode } = req.body;

	const addResponse: AddResponse = await steam.addDataFromExtension(
		games,
		uploadCode,
	);

	res.json(addResponse);
});

router.get('/uploadCode', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);
	const uploadCode: UploadCode = steam.getUploadCode(userData.snowflake);

	const response: SteamUploadCodeResponse = {
		error: false,
		uploadCode: uploadCode.code,
		userData,
	};

	res.json(response);
});

router.get('/games', [verifyIdentity], async (req, res) => {
	const { id, page } = req.query;

	const games: GameWithStats[] = await steam.getPlayerMatches(id, page);
	const mapStatistics: MapStatistics = await steam.getPlayerMapStatistics(id);

	const response: SteamGamesResponse = {
		games,
		mapStatistics,
		error: false,
	};

	res.json(response);
});

router.get('/user', [verifyIdentity], async (req, res) => {
	const { id } = req.query;

	const user: SteamUser = await steam.getUser(id);
	const response: SteamUserResponse = {
		user,
		error: false,
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

export default router;
