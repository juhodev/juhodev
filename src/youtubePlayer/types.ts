import { DMChannel, NewsChannel, TextChannel, VoiceChannel } from 'discord.js';

export type QueueItem = {
	video: VideoInfo;
	channel: VoiceChannel;
	textChannel: TextChannel | DMChannel | NewsChannel;
};

export type VideoInfo = {
	addedBy: string;
	name: string;
	url: string;
	thumbnail: string;
	start: number;
	playDuration: number;
};

export type YTPlaylist = {
	name: string;
	music: VideoInfo[];
};
