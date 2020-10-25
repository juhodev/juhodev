import migrate from '../migration/migration';
import { Command } from './types';

const MigrateCommand: Command = {
	execute: (channel, author, args, db) => {
		const { id } = author;

		if (id === '138256190227480576') {
			migrate();
		}
	},
	alias: ['!migrate'],
};

export default MigrateCommand;
