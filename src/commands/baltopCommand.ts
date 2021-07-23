import { MessageEmbed } from 'discord.js';
import { bank } from '..';
import { BankAccount } from '../bank/types';
import { isNumeric } from '../utils';
import { Command } from './types';

const BaltopCommand: Command = {
	execute: (channel, author, args, db) => {
		let page: number = 0;
		if (args.length > 0) {
			const pageStr: string = args.shift();
			if (!isNumeric(pageStr)) {
				page = 0;
			} else {
				page = parseInt(pageStr) - 1;
			}
		}

		const usersPerPage: number = 10;
		const sortedAccounts: BankAccount[] = bank
			.getAllAccounts()
			.sort((a, b) => b.amount - a.amount)
			.slice(usersPerPage * page, usersPerPage * page + usersPerPage);

		let accountString: string = '';
		for (const account of sortedAccounts) {
			accountString += `<@${account.id}>: ${account.amount.toLocaleString()}\n`;
		}

		if (accountString.length === 0) {
			channel.send(`Only ${Math.ceil(bank.getAllAccounts().length / usersPerPage)} pages`);
			return;
		}

		const embed: MessageEmbed = new MessageEmbed({ title: 'Balance top' });
		embed.addField('Users', accountString);
		channel.send(embed);
	},
	alias: ['!baltop', '!balancetop'],
};

export default BaltopCommand;
