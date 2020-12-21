import expressPromiseRouter from 'express-promise-router';
import { DBDiscordData } from '../../../db/types';
import * as jwt from 'jsonwebtoken';
import { ERROR, UserBasicData, UserRouteResponse } from './types';
import { JWTData, JWTDiscordAuth } from '../auth/types';
import { fetchUserIdentity, userOnServer } from '../../discord';
import { getUserSubmissionsWithSnowflake } from '../../user';
import { verifyIdentity } from '../middleware/middleware';

const 
router = expressPromiseRouter();

router.get('/', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userJWT: string = bearer.split('Bearer ')[1];

	const decoded: JWTData = jwt.verify(
		userJWT,
		process.env.JWT_SECRET,
	) as JWTData;

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

	const userBasicData: UserBasicData = await getUserSubmissionsWithSnowflake(
		identity.snowflake,
	);

	if (userBasicData === undefined) {
		res.json({ error: true });
		return;
	}

	const response: UserRouteResponse = {
		error: false,
		userData: userBasicData,
	};
	res.json(response);
});

export default router;
