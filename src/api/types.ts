export type UserData = {
	avatar: string;
	name: string;
	tag: string;
	snowflake: string;
};

export type UserVoiceLog = {
	time: number;
	channel: string;
};

export type UserCommandLog = {
	command: string;
	count: number;
};

export type UserProfile = {
	voiceLog: UserVoiceLog[];
	commandLog: UserCommandLog[];
};
