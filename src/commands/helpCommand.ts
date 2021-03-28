import { DMChannel, MessageEmbed, NewsChannel } from 'discord.js';
import { Command } from './types';

const HelpCommand: Command = {
	execute: (channel, author, args, db) => {
		const helpMessage: MessageEmbed = new MessageEmbed({
			title: 'Baavo commands:',
		})
			.addField('!play <link> (Example: !play https://www.youtube.com/watch?v=34Ig3X59_qA)', 'DJ-Baavo will appear and play you some sick tunes.')
			.addField('!play <keyword> (Example: !play sup yall)', 'DJ-Baavo plays you the top result on youtube search page of the keyword input.')
			.addField('!play skip', 'Skips current song and plays the next one in the queue.')
			.addField('!play q', 'Shows the queue of DJ-Baavo')
			.addField('!baavo', 'Send baavos')
			.addField('!profile <discord name and id> (Example#0000)', 'Discord stats of the user')
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
