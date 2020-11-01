import { CsgoProfile, CsgoUser } from '../../../steam/types';
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
