import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as path from 'path';

import UserRouter from './routes/userRoute/userRoute';
import AuthRouter from './routes/auth/authRoute';

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

	app.use('/', express.static('dist'));

	app.use('*', (req, res) => {
		res.sendFile(path.resolve('dist', 'index.html'));
	});

	const httpPort: number = parseInt(process.env.HTTP_PORT);
	app.listen(httpPort, () => {
		console.log(`Listening on port ${httpPort}`);
	});
}
