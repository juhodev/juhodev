export type BankAccount = {
	id: string;
	amount: number;
};

export type BankLog = {
	timestamp: number;
	id: string;
	type: BankLogType;
	amount: number;
	changeType: BankChangeType;
};

export enum BankChangeType {
	COINFLIP = 'COINFLIP',
	ECO = 'ECO',
	IN_VOICE_CHANNEL = 'IN_VOICE_CHANNEL',
	CLAIM = 'CLAIM',
}

export enum BankLogType {
	ADD = 'ADD',
	REMOVE = 'REMOVE',
	SET = 'SET',
}
