import fetch from 'node-fetch';
import { DMChannel, MessageEmbed, NewsChannel, TextChannel, User } from 'discord.js';
import { DBCommandLog } from '../db/types';
import { knex } from '../db/utils';
import { Command } from './types';

const IlCommand: Command = {
	execute: (channel, author, args, db) => {
		sendTop3(channel);
	},
	alias: ['!il'],
};

async function sendTop3(channel: TextChannel | DMChannel | NewsChannel) {
	const response = await fetch(
		'https://api.il.fi/v1/articles/iltalehti/lists/popular?limit=3&featured=coma-mostread&!fields[]=main_image_urls',
	);
	const json = await response.json();
	const responses = json.response;
	const embed = new MessageEmbed({
		title: 'Top 3 articles right now!',
	});

	for (let i = 0; i < responses.length; i++) {
		const uutinen = responses[i];
		const link: string = `https://www.iltalehti.fi/${uutinen.category.category_name}/${uutinen.article_id}`;

		// [Teksti mikä näkyy](linkki)
		embed.addField(uutinen.headline, `[Lue lisää ::):):)](${link})\n${uutinen.lead}\n\u200B`);
	}
	embed.setThumbnail('https://assets.ilcdn.fi/favicon-32x32.png');
	embed.setTimestamp();

	channel.send(embed);
}
export default IlCommand;
