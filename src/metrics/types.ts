import { Snowflake } from 'discord.js';

export const LOG_INTERVAL = 1000 * 60;

export type VoiceChannelMetrics = {
	users: UserVoiceHistory[];
};

export type UserVoiceHistory = {
	id: Snowflake;
	name: string;
	channels: VoiceChannelHistory[];
};

export type VoiceChannelHistory = {
	id: Snowflake;
	name: string;
	time: number;
};

export type UserTotalTime = {
	id: Snowflake;
	name: string;
	time: number;
};
