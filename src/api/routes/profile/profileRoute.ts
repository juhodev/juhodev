import expressPromiseRouter from 'express-promise-router';
import { UserData, UserProfile } from '../../types';
import {
	getUserDataWithBearer,
	getUserDataWithSnowflake,
	getUserProfile,
} from '../../user';
import { verifyIdentity } from '../middleware/middleware';
import { ProfileRouteResponse } from './types';

const router = expressPromiseRouter();

router.get('/', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);
	const userProfile: UserProfile = await getUserProfile(userData.snowflake);

	const response: ProfileRouteResponse = {
		error: false,
		userProfile,
		userData,
	};

	res.json(response);
});

router.get('/:snowflake', [verifyIdentity], async (req, res) => {
	const { snowflake } = req.params;
	const userProfile: UserProfile = await getUserProfile(snowflake);
	const userData: UserData = await getUserDataWithSnowflake(snowflake);

	const response: ProfileRouteResponse = {
		error: false,
		userProfile,
		userData,
	};

	res.json(response);
});

export default router;
