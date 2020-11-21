import expressPromiseRouter from 'express-promise-router';
import * as jwt from 'jsonwebtoken';
import {
	CodeResponse,
	DiscordAccessToken,
	JWTAuth,
	JWTBasicAuth,
	JWTData,
	UserType,
} from './types';
import fetch from 'node-fetch';
import { knex } from '../../../db/utils';
import { DBDiscordData, DBDiscordToken } from '../../../db/types';
import { uuid } from 'uuidv4';
import { verifyWebsiteLogin } from '../middleware/middleware';

const router = expressPromiseRouter();

router.post('/', (req, res) => {
	const { password } = req.body;

	const { WEBSITE_PASSWORD, JWT_SECRET } = process.env;
	if (password === WEBSITE_PASSWORD) {
		const jwtData: JWTAuth = {
			userType: UserType.WEBSITE_LOGIN,
		};
		const token: string = jwt.sign(jwtData, JWT_SECRET);
		res.json({ token });
	} else {
		res.json({ token: undefined });
	}
});

router.post('/preview', (req, res) => {
	const { JWT_SECRET } = process.env;
	const jwtData: JWTAuth = {
		userType: UserType.PREVIEW_ONLY,
	};

	const token: string = jwt.sign(jwtData, JWT_SECRET);
	res.json({ token });
});

router.post('/code', [verifyWebsiteLogin], async (req, res) => {
	const { code } = req.body;

	const {
		DISCORD_CLIENT_ID,
		DISCORD_CLIENT_SECRET,
		ENVIRONMENT,
		JWT_SECRET,
	} = process.env;
	const redirectUrl =
		ENVIRONMENT === 'dev'
			? 'http://localhost:8888/auth'
			: 'https://juho.dev/auth';

	const params = new URLSearchParams();
	params.append('client_id', DISCORD_CLIENT_ID);
	params.append('client_secret', DISCORD_CLIENT_SECRET);
	params.append('grant_type', 'authorization_code');
	params.append('code', code);
	params.append('redirect_uri', redirectUrl);
	params.append('scope', 'identity');

	const response = await fetch(`https://discord.com/api/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
	});
	const json = await response.json();
	const accessToken: DiscordAccessToken = json;

	const bearer: string = req.headers.authorization;
	if (bearer !== undefined) {
		const userJWT: string = bearer.split('Bearer ')[1];

		const decoded: JWTData = jwt.verify(
			userJWT,
			process.env.JWT_SECRET,
		) as JWTData;

		const uuid: string = decoded['uuid'];

		if (uuid !== undefined) {
			await knex<DBDiscordToken>('discord_tokens')
				.delete()
				.where({ uuid });

			await knex<DBDiscordData>('discord_data').delete().where({ uuid });
		}
	}

	const userUuid = uuid();

	await knex<DBDiscordToken>('discord_tokens').insert({
		access_token: accessToken.access_token,
		expires_in: accessToken.expires_in,
		issued_at: new Date().getTime(),
		refresh_token: accessToken.refresh_token,
		uuid: userUuid,
	});

	const discordAuthData: JWTAuth = {
		userType: UserType.DISCORD_LOGIN,
		uuid: userUuid,
	};

	const token: string = jwt.sign(discordAuthData, JWT_SECRET);

	const codeResponse: CodeResponse = {
		error: false,
		jwt: token,
	};

	res.json(codeResponse);
});

export default router;
