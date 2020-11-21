export type JWTData = JWTAuth;

export type JWTDiscordAuth = {
	uuid: string;
	userType: UserType;
};

export type JWTBasicAuth = {
	userType: UserType;
};

export type JWTAuth = JWTBasicAuth | JWTDiscordAuth;

export enum UserType {
	WEBSITE_LOGIN = 'WEBSITE_LOGIN',
	DISCORD_LOGIN = 'DISCORD_LOGIN',
	PREVIEW_ONLY = 'PREVIEW_ONLY',
}

export type DiscordAccessToken = {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
};

export type CodeResponse = {
	error: boolean;
	jwt?: string;
};
