export type Clip = {
	name: string;
	path: string;
	length: number;
	originalVideoLink: string;
	views: number;
};

export type RenderClip = {
	clipName?: string;
	inputPath?: string;
	outputPath?: string;
	startAt?: number;
	clipLength?: number;
	error: boolean;
	message?: string;
};

export type RenderExit = {
	output: string;
	elapsedTime: number;
};

export type ValidRenderClip = {
	error: boolean;
	message?: string;
};

export type VideoDownloadResult = {
	path: string;
	filename: string;
};

export const DOWNLOADED_DIR: string = 'downloaded_videos';
export const CLIPS_DIR: string = 'clips';
export const MAX_NUMBER_OF_VIDEOS_DOWNLOADED: number = 30;
