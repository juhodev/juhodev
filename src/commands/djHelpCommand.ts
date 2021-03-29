import { DMChannel, MessageEmbed, NewsChannel } from 'discord.js';
import { Command } from './types';

const DJHelpCommand: Command = {
	execute: (channel, author, args, db) => {
		const helpMessage: MessageEmbed = new MessageEmbed({
			title: 'DJ-Baavo commands:',
		})
			.addField(
				'!play <keyword/link> (Example: !play https://www.youtube.com/watch?v=34Ig3X59_qA)',
				'DJ-Baavo will appear and play you some sick tunes',
			)
			.addField(
				'!play <keyword/link> (Example: !play sup yall)',
				'DJ-Baavo plays you the top result on the youtube search page of the keyword input',
			)
			.addField('!play skip', 'Skips current song and plays the next one in the queue or playlist')
			.addField(
				'!playnext <keyword/link> (Example: !playnext hej då pappa ha det bra)',
				'Works the same way as !play, adds the song to the front of the queue',
			)
			.addField(
				'!play q or !play queue or !play list miks vitussa näitä on kolme vitun autisti <@140233862235160577>',
				'Shows the queue of DJ-Baavo',
			)
			.addField('!playlist create <name> (Example: !playlist create cancer)', 'Creates an empty playlist')
			.addField('!playlist play <playlist> (Example: !playlist play cancer)', 'Plays the playlist given')
			.addField(
				'!playlist add <playlist> <link/keyword> (Example: !playlist add cancer 11+4)',
				'Adds a song to the playlist given',
			)
			.addField(
				'!playlist remove <playlist> <link> (Example: !playlist remove cancer https://www.youtube.com/watch?v=pmTUNfn0oYk)',
				'Removes given song from the playlist !DOES NOT WORK WITH KEYWORD ONLY LINK MEN!',
			)
			.addField(
				'!playlist view <playlist> (Example: !playlist view cancer)',
				'Shows the content of given playlist',
			);

		channel.send(helpMessage);
	},
	alias: ['!djhelp'],
};

export default DJHelpCommand;
