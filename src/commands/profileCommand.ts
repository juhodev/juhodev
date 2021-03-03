import { DMChannel, GuildMember, MessageEmbed, NewsChannel, TextChannel, User } from 'discord.js';
import { db } from '..';
import { UserData, UserProfile } from '../api/types';
import { getUserDataWithSnowflake, getUserProfile } from '../api/user';
import { isNil, msToTime } from '../utils';
import { Command } from './types';

const ProfileCommand: Command = {
	execute: (channel, author, args, db) => {
		const user: string = args.shift();
		sendUserProfile(channel, user);
	},
	alias: ['!profile', '!user'],
};

async function sendUserProfile(channel: TextChannel | DMChannel | NewsChannel, name: string) {
	const userData: UserData = await getUserDataWithSnowflake(name);

	if (isNil(userData)) {
		channel.send(`User ${name} not found!`);
		return;
	}

	const userProfile: UserProfile = await getUserProfile(userData.snowflake);

	let channelsMessage: string = '';
	for (const voice of userProfile.voiceLog.sort((a, b) => b.time - a.time).slice(0, 10)) {
		channelsMessage += `${voice.channel}: ${msToTime(voice.time)}\n`;
	}

	let commandMessage: string = '';
	for (const msg of userProfile.commandLog.sort((a, b) => b.count - a.count).slice(0, 10)) {
		commandMessage += `${msg.command}: ${msg.count}\n`;
	}

	const embed: MessageEmbed = new MessageEmbed({ title: `${userData.name}#${userData.tag}` }).addFields(
		{
			name: 'Voice channels',
			value: channelsMessage,
		},
		{
			name: 'Commands',
			value: commandMessage,
		},
	);
	embed.setThumbnail(`https://cdn.discordapp.com/avatars/${userData.snowflake}/${userData.avatar}`);

	channel.send(embed);
}

export default ProfileCommand;
