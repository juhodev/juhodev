import { DMChannel, MessageEmbed, NewsChannel } from 'discord.js';
import { Command } from './types';

const HelpCommand: Command = {
	execute: (channel, author, args, db) => {
		const helpMessage: MessageEmbed = new MessageEmbed({
			title: 'Baavo commands:',
		})
			.addField('!baavo', 'Send baavos')
			.addField('!times <page>', 'Leaderboard of time spent on voice channels')
			.addField('!meme', 'Random meme from r/memes daily top 50')
			.addField('!topmeme', 'Most upvoted meme of the day from r/memes')
			.addField('!commands', 'Number of commands sent by you')
			.addField('!il', 'Top 3 news articles right now')
			.addField('!quote', 'Random quote, often by russian csgo players')
			.addField('!clips', 'Random clip')
			.addField('!gif <word>', 'Random gif of said word')
			.addField('!img', 'Random image')
			.addField('!csgo <profile link or steamid (try your luck)>', 'CS:GO stats of linked profile or steamid');

		channel.send(helpMessage);
	},
	alias: ['!help'],
};

export default HelpCommand;
