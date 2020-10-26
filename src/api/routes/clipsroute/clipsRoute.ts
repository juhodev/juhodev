import expressPromiseRouter from 'express-promise-router';
import { DBClipWithUserInfo, DBDiscordData } from '../../../db/types';
import { fetchUserIdentity } from '../../discord';
import { JWTData, JWTDiscordAuth } from '../auth/types';
import { verifyIdentity } from '../middleware/middleware';
import * as jwt from 'jsonwebtoken';
import { knex } from '../../../db/utils';
import { ClipSubmission, SubmissionType } from '../userRoute/types';
import { UserData } from '../../types';
import { ClipsRouteResponse } from './types';

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

	const dbClips: DBClipWithUserInfo[] = await knex<DBClipWithUserInfo>(
		'clips',
	)
		.join('users', 'users.snowflake', 'clips.submission_by')
		.select('*');
	const clipSubmissions: ClipSubmission[] = dbClips.map(
		(clip): ClipSubmission => {
			return {
				name: clip.name,
				original_link: clip.original_link,
				submission_by: `${clip.discord_name_original}#${clip.discord_tag}`,
				submission_type: SubmissionType.CLIP,
				submission_date: clip.submission_date,
				views: clip.views,
				clip_length: clip.clip_length,
				clip_start: clip.clip_start,
			};
		},
	);

	const response: ClipsRouteResponse = {
		error: false,
		submissions: clipSubmissions,
		userData,
	};

	res.json(response);
});

export default router;
