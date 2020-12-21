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
} from '../../../steam/types';
import {
	SteamGamesResponse,
	SteamLeaderboardResponse,
	SteamLinkResponse,
	SteamMatchResponse,
	SteamProfilesResponse,
	SteamRouteResponse,
	SteamSearchResponse,
	SteamStatisticsResponse,
	SteamUploadCodeResponse,
	SteamUserResponse,
} from './types';
import { UserData } from '../../types';
import { getUserDataWithBearer } from '../../user';
import {
	ExtensionSaveResponse,
	UploadCode,
} from '../../../steam/extension/types';
import { siteMetrics } from '../../..';

const router = expressPromiseRouter();

router.get('/search', [], async (req, res) => {
	const { q } = req.query;

	siteMetrics.time('search');
	const csgoUsers: CsgoUser[] = await steam.search(q);
	const response: SteamSearchResponse = {
		error: false,
		searchResult: csgoUsers,
	};
	siteMetrics.timeEnd('search');

	res.json(response);
});

router.get('/match', [], async (req, res) => {
	const { id } = req.query;
	siteMetrics.time('match');
	const csgoMatch: CsgoMatch = await steam.getMatchFromDB(id);
	const response: SteamMatchResponse = {
		error: false,
		csgoMatch,
	};
	siteMetrics.timeEnd('match');

	res.json(response);
});

router.post('/stats', [], async (req, res) => {
	const { games, uploadCode } = req.body;

	const response: ExtensionSaveResponse = await steam.addDataFromExtension(
		games,
		uploadCode,
	);

	res.json(response);
});

router.get('/uploadCode', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);
	const uploadCode: UploadCode = steam
		.getExtension()
		.getUploadCode(userData.snowflake);

	const response: SteamUploadCodeResponse = {
		error: false,
		uploadCode: uploadCode.code,
		userData,
	};

	res.json(response);
});

router.get('/games', [], async (req, res) => {
	const { id, page } = req.query;

	siteMetrics.time('games');
	const games: GameWithStats[] = await steam.getPlayerMatches(id, page);
	const mapStatistics: MapStatistics = await steam.getPlayerMapStatistics(id);
	const matchFrequency: DateMatches[] = await steam.getPlayerMatchFrequency(
		id,
	);
	siteMetrics.timeEnd('games');

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

router.get('/leaderboard', [], async (req, res) => {
	const response: SteamLeaderboardResponse = {
		error: false,
		leaderboard: await steam.getLeaderboards(),
	};

	res.json(response);
});

router.get('/profiles', [], async (req, res) => {
	const response: SteamProfilesResponse = {
		error: false,
		profiles: steam.getBuiltProfiles(),
	};

	res.json(response);
});

router.get('/statistics', [], async (req, res) => {
	const { playerId, type, soloQueue } = req.query;

	siteMetrics.time('get_player_statistics');
	const statistics: number[] = await steam.getPlayerStatistics(
		playerId,
		type,
		soloQueue == 'true', // oh man
	);
	siteMetrics.timeEnd('get_player_statistics');

	const response: SteamStatisticsResponse = {
		error: false,
		data: statistics.reverse(),
	};

	res.json(response);
});

router.post('/link', [], async (req, res) => {
	const { profile, authenticationCode, knownCode } = req.body;

	const response: SteamLinkResponse = await steam.addMatchSharingCode(
		profile,
		authenticationCode,
		knownCode,
	);
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
