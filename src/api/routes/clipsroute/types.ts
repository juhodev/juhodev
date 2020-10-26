import { UserData } from '../../types';
import { ClipSubmission } from '../userRoute/types';

export type ClipsRouteResponse = {
	error: boolean;
	errorCode?: number;
	submissions?: ClipSubmission[];
	userData?: UserData;
};

export const ClipsError = {
	DISCORD_NOT_AUTHENTICATED: 0,
	USER_NOT_ON_SERVER: 1,
};
