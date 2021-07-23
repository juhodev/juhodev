import { BankAccount, BankChangeType, BankLog, BankLogType } from './types';
import * as fs from 'fs';
import * as path from 'path';

class Bank {
	private users: Map<string, BankAccount>;

	constructor() {
		this.users = new Map();
	}

	setUser(id: string, amount: number, changeType: BankChangeType): string {
		const account: BankAccount = this.getOrCreateBankAccount(id);
		account.amount = amount;
		this.saveBank({ timestamp: new Date().getTime(), type: BankLogType.SET, changeType, amount, id });
		return undefined;
	}

	addToUser(id: string, amount: number, changeType: BankChangeType): string {
		if (amount <= 0) {
			return 'Amount must be more than 0';
		}

		const account: BankAccount = this.getOrCreateBankAccount(id);
		account.amount += amount;
		this.saveBank({ timestamp: new Date().getTime(), type: BankLogType.ADD, changeType, amount, id });
		return undefined;
	}

	removeFromUser(id: string, amount: number, changeType: BankChangeType): string {
		if (amount <= 0) {
			return 'Amount must be more than 0';
		}

		const account: BankAccount = this.getOrCreateBankAccount(id);
		account.amount -= amount;
		this.saveBank({
			timestamp: new Date().getTime(),
			type: BankLogType.REMOVE,
			amount,
			changeType,
			id,
		});
	}

	getAllAccounts(): BankAccount[] {
		const accounts: BankAccount[] = [];
		for (const kvp of this.users) {
			accounts.push(kvp[1]);
		}

		return accounts;
	}

	getBalance(id: string): number {
		return this.getOrCreateBankAccount(id).amount;
	}

	hasBalance(id: string, amount: number): boolean {
		return this.getBalance(id) >= amount;
	}

	loadBank() {
		const logFile: string = path.resolve('data', 'bank.log');

		if (!fs.existsSync(logFile)) {
			return;
		}

		const content: string = fs.readFileSync(logFile, 'utf-8');
		const lines: string[] = content.split('\n');
		for (const line of lines) {
			if (line.length < 3) {
				continue;
			}

			const log: BankLog = JSON.parse(line);
			switch (log.type) {
				case BankLogType.ADD:
					this.getOrCreateBankAccount(log.id).amount += log.amount;
					break;

				case BankLogType.REMOVE:
					this.getOrCreateBankAccount(log.id).amount -= log.amount;
					break;

				case BankLogType.SET:
					this.getOrCreateBankAccount(log.id).amount = log.amount;
					break;
			}
		}
	}

	getOrCreateBankAccount(id: string): BankAccount {
		let account: BankAccount;
		if (this.users.has(id)) {
			account = this.users.get(id);
		} else {
			account = { amount: 0, id };
			this.users.set(id, account);
		}

		return account;
	}

	private saveBank(log: BankLog) {
		const logFile: string = path.resolve('data', 'bank.log');
		fs.appendFileSync(logFile, JSON.stringify(log) + '\n');
	}
}

export default Bank;
