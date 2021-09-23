import * as fs from 'fs';
import * as path from 'path';
import { Log, LogType, FLUSH_TIMEOUT, ProgressBarData, UpdateProgressBarData, ProgressBarEditType } from './types';
import { isNil } from '../../utils';
import { uuid } from 'uuidv4';

class Data {
	private logFile: string;
	private bucket: Log[];

	private flushTimeout: NodeJS.Timeout;

	private progressBars: ProgressBarData[];

	constructor() {
		this.logFile = path.resolve('data', 'todo_data.log');
		this.bucket = [];
		this.progressBars = [];
	}

	getProgressBars(snowflake: string): ReadonlyArray<ProgressBarData> {
		return this.progressBars.filter(x => x.snowflake === snowflake);
	}

	/**
	 * Loads data from a log file.
	 * 
	 * Data is saved as individial events. There's no real reason for this other than I wanted to do this.
	 * Every edit is also an event so we keep a history of everything.
	 */
	load() {
		if (!fs.existsSync(this.logFile)) {
			return;
		}

		const fileStr: string = fs.readFileSync(this.logFile, 'utf-8');
		const lines: string[] = fileStr.split('\n');

		for (const line of lines) {
			if (line.length <= 3) {
				continue;
			}

			const log: Log = JSON.parse(line);
			switch (log.type) {
				case 'CREATE_PROGRESSBAR':
					this.internalCreateProgressBar(log.data as ProgressBarData);
					break;

				case 'UPDATE_PROGRESSBAR':
					this.internalUpdateProgressBar(log.data as UpdateProgressBarData);
					break;
			}
		}
	}

	/**
	 * Creates a progressbar with the given data.
	 * 
	 * This will create a log entry for the creation.
	 * 
	 * @param snowflake         Discord snowflake of the user who created the progressbar
	 * @param name              Name of the progressbar
	 * @param value             Initial value for the progressbar
	 * @param max               Max value for the progressbar
	 * @param displayNumber     Whether or not to display the values as numbers on the progressbar
	 * @param displayPercentage Whether or not to dipslay the values as percetanges on the progressbar
	 */
	createProgressBar(snowflake: string, name: string, value: number, max: number, displayNumber: boolean, displayPercentage: boolean) {
		const data: ProgressBarData = { snowflake, name, value, max, displayNumber, displayPercentage, uuid: uuid() };
		this.internalCreateProgressBar(data);

		const log: Log = this.createLog('CREATE_PROGRESSBAR', data);
		this.saveLog(log);
	}

	/**
	 * Updates the progress bar with the given value
	 * 
	 * @param uuid  The progerssbar's UUID that you want to update
	 * @param value The value you want to update the progress bar to
	 */
	updateProgressBarValue(uuid: string, value: number) {
		const data: UpdateProgressBarData = {
			timestamp: new Date().getTime(),
			type: 'SET_VALUE',
			data: value,
		};
		this.internalUpdateProgressBar(data);

		const log: Log = this.createLog('UPDATE_PROGRESSBAR', data);
		this.saveLog(log);
	}

	/**
	 * Updates a progressbar's name
	 * 
	 * @param uuid  The progerssbar's UUID that you want to update
	 * @param value The value you want to update the progress bar to
	 */
	updateProgressBarName(uuid: string, value: string) {
		const data: UpdateProgressBarData = {
			timestamp: new Date().getTime(),
			type: 'SET_NAME',
			data: value,
			progressBar: name,
		};
		this.internalUpdateProgressBar(data);

		const log: Log = this.createLog('UPDATE_PROGRESSBAR', data);
		this.saveLog(log);
	}

	/**
	 * Updates a progressbar's max value
	 * 
	 * @param uuid  The progerssbar's UUID that you want to update
	 * @param value The value you want to update the progress bar to
	 */
	updateProgressBarMax(uuid: string, value: number) {
		const data: UpdateProgressBarData = {
			timestamp: new Date().getTime(),
			type: 'SET_MAX',
			data: value,
			progressBar: name,
		};
		this.internalUpdateProgressBar(data);

		const log: Log = this.createLog('UPDATE_PROGRESSBAR', data);
		this.saveLog(log);
	}

	/**
	 * Updates if a progressbar should have it's percetange displayed or not
	 * 
	 * @param uuid  The progerssbar's UUID that you want to update
	 * @param value The value you want to update the progress bar to
	 */
	updateProgressBarDisplayPercentage(uuid: string, value: boolean) {
		const data: UpdateProgressBarData = {
			timestamp: new Date().getTime(),
			type: 'SET_DISPLAY_PERCENTAGE',
			data: value,
			progressBar: name,
		};
		this.internalUpdateProgressBar(data);

		const log: Log = this.createLog('UPDATE_PROGRESSBAR', data);
		this.saveLog(log);
	}

	/**
	 * Updates if a progressbar should have it's number displayed or not
	 * 
	 * @param uuid  The progerssbar's UUID that you want to update
	 * @param value The value you want to update the progress bar to
	 */
	updateProgressBarDisplayNumber(name: string, value: boolean) {
		const data: UpdateProgressBarData = {
			timestamp: new Date().getTime(),
			type: 'SET_DISPLAY_NUMBER',
			data: value,
			progressBar: name,
		};
		this.internalUpdateProgressBar(data);

		const log: Log = this.createLog('UPDATE_PROGRESSBAR', data);
		this.saveLog(log);
	}

	private internalUpdateProgressBar(data: UpdateProgressBarData) {
		const progressBar: ProgressBarData = this.progressBars.find(x => x.name === data.progressBar);

		switch (data.type) {
			case 'SET_VALUE':
				progressBar.value = data.data as number;
				break;

			case 'SET_NAME':
				progressBar.name = data.data as string;
				break;

			case 'SET_MAX':
				progressBar.max = data.data as number;
				break;

			case 'SET_DISPLAY_NUMBER':
				progressBar.displayNumber = data.data as boolean;
				break;

			case 'SET_DISPLAY_PERCENTAGE':
				progressBar.displayPercentage = data.data as boolean;
				break;
		}
	}

	private internalCreateProgressBar(data: ProgressBarData) {
		this.progressBars.push(data);
	}

	private createLog(type: LogType, data: any) {
		return {
			timestamp: new Date().getTime(),
			data: data,
			type,
		}
	}

	/**
	 * Saves a log to a file.
	 * 
	 * This keeps a small buffer before flushing. It can be changed with `FLUSH_TIMEOUT`.
	 * 
	 * @param log Log you want to save
	 */
	private saveLog(log: Log) {
		this.bucket.push(log);

		if (isNil(this.flushTimeout)) {
			this.flushTimeout = setTimeout(() => {
				this.flush();
				this.flushTimeout = undefined;
			}, FLUSH_TIMEOUT);
		}
	}

	/**
	 * Flushes log buffer to the a save file.
	 */
	private flush() {
		if (!fs.existsSync(path.resolve('data'))) {
			fs.mkdirSync(path.resolve('data'));
		}

		const lines: string = this.bucket.map(x => JSON.stringify(x)).join('\n');
		fs.appendFileSync(this.logFile, '\n' + lines);
	}
};

export default Data;