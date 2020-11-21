import * as jwt from 'jsonwebtoken';
import { DBDiscordData } from '../../../db/types';
import { fetchUserIdentity, userOnServer } from '../../discord';
import { JWTData, JWTDiscordAuth, UserType } from '../auth/types';
import { ERROR, UserRouteResponse } from '../user/types';

export const verifyIdentity = async (req, res, next) => {
	const bearer: string = req.headers.authorization;
	if (bearer === undefined) {
		res.sendStatus(401);
		return;
	}

	const userJWT: string = bearer.split('Bearer ')[1];

	const decoded: JWTData = jwt.verify(
		userJWT,
		process.env.JWT_SECRET,
	) as JWTData;

	if (decoded.userType !== UserType.DISCORD_LOGIN) {
		const response: UserRouteResponse = {
			error: true,
			errorCode: ERROR.DISCORD_NOT_AUTHENTICATED,
		};

		res.json(response);
		return;
	}

	const authenticatedJwt: JWTDiscordAuth = decoded as JWTDiscordAuth;
	const identity: DBDiscordData = await fetchUserIdentity(authenticatedJwt);

	if (!userOnServer(identity)) {
		const response: UserRouteResponse = {
			error: true,
			errorCode: ERROR.USER_NOT_ON_SERVER,
		};

		res.json(response);
		return;
	}

	next();
};
