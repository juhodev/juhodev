import * as dotenv from 'dotenv';
dotenv.config();

import { initDatabase } from './db/database';

import * as Discord from 'discord.js';
import CommandHandler from './commandHandler';
import DB from './database/db';

import UserMetrics from './metrics/userMetrics';

import QuoteCommand from './commands/quoteCommand';
import SetupCommand from './commands/setupCommand';
import MetricsCommand from './commands/metricsCommand';
import BaavoCommand from './commands/baavoCommand';
import GifCommand from './commands/gifCommand';
import ImgCommand from './commands/imgCommand';
import ClipsCommand from './commands/clipsCommand';
import MigrateCommand from './commands/migrateCommand';

import { logUsers } from './userLogger';
import { startApi } from './api/server';

(async () => {
	await initDatabase();

	const client = new Discord.Client();

	const db = new DB();
	db.load();

	const userMetrics = new UserMetrics(db);
	const commandHandler = new CommandHandler(db);

	commandHandler.registerCommand(QuoteCommand);
	commandHandler.registerCommand(SetupCommand);
	commandHandler.registerCommand(MetricsCommand);
	commandHandler.registerCommand(BaavoCommand);
	commandHandler.registerCommand(GifCommand);
	commandHandler.registerCommand(ImgCommand);
	commandHandler.registerCommand(ClipsCommand);
	commandHandler.registerCommand(MigrateCommand);

	client.on('ready', () => {
		console.log('Connected');

		client.user.setStatus('idle');
		client.user.setActivity({ name: 'with viinirypälerasia' });

		db.updateGuild(client);
		userMetrics.start();
		logUsers(db);
	});

	client.on('message', (message) => {
		commandHandler.handle(message);
	});

	client.login(process.env.DISCORD_TOKEN);

	startApi();
})();
