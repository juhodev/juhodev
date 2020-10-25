import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

import UserRouter from './routes/userRoute/userRoute';
import AuthRouter from './routes/auth/authRoute';

const { ENVIRONMENT } = process.env;

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

	app.use('/api/user', UserRouter);
	app.use('/api/auth', AuthRouter);

	app.use('/baavo', express.static('data/baavo'));
	app.use('/img', express.static('data/imgs'));
	app.use('/', express.static('dist', { dotfiles: 'allow' }));

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
			'etc/letsencrypt/live/juho.dev/cert.pem',
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
