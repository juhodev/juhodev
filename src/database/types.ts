import { Guild } from 'discord.js';

export type Quote = {
	title: string;
	content: string;
};

export type DBConfig = {
	guild?: Guild;
};

export const DB_DATA_DIR = 'data';
export const DB_QUOTE_FILE = 'quotes.json';
export const DB_CONFIG_FILE = 'config.json';
export const DB_METRICS_FILE = 'metrics.json';
