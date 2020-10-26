import expressPromiseRouter from 'express-promise-router';
import { ImageError, ImageRouteResponse } from './types';
import * as jwt from 'jsonwebtoken';
import { JWTData, JWTDiscordAuth } from '../auth/types';
import { fetchUserIdentity, userOnServer } from '../../discord';
import { DBDiscordData, DBImage, DBImageWithUserInfo } from '../../../db/types';
import { knex } from '../../../db/utils';
import { ImageSubmission, SubmissionType } from '../userRoute/types';
import { UserData } from '../../types';
import { verifyIdentity } from '../middleware/middleware';

const router = expressPromiseRouter();

router.get('/', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userJWT: string = bearer.split('Bearer ')[1];

	const decoded: JWTData = jwt.verify(
		userJWT,
		process.env.JWT_SECRET,
	) as JWTData;

	const authenticatedJwt: JWTDiscordAuth = decoded as JWTDiscordAuth;
	const identity: DBDiscordData = await fetchUserIdentity(authenticatedJwt);

	const userData: UserData = {
		avatar: identity.avatar,
		name: identity.username,
		snowflake: identity.snowflake,
		tag: identity.discriminator,
	};

	const dbImages: DBImageWithUserInfo[] = await knex<DBImageWithUserInfo>(
		'images',
	)
		.join('users', 'users.snowflake', 'images.submission_by')
		.select('*');
	const imageSubmissions: ImageSubmission[] = dbImages.map(
		(image): ImageSubmission => {
			return {
				name: image.name,
				original_link: image.original_link,
				submission_by: `${image.discord_name_original}#${image.discord_tag}`,
				submission_date: image.submission_date,
				submission_type: SubmissionType.IMAGE,
				views: image.views,
			};
		},
	);

	const response: ImageRouteResponse = {
		error: false,
		submissions: imageSubmissions,
		userData,
	};

	res.json(response);
});

export default router;
