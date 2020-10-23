export type Clip = {
	name: string;
	path: string;
	start: number;
	length: number;
	originalVideoLink: string;
	views: number;
};

export type ValidClip = {
	error: boolean;
	message?: string;
};

export type RenderClip = {
	clipName?: string;
	inputPath?: string;
	outputPath?: string;
	startAt?: number;
	clipLength?: number;
	superLowQuality?: boolean;
	error: boolean;
	message?: string;
};

export type RenderExit = {
	elapsedTime: number;
	error: boolean;
	message?: string;
};

export type ValidRenderClip = {
	error: boolean;
	message?: string;
};

export type VideoDownloadResult = {
	path: string;
	filename: string;
};

export type ClipProgress = {
	error: boolean;
	errorMessage?: string;
	stage: ClipStage;
};

export enum ClipStage {
	DOWNLOADING = 0,
	RENDERING = 1,
	DONE = 2,
}

export const DOWNLOADED_DIR: string = 'downloaded_videos';
export const CLIPS_DIR: string = 'clips';
export const MAX_NUMBER_OF_VIDEOS_DOWNLOADED: number = 30;
