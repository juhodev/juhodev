export type UploadCode = {
	createdAt: number;
	code: string;
	createdFor: string;
};

export type ExtensionSaveResponse = {
	error: boolean;
	errorCode?: ErrorCode;
	alreadyExists?: boolean;
};

export enum ErrorCode {
	INVALID_UPLOAD_CODE = 'INVALID_UPLOAD_CODE',
}

export type ExtensionMatch = {
	game: ExtensionMapData;
	players: ExtensionPlayerData[];
};

export type ExtensionMapData = {
	map: string;
	matchDuration: string;
	date: string;
	score: string;
	waitTime: string;
};

export type ExtensionPlayerData = {
	avatarSrc: string;
	miniprofile: string;
	name: string;
	steamLink: string;
	assists: number;
	deaths: number;
	hsp: number;
	kills: number;
	mvps: number;
	ping: number;
	side: string;
	score: number;
};
