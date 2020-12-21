import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as morgan from 'morgan';

import UserRouter from './routes/user/userRoute';
import AuthRouter from './routes/auth/authRoute';
import ImageRouter from './routes/images/imagesRoute';
import ClipsRouter from './routes/clips/clipsRoute';
import ProfileRouter from './routes/profile/profileRoute';
import SteamRouter from './routes/steam/steamRoute';
import DemoRouter from './routes/demoworker/demoWorkerRoute';
import MetricsRouter from './routes/metrics/metricsRoute';

import Steam from '../steam/steam';

import DemoMaster from '../steam/matchsharing/demos/demoMaster';

const { ENVIRONMENT } = process.env;

export const steam: Steam = new Steam();
export const demoMaster: DemoMaster = new DemoMaster();
demoMaster.init();

export function startApi() {
	const app = express();
	app.use(bodyParser.json());
	if (process.env.ENVIRONMENT === 'dev') {
		app.use(cors());
	}

	// I use morgan for logging http requests. This will first log the requests to file and
	// then print it to stdout.
	const accessLogStream = fs.createWriteStream(
		path.resolve('data/access.log'),
		{ flags: 'a' },
	);
	// 'combined' will log requests in standard apache format (:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent")
	app.use(morgan('combined', { stream: accessLogStream }));
	// I don't want extensive logs in stdout. The 'dev' format is :method :url :status :response-time ms - :res[content-length]
	app.use(morgan('dev'));

	let corsOptions;
	if (ENVIRONMENT === 'dev') {
		corsOptions = {
			origin: '*',
			optionsSuccessStatus: 200,
		};
	} else {
		corsOptions = {
			origin: 'https://steamcommunity.com',
			optionsSuccessStatus: 200,
		};
	}

	app.use('/api/user', UserRouter);
	app.use('/api/auth', AuthRouter);
	app.use('/api/images', ImageRouter);
	app.use('/api/clips', ClipsRouter);
	app.use('/api/profile', ProfileRouter);
	app.use('/api/steam', cors(corsOptions), SteamRouter);
	app.use('/api/demoworker', DemoRouter);
	app.use('/api/metrics', MetricsRouter);

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
