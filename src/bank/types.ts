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
}

export enum BankLogType {
	ADD = 'ADD',
	REMOVE = 'REMOVE',
	SET = 'SET',
}
