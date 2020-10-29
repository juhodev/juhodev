import { UserData, UserProfile } from '../../types';

export type ProfileRouteResponse = {
	error: boolean;
	errorCode?: number;
	userData?: UserData;
	userProfile: UserProfile;
};

export const ProfileError = {
	DISCORD_NOT_AUTHENTICATED: 0,
	USER_NOT_ON_SERVER: 1,
};
