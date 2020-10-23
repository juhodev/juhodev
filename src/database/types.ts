import { Guild } from 'discord.js';

export type DBConfig = {
	guild?: Guild;
};

export type Image = {
	path: string;
	name: string;
};

export type Quote = {
	name: string;
	content: string;
};

export type QuoteResponse = {
	error: boolean;
	message?: string;
};

export const DB_DATA_DIR = 'data';
export const DB_QUOTE_FILE = 'quotes.json';
export const DB_CONFIG_FILE = 'config.json';
export const DB_METRICS_FILE = 'metrics.json';
export const IMG_DIR = 'imgs';
export const DB_CLIPS_FILE = 'clips.json';
