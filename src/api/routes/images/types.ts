import { UserData } from '../../types';
import { ImageSubmission } from '../user/types';

export type ImageRouteResponse = {
	error: boolean;
	errorCode?: number;
	submissions?: ImageSubmission[];
	userData?: UserData;
};

export const ImageError = {
	DISCORD_NOT_AUTHENTICATED: 0,
	USER_NOT_ON_SERVER: 1,
	NAME_ALREADY_EXISTS: 2,
	IMAGE_DOES_NOT_EXIST: 3,
};
