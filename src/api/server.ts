import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

import UserRouter from './routes/user/userRoute';
import AuthRouter from './routes/auth/authRoute';
import ImageRouter from './routes/images/imagesRoute';
import ClipsRouter from './routes/clips/clipsRoute';
import ProfileRouter from './routes/profile/profileRoute';
import SteamRouter from './routes/steam/steamRoute';

import Steam from '../steam/steam';

const { ENVIRONMENT } = process.env;

export const steam: Steam = new Steam();

export function startApi() {
	const app = express();
	app.use(bodyParser.json());
	if (process.env.ENVIRONMENT === 'dev') {
		app.use(cors());
	}

	app.use((req, res, next) => {
		console.log(`Request ${req.url}`);
		next();
	});

	const corsOptions = {
		origin: 'https://steamcommunity.com',
		optionsSuccessStatus: 200,
	};

	app.use('/api/user', UserRouter);
	app.use('/api/auth', AuthRouter);
	app.use('/api/images', ImageRouter);
	app.use('/api/clips', ClipsRouter);
	app.use('/api/profile', ProfileRouter);
	app.use('/api/steam', cors(corsOptions), SteamRouter);

	app.use('/baavo', express.static('data/baavo'));
	app.use('/img', express.static('data/imgs'));
	app.use('/dist', express.static('dist', { dotfiles: 'allow' }));

	app.use('*', (req, res) => {
		res.sendFile(path.resolve('dist', 'index.html'));
	});

	const httpPort: number = parseInt(process.env.HTTP_PORT);
	app.listen(httpPort, () => {
		console.log(`Listening on port ${httpPort}`);
	});

	if (ENVIRONMENT === 'prod') {
		const privKey: string = fs.readFileSync(
			'/etc/letsencrypt/live/juho.dev/privkey.pem',
			'utf-8',
		);
		const cert: string = fs.readFileSync(
			'/etc/letsencrypt/live/juho.dev/cert.pem',
			'utf-8',
		);
		const ca = fs.readFileSync(
			'/etc/letsencrypt/live/juho.dev/cert.pem',
			'utf-8',
		);
		const creds = {
			key: privKey,
			cert,
			ca,
		};

		const httpsServer = https.createServer(creds, app);
		httpsServer.listen(443, () => {
			console.log('https listening on port 443');
		});
	}
}
