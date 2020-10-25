export type Table = {
	name: string;
	columns: Column[];
};

export type Column = {
	type: ColumnType;
	name: string;
	primary?: boolean;
	autoIncrement?: boolean;
};

export enum ColumnType {
	BIG_INTEGER = 'BIG_INTEGER',
	INTEGER = 'INTEGER',
	STRING = 'STRING',
	TEXT = 'TEXT',
	BOOLEAN = 'BOOLEAN',
}

export type DBUser = {
	snowflake: string;
	discord_tag: string;
	discord_name_uppercase: string;
	discord_name_original: string;
	discord_created: number;
	avatar: string;
	first_seen: number;
};

export type DBCommandLog = {
	id: number;
	snowflake: string;
	command: string;
	args: string;
	time: number;
	channel: string;
};

export type DBVoiceLog = {
	combined: string;
	snowflake: string;
	channel: string;
	time: number;
};

export type DBRandomString = {
	rand_string: string;
};

export type DBQuote = {
	id: number;
	name: string;
	content: string;
	views: number;
	submission_by: string;
	submission_date: number;
};

export type DBBaavo = {
	name: string;
	views: number;
	submission_by: string;
	submission_date: number;
};

export type DBImage = {
	name: string;
	original_link: string;
	views: number;
	submission_by: string;
	submission_date: number;
	deleted: boolean;
};

export type DBClip = {
	name: string;
	path: string;
	original_link: string;
	views: number;
	submission_by: string;
	submission_date: number;
	clip_start: number;
	clip_length: number;
	deleted: boolean;
};

export type DBDiscordToken = {
	uuid: string;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	issued_at: number;
};

export type DBDiscordData = {
	uuid: string;
	snowflake: string;
	username: string;
	avatar: string;
	discriminator: string;
};
