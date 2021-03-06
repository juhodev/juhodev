export type UserBasicData = {
	snowflake: string;
	discord_tag: string;
	discord_name: string;
	avatar: string;
	submissions: UserSubmission[];
};

export type UserSubmission =
	| ClipSubmission
	| ImageSubmission
	| QuoteSubmission
	| BaavoSubmission;

export enum SubmissionType {
	CLIP = 'CLIP',
	IMAGE = 'IMAGE',
	QUOTE = 'QUOTE',
	BAAVO = 'BAAVO',
}

export type ClipSubmission = {
	name: string;
	original_link: string;
	views: number;
	submission_by: string;
	submission_date: number;
	clip_start: number;
	clip_length: number;
	submission_type: SubmissionType;
};

export type ImageSubmission = {
	name: string;
	original_link: string;
	views: number;
	submission_by: string;
	submission_date: number;
	submission_type: SubmissionType;
};

export type QuoteSubmission = {
	id: number;
	name: string;
	content: string;
	views: number;
	submission_by: string;
	submission_date: number;
	submission_type: SubmissionType;
};

export type UserRouteResponse = {
	error: boolean;
	errorCode?: number;
	userData?: UserBasicData;
};

export const ERROR = {
	DISCORD_NOT_AUTHENTICATED: 0,
	USER_NOT_ON_SERVER: 1,
	CLIP_DOES_NOT_EXIST: 2,
};

export type BaavoSubmission = {
	name: string;
	views: number;
	submission_by: string;
	submission_date: number;
	submission_type: SubmissionType;
};
