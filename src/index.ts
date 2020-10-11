// const Discord = require('discord.js');
// const CommandHandler = require('./commandHandler');
// const QuoteCommand = require('./commands/quoteCommand');
// const DB = require('./db');
// require('dotenv').config();

// const client = new Discord.Client();

// const db = new DB();
// db.load();

// const commandHandler = new CommandHandler(client, db);
// commandHandler.registerCommand(QuoteCommand);

// client.on('ready', () => {
// 	console.log('Connected');
// });

// client.on('message', (message) => {
// 	commandHandler.handle(message);
// });

// client.login(process.env.DISCORD_TOKEN);

import * as Discord from 'discord.js';
import CommandHandler from './commandHandler';
import QuoteCommand from './commands/quoteCommand';
import DB from './database/db';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Discord.Client();

const db = new DB();
db.load();

const commandHandler = new CommandHandler(db);
commandHandler.registerCommand(QuoteCommand);

client.on('ready', () => {
	console.log('Connected');
});

client.on('message', (message) => {
	commandHandler.handle(message);
});

client.login(process.env.DISCORD_TOKEN);
