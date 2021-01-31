import { CsgoMatch, MatchWithPlayerStats } from '../../../steam/csgo/types';
import {
	BuiltProfile,
	CsgoPlayer,
	CsgoProfile,
	CsgoUser,
	DateMatches,
	GameWithStats,
	MapStatistics,
	SteamUser,
} from '../../../steam/types';
import { UserData } from '../../types';

export type SteamRouteResponse = {
	error: boolean;
	errorCode?: number;
	userData?: UserData;
	csgoProfile?: CsgoProfile;
};

export type SteamSearchResponse = {
	error: boolean;
	errorCode?: number;
	searchResult?: CsgoUser[];
};

export type SteamMatchResponse = {
	error: boolean;
	errorCode?: number;
	csgoMatch: CsgoMatch;
};

export type SteamUploadCodeResponse = {
	error: boolean;
	userData?: UserData;
	errorCode?: number;
	uploadCode?: string;
};

export type SteamGamesResponse = {
	error: boolean;
	errorCode?: number;
	matches?: MatchWithPlayerStats[];
	mapStatistics?: MapStatistics;
	matchFrequency?: DateMatches[];
};

export type SteamUserResponse = {
	error: boolean;
	errorCode?: number;
	user?: SteamUser;
};

export type SteamLeaderboardResponse = {
	error: boolean;
	errorCode?: number;
	leaderboard?: CsgoPlayer[];
};

export type SteamProfilesResponse = {
	error: boolean;
	errorCode?: number;
	profiles?: BuiltProfile[];
};

export type SteamStatisticsResponse = {
	error: boolean;
	errorCode?: number;
	data: number[];
};

export type SteamLinkResponse = {
	error: boolean;
	errorCode?: number;
};

export type SteamUniqueMapsResponse = {
	error: boolean;
	errorCode?: number;
	data: string[];
};

export const SteamError = {
	DISCORD_NOT_AUTHENTICATED: 0,
	USER_NOT_ON_SERVER: 1,
	COULD_NOT_FETCH_MATCH_CODE: 2,
};
