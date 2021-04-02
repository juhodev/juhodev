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
import HelpCommand from './commands/helpCommand';
import CommandsCommand from './commands/commandsCommand';
import IlCommand from './commands/ilCommand';
import MemeCommand from './commands/memeCommand';
import TopMemeCommand from './commands/topMemeCommand';
import ProfileCommand from './commands/profileCommand';
import PlayCommand from './commands/playCommand';
import SkipCommand from './commands/skipCommand';
import PlaylistCommand from './commands/playlistCommand';
import PlayNextCommand from './commands/playNextCommand';
import DJHelpCommand from './commands/djHelpCommand';
import PlaylistsCommand from './commands/playlistsCommand';
import TodoCommand from './commands/todoCommand';

import { logUsers } from './userLogger';
import { startApi } from './api/server';
import SiteMetrics from './metrics/siteMetrics';
import Config from './config/config';
import Csgo from './steam/csgo/csgo';
import { isNil } from './utils';
import YoutubePlayer from './youtubePlayer/youtubePlayer';

const db = new DB();
const siteMetrics: SiteMetrics = new SiteMetrics();
const config: Config = new Config();
export const csgo: Csgo = new Csgo();
export const youtubePlayer: YoutubePlayer = new YoutubePlayer();

(async () => {
	config.load();
	await initDatabase();

	const client = new Discord.Client();
	db.load();

	await csgo.load();

	const userMetrics = new UserMetrics(db);
	const commandHandler = new CommandHandler(db);

	if (config.quoteModule) {
		commandHandler.registerCommand(QuoteCommand);
	}

	if (config.baavoModule) {
		commandHandler.registerCommand(BaavoCommand);
	}

	if (config.gifsModule) {
		commandHandler.registerCommand(GifCommand);
	}

	if (config.imageModule) {
		commandHandler.registerCommand(ImgCommand);
	}

	if (config.clipsModule) {
		commandHandler.registerCommand(ClipsCommand);
	}

	if (config.steamModule) {
		commandHandler.registerCommand(CsgoCommand);
	}

	commandHandler.registerCommand(SetupCommand);
	commandHandler.registerCommand(MetricsCommand);
	commandHandler.registerCommand(MigrateCommand);
	commandHandler.registerCommand(HelpCommand);
	commandHandler.registerCommand(CommandsCommand);
	commandHandler.registerCommand(IlCommand);
	commandHandler.registerCommand(MemeCommand);
	commandHandler.registerCommand(TopMemeCommand);
	commandHandler.registerCommand(ProfileCommand);
	commandHandler.registerCommand(PlayCommand);
	commandHandler.registerCommand(SkipCommand);
	commandHandler.registerCommand(PlaylistCommand);
	commandHandler.registerCommand(PlayNextCommand);
	commandHandler.registerCommand(DJHelpCommand);
	commandHandler.registerCommand(PlaylistsCommand);
	commandHandler.registerCommand(TodoCommand);

	db.changeUsernameEvent = (username: string, video?: string) => {
		db.getGuild().me.setNickname(username);

		if (!isNil(video)) {
			client.user.setActivity({ name: video });
		} else {
			client.user.setActivity({ name: 'with viinirypälerasia' });
		}
	};

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

const updateGuild = async (db: DB, client: Discord.Client, userMetrics: UserMetrics) => {
	await db.updateGuild(client);
	userMetrics.start();
	logUsers(db);
};

export { db, siteMetrics, config };
