import {
	BuiltProfile,
	CsgoMatch,
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
	userData?: UserData;
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
	games?: GameWithStats[];
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
