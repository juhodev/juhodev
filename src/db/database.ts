import Knex = require('knex');
import { ColumnType, Table } from './types';
import { knex } from './utils';

export async function initDatabase() {
	const tables: Table[] = [
		{
			name: 'users',
			columns: [
				{
					name: 'snowflake',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'discord_tag',
					type: ColumnType.STRING,
				},
				{
					name: 'discord_name_uppercase',
					type: ColumnType.STRING,
				},
				{
					name: 'discord_name_original',
					type: ColumnType.STRING,
				},
				{
					name: 'first_seen',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'discord_created',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'avatar',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'command_log',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'snowflake',
					type: ColumnType.STRING,
				},
				{
					name: 'command',
					type: ColumnType.STRING,
				},
				{
					name: 'args',
					type: ColumnType.TEXT,
				},
				{
					name: 'time',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'channel',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'voice_log',
			columns: [
				{
					name: 'combined',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'snowflake',
					type: ColumnType.STRING,
				},
				{
					name: 'channel',
					type: ColumnType.STRING,
				},
				{
					name: 'time',
					type: ColumnType.INTEGER,
				},
			],
		},
		{
			name: 'random_strings',
			columns: [
				{
					name: 'rand_string',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'quotes',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'title',
					type: ColumnType.STRING,
				},
				{
					name: 'content',
					type: ColumnType.STRING,
				},
				{
					name: 'views',
					type: ColumnType.INTEGER,
				},
				{
					name: 'submission_by',
					type: ColumnType.STRING,
				},
				{
					name: 'submission_date',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'baavo_imgs',
			columns: [
				{
					name: 'name',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'views',
					type: ColumnType.INTEGER,
				},
				{
					name: 'submission_by',
					type: ColumnType.STRING,
				},
				{
					name: 'submission_date',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'images',
			columns: [
				{
					name: 'name',
					type: ColumnType.STRING,
				},
				{
					name: 'original_link',
					type: ColumnType.TEXT,
				},
				{
					name: 'views',
					type: ColumnType.INTEGER,
				},
				{
					name: 'submission_by',
					type: ColumnType.STRING,
				},
				{
					name: 'submission_date',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'deleted',
					type: ColumnType.BOOLEAN,
				},
			],
		},
	];

	for (const table of tables) {
		await createTable(table);
	}
}

async function createTable(table: Table) {
	const { name, columns } = table;

	const alreadyCreated: boolean = await knex.schema.hasTable(name);
	if (alreadyCreated) {
		return;
	}

	await knex.schema.createTable(name, (table) => {
		for (const column of columns) {
			let col: Knex.ColumnBuilder;

			if (column.autoIncrement) {
				col = table.increments(column.name);
				if (column.primary) {
					col.primary();
				}
				continue;
			}

			switch (column.type) {
				case ColumnType.STRING:
					col = table.string(column.name);
					break;

				case ColumnType.INTEGER:
					col = table.integer(column.name);
					break;

				case ColumnType.BIG_INTEGER:
					col = table.bigInteger(column.name);
					break;

				case ColumnType.TEXT:
					col = table.text(column.name);
					break;

				case ColumnType.BOOLEAN:
					col = table.boolean(column.name);
					break;
			}

			if (column.primary) {
				col.primary();
			}
		}
	});

	console.log(`Table ${name} created`);
}
