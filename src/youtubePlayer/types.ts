import { VoiceChannel } from 'discord.js';

export type QueueItem = {
	video: VideoInfo;
	channel: VoiceChannel;
};

export type VideoInfo = {
	name: string;
	url: string;
	thumbnail: string;
	start: number;
	playDuration: number;
};
