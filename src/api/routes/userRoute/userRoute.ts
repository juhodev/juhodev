import expressPromiseRouter from 'express-promise-router';
import {
	DBClip,
	DBDiscordData,
	DBImage,
	DBQuote,
	DBUser,
} from '../../../db/types';
import { knex } from '../../../db/utils';
import * as jwt from 'jsonwebtoken';
import {
	ClipSubmission,
	ERROR,
	ImageSubmission,
	QuoteSubmission,
	SubmissionType,
	UserBasicData,
	UserRouteResponse,
} from './types';
import { JWTData, JWTDiscordAuth } from '../auth/types';
import { fetchUserIdentity } from '../../discord';
import { getUserDataWithSnowflake } from '../../user';

const router = expressPromiseRouter();

router.get('/', async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userJWT: string = bearer.split('Bearer ')[1];

	const decoded: JWTData = jwt.verify(
		userJWT,
		process.env.JWT_SECRET,
	) as JWTData;

	if (!decoded.discordAuthenticated) {
		const response: UserRouteResponse = {
			error: true,
			errorCode: ERROR.DISCORD_NOT_AUTHENTICATED,
		};

		res.json(response);
		return;
	}

	const authenticatedJwt: JWTDiscordAuth = decoded as JWTDiscordAuth;
	const identity: DBDiscordData = await fetchUserIdentity(authenticatedJwt);
	const userBasicData: UserBasicData = await getUserDataWithSnowflake(
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
