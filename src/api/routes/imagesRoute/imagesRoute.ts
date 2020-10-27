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
import { downloadImage } from '../../../utils';
import { getUserDataWithBearer } from '../../user';

const router = expressPromiseRouter();

router.get('/', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);

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

router.get('/:image', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);

	const { image } = req.params;
	const dbImage: DBImageWithUserInfo = await knex<DBImageWithUserInfo>(
		'images',
	)
		.join('users', 'users.snowflake', 'images.submission_by')
		.where({ name: image })
		.select('*')
		.first();

	if (dbImage === undefined) {
		const response: ImageRouteResponse = {
			error: true,
			errorCode: ImageError.IMAGE_DOES_NOT_EXIST,
			submissions: [
				{
					original_link:
						'https://cdn.discordapp.com/attachments/324620441195118592/770571708365013032/xkcd.PNG',
					name: 'Not found',
					views: 0,
					submission_date: 0,
					submission_by: 'User#0000',
					submission_type: SubmissionType.IMAGE,
				},
			],
			userData,
		};

		res.json(response);
		return;
	}

	const response: ImageRouteResponse = {
		error: false,
		submissions: [
			{
				original_link: dbImage.original_link,
				name: dbImage.name,
				submission_by: `${dbImage.discord_name_original}#${dbImage.discord_tag}`,
				submission_date: dbImage.submission_date,
				submission_type: SubmissionType.IMAGE,
				views: dbImage.views,
			},
		],
		userData,
	};

	res.json(response);
});

router.post('/', [verifyIdentity], async (req, res) => {
	const bearer: string = req.headers.authorization;
	const userData: UserData = await getUserDataWithBearer(bearer);

	const { name, link } = req.body;

	const imageExists: DBImage = await knex<DBImage>('images')
		.where({ name })
		.first();

	if (imageExists !== undefined) {
		const response: ImageRouteResponse = {
			error: true,
			errorCode: ImageError.NAME_ALREADY_EXISTS,
		};

		res.json(response);
		return;
	}

	const dbImage: DBImage = {
		deleted: false,
		original_link: link,
		submission_by: userData.snowflake,
		submission_date: new Date().getTime(),
		views: 0,
		name,
	};

	await downloadImage(dbImage);

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
