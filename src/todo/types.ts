export const FLUSH_TIMEOUT: number = 5000;

export type ProgressBarData = {
	snowflake: string;
	uuid: string;
	name: string;
	value: number;
	max: number;
	displayPercentage?: boolean;
	displayNumber?: boolean;
}

export type UpdateProgressBarData = {
	uuid: string;
	progressBar: string;
	type: ProgressBarEditType;
	data: any;
	timestamp: number;
}

export type Log = {
	timestamp: number;
	type: LogType;
	data: any;
}

export type LogType  = 'CREATE_PROGRESSBAR' | 'UPDATE_PROGRESSBAR' | 'DELETE_PROGRESSBAR';
export type ProgressBarEditType = 'SET_VALUE' | 'SET_NAME' | 'SET_MAX' | 'SET_DISPLAY_PERCENTAGE' | 'SET_DISPLAY_NUMBER';
