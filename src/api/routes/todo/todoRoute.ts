import expressPromiseRouter from 'express-promise-router';
import { JWTData, JWTDiscordAuth } from '../auth/types';
import { verifyIdentity } from '../middleware/middleware';
import * as jwt from 'jsonwebtoken';
import { DBDiscordData, DBTodo } from '../../../db/types';
import { fetchUserIdentity } from '../../discord';
import {
	cancelTodoWithId,
	completeTodoWithId,
	getTodosForUser,
	insertTodo,
	removeTodoWithId,
} from '../../../todo/todo';
import { Todo, TodoResponse } from './types';
import { UserData } from '../../types';
import { todoData } from '../index';

const router = expressPromiseRouter();

router.get('/', [verifyIdentity], async (req, res) => {
	const identity: DBDiscordData = await getIdentify(req);
	const todos: DBTodo[] = await getTodosForUser(identity.snowflake);
	const userData: UserData = {
		avatar: identity.avatar,
		name: identity.username,
		snowflake: identity.snowflake,
		tag: identity.discriminator,
	};

	const responseTodos: Todo[] = todos.map((x): Todo => {
		return {
			id: x.id,
			addDate: x.add_date,
			cancelled: x.cancelled,
			creator: userData,
			done: x.done,
			doneDate: x.done_date,
			task: x.task,
		};
	});

	const response: TodoResponse = {
		error: false,
		user: userData,
		todos: responseTodos,
	};
	res.json(response);
});

router.post('/done', [verifyIdentity], async (req, res) => {
	const id: number = req.body.id;
	await completeTodoWithId(id);
	res.sendStatus(200);
});

router.post('/cancel', [verifyIdentity], async (req, res) => {
	const id: number = req.body.id;
	await cancelTodoWithId(id);
	res.sendStatus(200);
});

router.post('/remove', [verifyIdentity], async (req, res) => {
	const id: number = req.body.id;
	await removeTodoWithId(id);
	res.sendStatus(200);
});

router.post('/add', [verifyIdentity], async (req, res) => {
	const identity: DBDiscordData = await getIdentify(req);

	const { task } = req.body;
	await insertTodo(identity.snowflake, task);

	res.sendStatus(200);
});

router.get('/progressbar/', [verifyIdentity], (req, res) => {
	const userData: DBDiscordData = await getIdentify(req);

	res.json(todoData.getProgressBars(user.snowflake));
});

router.post('/progressbar/edit', [verifyIdentity], (req, res) => {
	const { original, edited } = req.body;
	const userData: DBDiscordData = await getIdentify(req);

	if (original.name !== edited.name) {
		todoData.updateProgressBarName(userData.snowflake, edited.name);
	}

	if (original.value !== edited.value) {
		todoData.updateProgressBarValue(userData.snowflake, edited.value);
	}

	if (original.max !== edited.max) {
		todoData.updateProgressBarMax(userData.snowflake, edited.max);
	}

	if (isNil(original.displayPercentage) || original.displayPercentage !== edited.displayPercentage) {
		todoData.updateProgressBarDisplayPercentage(userData.snowflake, edited.displayPercentage);
	}

	if (isNil(original.displayNumber) || original.displayNumber !== edited.displayNumber) {
		todoData.updateProgressBarDisplayNumber(userData.snowflake, edited.displayNumber)
	}

	res.sendStatus(200);
});

router.post('/progressbar/create', [verifyIdentity], (req, res) => {
	const { name, value, max, displayNumber, displayPercentage } = req.body;
	const discordData: DBDiscordData = await getIdentify(req);

	todoData.createProgressBar(discordData.snowflake, name, parseInt(value), parseInt(max), displayNumber, displayPercentage);
	res.sendStatus(200);
});

async function getIdentify(req): Promise<DBDiscordData> {
	const bearer: string = req.headers.authorization;
	const userJWT: string = bearer.split('Bearer ')[1];

	const decoded: JWTData = jwt.verify(userJWT, process.env.JWT_SECRET) as JWTData;

	const authenticatedJwt: JWTDiscordAuth = decoded as JWTDiscordAuth;
	const identity: DBDiscordData = await fetchUserIdentity(authenticatedJwt);

	return identity;
}

export default router;
