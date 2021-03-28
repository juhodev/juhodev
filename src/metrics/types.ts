import { UserData } from '../api/types';

export const LOG_INTERVAL = 1000 * 60;

export type SiteMetric = {
	name: string;
	values: number[];
};

export type CommandCount = {
	user: UserData;
	count: number;
};
