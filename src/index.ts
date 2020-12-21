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
import CsgoCommand from './commands/csgoCommand';

import { logUsers } from './userLogger';
import { startApi } from './api/server';
import SiteMetrics from './metrics/siteMetrics';

const db = new DB();
const siteMetrics: SiteMetrics = new SiteMetrics();

(async () => {
	await initDatabase();

	const client = new Discord.Client();
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
	commandHandler.registerCommand(CsgoCommand);

	client.on('ready', () => {
		console.log('Connected');

		client.user.setStatus('idle');
		client.user.setActivity({ name: 'with viinirypälerasia' });

		updateGuild(db, client, userMetrics);
	});

	client.on('message', (message) => {
		commandHandler.handle(message);
	});

	client.login(process.env.DISCORD_TOKEN);

	startApi();
})();

const updateGuild = async (
	db: DB,
	client: Discord.Client,
	userMetrics: UserMetrics,
) => {
	await db.updateGuild(client);
	userMetrics.start();
	logUsers(db);
};

export { db, siteMetrics };
