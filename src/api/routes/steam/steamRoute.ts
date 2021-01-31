import expressPromiseRouter from 'express-promise-router';
import { steam } from '../../server';
import { verifyIdentity } from '../middleware/middleware';
import {
	AddResponse,
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
	SteamUniqueMapsResponse,
	SteamUploadCodeResponse,
	SteamUserResponse,
} from './types';
import { UserData } from '../../types';
import { getUserDataWithBearer } from '../../user';
import { ExtensionSaveResponse, UploadCode } from '../../../steam/extension/types';
import { csgo, siteMetrics } from '../../..';
import { CsgoMatch, MatchWithPlayerStats } from '../../../steam/csgo/types';

const router = expressPromiseRouter();

router.get('/search', [], (req, res) => {
	const { q } = req.query;

	siteMetrics.time('search');
	const csgoUsers: CsgoUser[] = csgo.search(q);
	const response: SteamSearchResponse = {
		error: false,
		searchResult: csgoUsers,
	};
	siteMetrics.timeEnd('search');

	res.json(response);
});

router.get('/match', [], (req, res) => {
	const { id } = req.query;
	siteMetrics.time('match');
	const csgoMatch: CsgoMatch = csgo.getMatch(parseInt(id));
	const response: SteamMatchResponse = {
		error: false,
		csgoMatch,
	};
	siteMetrics.timeEnd('match');

	res.json(response);
});

router.post('/stats', [], async (req, res) => {
	const { games, uploadCode } = req.body;

	const response: ExtensionSaveResponse = await steam.addDataFromExtension(games, uploadCode);

	res.json(response);
});

router.get('/uploadCode', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);
	const uploadCode: UploadCode = steam.getExtension().getUploadCode(userData.snowflake);

	const response: SteamUploadCodeResponse = {
		error: false,
		uploadCode: uploadCode.code,
		userData,
	};

	res.json(response);
});

router.get('/games', [], (req, res) => {
	const { id, page, map } = req.query;

	const matches: MatchWithPlayerStats[] = csgo.getPlayer(id).getMatches(page, map);
	const response: SteamGamesResponse = {
		matches,
		error: false,
	};

	res.json(response);
});

router.get('/user', [], (req, res) => {
	const { id } = req.query;

	const user: SteamUser = csgo.getUser(id);
	const response: SteamUserResponse = {
		user,
		error: false,
	};

	res.json(response);
});

router.get('/profiles', [], async (req, res) => {
	const response: SteamProfilesResponse = {
		error: false,
		profiles: csgo.getTopProfilePreviews(),
	};

	res.json(response);
});

router.get('/statistics', [], async (req, res) => {
	// TODO: Maybe one day fix returning only soloQueue matches
	const { playerId, type, soloQueue } = req.query;

	siteMetrics.time('get_player_statistics');
	const statistics: number[] = csgo.getPlayer(playerId).getStatistics(type);
	siteMetrics.timeEnd('get_player_statistics');

	const response: SteamStatisticsResponse = {
		error: false,
		data: statistics,
	};

	res.json(response);
});

router.post('/link', [], async (req, res) => {
	const { profile, authenticationCode, knownCode } = req.body;

	const response: SteamLinkResponse = await steam.addMatchSharingCode(profile, authenticationCode, knownCode);
	res.json(response);
});

router.get('/uniquemaps', [], (req, res) => {
	const { id } = req.param;

	const response: SteamUniqueMapsResponse = {
		error: false,
		data: csgo.getPlayer(id).getUniqueMaps(),
	};

	res.json(response);
});

router.get('/:id', [], (req, res) => {
	const { id } = req.params;
	const profile: CsgoProfile = csgo.getProfile(id);

	const response: SteamRouteResponse = {
		error: false,
		csgoProfile: profile,
	};

	res.json(response);
});

export default router;
