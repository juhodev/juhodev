import { type } from 'os';

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

export type DBImageWithUserInfo = {
	name: string;
	original_link: string;
	views: number;
	submission_by: string;
	submission_date: number;
	deleted: boolean;
	snowflake: string;
	discord_tag: string;
	discord_name_uppercase: string;
	discord_name_original: string;
	discord_created: number;
	avatar: string;
	first_seen: number;
};

export type DBClipWithUserInfo = {
	name: string;
	path: string;
	original_link: string;
	views: number;
	submission_by: string;
	submission_date: number;
	clip_start: number;
	clip_length: number;
	deleted: boolean;
	snowflake: string;
	discord_tag: string;
	discord_name_uppercase: string;
	discord_name_original: string;
	discord_created: number;
	avatar: string;
	first_seen: number;
};

export type DBCsgoMatch = {
	id?: number;
	map: string;
	date: number;
	wait_time: number;
	match_duration: number;
	ct_rounds: number;
	t_rounds: number;
	winner: string;
	uploaded_by: string;
};

export type DBCsgoPlayer = {
	id: string;
	steam_link: string;
	avatar_link: string;
	name: string;
	uploaded_by: string;
};

export type DBCsgoStats = {
	id?: number;
	player_id: string;
	match_id: number;
	ping: number;
	kills: number;
	assists: number;
	deaths: number;
	mvps: number;
	hsp: number;
	score: number;
	side: string;
	uploaded_by: string;
	unnecessary_stats?: string;
};

export type DBPlayerStatsWithMatch = {
	id: string;
	match_id: number;
	player_id: string;
	ping: number;
	kills: number;
	assists: number;
	deaths: number;
	mvps: number;
	hsp: number;
	score: number;
	side: string;
	map: string;
	date: number;
	wait_time: number;
	match_duration: number;
	ct_rounds: number;
	t_rounds: number;
	winner: string;
	unnecessary_stats?: string;
};

export type DBPlayerStatsWithPlayerInfo = {
	id: string;
	player_id: string;
	steam_link: string;
	avatar_link: string;
	name: string;
	match_id: number;
	ping: number;
	kills: number;
	assists: number;
	deaths: number;
	mvps: number;
	hsp: number;
	score: number;
	side: string;
	unnecessary_stats?: string;
};

export type DBUploadedCsgoMatch = {
	id?: number;
	match_id: number;
	player_id: string;
};

export type DBMatchSharingCode = {
	id?: number;
	player_id: string;
	sharing_code: string;
	saved_at: number;
	downloaded: boolean;
};

export type DBMatchSharingAccount = {
	id: string;
	link: string;
	authentication_code: string;
	steamid64: string;
	registered_at: number;
};

export type DBMetric = {
	id?: number;
	metric: string;
	value: number;
	logged_at: number;
};

export type DBMetricsKey = {
	key: string;
	count: number;
};

export type DBHoi4Game = {
	id?: number;
	path: string;
	name: string;
};

export type DBYtPlaylist = {
	id?: number;
	name: string;
	creator: string;
};

export type DBYtMusic = {
	id?: number;
	playlist: number;
	link: string;
	title: string;
	thumbnail: string;
	duration: number;
};

export type DBTodo = {
	id?: number;
	task: string;
	creator: string;
	add_date: number;
	done: boolean;
	done_date: number;
	cancelled: boolean;
};

export type DBYtHistory = {
	id?: number;
	link: string;
	name: string;
	added_by: string;
	date: number;
};
