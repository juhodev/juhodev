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
import HistoryCommand from './commands/historyCommand';
import MemeGeneratorCommand from './commands/memeGeneratorCommand';
import AddMemeCommand from './commands/addMemeCommand';
import BankCommand from './commands/bankCommand';
import BalanceCommand from './commands/balanceCommand';
import CoinflipCommand from './commands/coinflipCommand';
import ClaimCommand from './commands/claimCommand';
import BlackjackCommand from './commands/blackjackCommand';
import GiftCommand from './commands/giftCommand';
import BaltopCommand from './commands/baltopCommand';
import DuelflipCommand from './commands/duelflipCommand';
import ChessCommand from './commands/chessCommand';

import { logUsers } from './userLogger';
import { startApi } from './api/server';
import SiteMetrics from './metrics/siteMetrics';
import Config from './config/config';
import Csgo from './steam/csgo/csgo';
import { isNil } from './utils';
import YoutubePlayer from './youtubePlayer/youtubePlayer';
import Bank from './bank/bank';
import DiscordBlackjack from './blackjack/discordBlackjack';
import Duelflip from './duelflip/duelflip';
import Chess from './chess/chess';

const db = new DB();
const siteMetrics: SiteMetrics = new SiteMetrics();
const config: Config = new Config();
export const csgo: Csgo = new Csgo();
export const youtubePlayer: YoutubePlayer = new YoutubePlayer();
export const bank: Bank = new Bank();
export const blackjack: DiscordBlackjack = new DiscordBlackjack();
export const duelflip: Duelflip = new Duelflip();
export const chess: Chess = new Chess();

(async () => {
	config.load();
	await initDatabase();

	const client = new Discord.Client();
	db.load();

	await csgo.load();
	bank.loadBank();

	await chess.load();

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
	commandHandler.registerCommand(HistoryCommand);
	commandHandler.registerCommand(MemeGeneratorCommand);
	commandHandler.registerCommand(AddMemeCommand);
	commandHandler.registerCommand(BankCommand);
	commandHandler.registerCommand(BalanceCommand);
	commandHandler.registerCommand(CoinflipCommand);
	commandHandler.registerCommand(ClaimCommand);
	commandHandler.registerCommand(BlackjackCommand);
	commandHandler.registerCommand(GiftCommand);
	commandHandler.registerCommand(BaltopCommand);
	commandHandler.registerCommand(DuelflipCommand);
	commandHandler.registerCommand(ChessCommand);

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

	client.on('messageReactionAdd', (reaction, user) => {
		blackjack.onReaction(reaction, user);
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
