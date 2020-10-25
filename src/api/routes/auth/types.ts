export type JWTData = JWTDiscordAuth | JWTBasicAuth;

export type JWTDiscordAuth = {
	uuid: string;
	authStatus: boolean;
	discordAuthenticated: boolean;
};

export type JWTBasicAuth = {
	authStatus: boolean;
	discordAuthenticated: boolean;
};

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
