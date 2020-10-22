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
