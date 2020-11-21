import expressPromiseRouter from 'express-promise-router';
import { steam } from '../../server';
import { verifyIdentity } from '../middleware/middleware';
import {
	AddResponse,
	CsgoMatch,
	CsgoProfile,
	CsgoUser,
	DateMatches,
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

router.get('/search', [], async (req, res) => {
	const { q } = req.query;

	const csgoUsers: CsgoUser[] = await steam.search(q);
	const response: SteamSearchResponse = {
		error: false,
		searchResult: csgoUsers,
	};

	res.json(response);
});

router.get('/match', [], async (req, res) => {
	const { id } = req.query;
	const csgoMatch: CsgoMatch = await steam.getMatchFromDB(id);
	const response: SteamMatchResponse = {
		error: false,
		csgoMatch,
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

router.get('/games', [], async (req, res) => {
	const { id, page } = req.query;

	const games: GameWithStats[] = await steam.getPlayerMatches(id, page);
	const mapStatistics: MapStatistics = await steam.getPlayerMapStatistics(id);
	const matchFrequency: DateMatches[] = await steam.getPlayerMatchFrequency(
		id,
	);

	const response: SteamGamesResponse = {
		games,
		mapStatistics,
		matchFrequency,
		error: false,
	};

	res.json(response);
});

router.get('/user', [], async (req, res) => {
	const { id } = req.query;

	const user: SteamUser = await steam.getUser(id);
	const response: SteamUserResponse = {
		user,
		error: false,
	};

	res.json(response);
});

router.get('/:id', [], async (req, res) => {
	const { id } = req.params;
	const profile: CsgoProfile = await steam.getProfile(id);

	const response: SteamRouteResponse = {
		error: false,
		csgoProfile: profile,
	};

	res.json(response);
});

export default router;
