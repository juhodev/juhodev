import { Snowflake, SnowflakeUtil } from 'discord.js';

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

export type UserData = {
	id: Snowflake;
	name: string;
};

export type ChannelData = {
	id: Snowflake;
	name: string;
};

export type CommandData = {
	command: string;
	args: string[];
	date: number;
	channel: ChannelData;
};

export type UserCommandHistory = {
	commands: CommandData[];
	user: UserData;
};

export type CommandHistory = {
	command: CommandData;
	count: number;
};

export type CommandMetrics = {
	users: UserCommandHistory[];
	commands: CommandHistory[];
};

export type Metrics = {
	voiceChannelMetrics: VoiceChannelMetrics;
	commandMetrics: CommandMetrics;
};
