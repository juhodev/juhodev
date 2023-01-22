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
					name: 'name',
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
					primary: true,
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
		{
			name: 'clips',
			columns: [
				{
					name: 'name',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'path',
					type: ColumnType.TEXT,
				},
				{
					name: 'original_link',
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
				{
					name: 'clip_start',
					type: ColumnType.INTEGER,
				},
				{
					name: 'clip_length',
					type: ColumnType.INTEGER,
				},
				{
					name: 'deleted',
					type: ColumnType.BOOLEAN,
				},
			],
		},
		{
			name: 'discord_tokens',
			columns: [
				{
					name: 'uuid',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'access_token',
					type: ColumnType.STRING,
				},
				{
					name: 'refresh_token',
					type: ColumnType.STRING,
				},
				{
					name: 'expires_in',
					type: ColumnType.INTEGER,
				},
				{
					name: 'issued_at',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'discord_data',
			columns: [
				{
					name: 'uuid',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'snowflake',
					type: ColumnType.STRING,
				},
				{
					name: 'username',
					type: ColumnType.STRING,
				},
				{
					name: 'avatar',
					type: ColumnType.STRING,
				},
				{
					name: 'discriminator',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'csgo_games',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					autoIncrement: true,
					primary: true,
				},
				{
					name: 'map',
					type: ColumnType.STRING,
				},
				{
					name: 'date',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'wait_time',
					type: ColumnType.INTEGER,
				},
				{
					name: 'match_duration',
					type: ColumnType.INTEGER,
				},
				{
					name: 'ct_rounds',
					type: ColumnType.INTEGER,
				},
				{
					name: 't_rounds',
					type: ColumnType.INTEGER,
				},
				{
					name: 'winner',
					type: ColumnType.STRING,
				},
				{
					name: 'uploaded_by',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'csgo_players',
			columns: [
				{
					name: 'id',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'steam_link',
					type: ColumnType.TEXT,
				},
				{
					name: 'avatar_link',
					type: ColumnType.TEXT,
				},
				{
					name: 'name',
					type: ColumnType.TEXT,
				},
				{
					name: 'uploaded_by',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'csgo_stats',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'player_id',
					type: ColumnType.STRING,
				},
				{
					name: 'match_id',
					type: ColumnType.INTEGER,
				},
				{
					name: 'ping',
					type: ColumnType.INTEGER,
				},
				{
					name: 'kills',
					type: ColumnType.INTEGER,
				},
				{
					name: 'assists',
					type: ColumnType.INTEGER,
				},
				{
					name: 'deaths',
					type: ColumnType.INTEGER,
				},
				{
					name: 'mvps',
					type: ColumnType.INTEGER,
				},
				{
					name: 'hsp',
					type: ColumnType.INTEGER,
				},
				{
					name: 'score',
					type: ColumnType.INTEGER,
				},
				{
					name: 'side',
					type: ColumnType.STRING,
				},
				{
					name: 'uploaded_by',
					type: ColumnType.STRING,
				},
				{
					name: 'unnecessary_stats',
					type: ColumnType.TEXT, // I think I'm going to be changing these a lot so I'll just store them as JSON
				},
			],
		},
		{
			name: 'csgo_games_uploads',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'match_id',
					type: ColumnType.INTEGER,
				},
				{
					name: 'player_id',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'match_sharing_accounts',
			columns: [
				{
					name: 'id',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'link',
					type: ColumnType.STRING,
				},
				{
					name: 'authentication_code',
					type: ColumnType.STRING,
				},
				{
					name: 'steamid64',
					type: ColumnType.STRING,
				},
				{
					name: 'registered_at',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'match_sharing_codes',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'player_id',
					type: ColumnType.STRING,
				},
				{
					name: 'sharing_code',
					type: ColumnType.STRING,
				},
				{
					name: 'saved_at',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'downloaded',
					type: ColumnType.BOOLEAN,
				},
			],
		},
		{
			name: 'metrics',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'metric',
					type: ColumnType.STRING,
				},
				{
					name: 'value',
					type: ColumnType.INTEGER,
				},
				{
					name: 'logged_at',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'metrics_keys',
			columns: [
				{
					name: 'key',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'count',
					type: ColumnType.INTEGER,
				},
			],
		},
		{
			name: 'hoi4_games',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'path',
					type: ColumnType.TEXT,
				},
				{
					name: 'name',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'yt_playlist',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'name',
					type: ColumnType.STRING,
				},
				{
					name: 'creator',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'yt_music',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'playlist',
					type: ColumnType.INTEGER,
				},
				{
					name: 'title',
					type: ColumnType.STRING,
				},
				{
					name: 'link',
					type: ColumnType.STRING,
				},
				{
					name: 'thumbnail',
					type: ColumnType.STRING,
				},
				{
					name: 'duration',
					type: ColumnType.INTEGER,
				},
			],
		},
		{
			name: 'todo',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'task',
					type: ColumnType.STRING,
				},
				{
					name: 'creator',
					type: ColumnType.STRING,
				},
				{
					name: 'add_date',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'done',
					type: ColumnType.BOOLEAN,
				},
				{
					name: 'done_date',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'cancelled',
					type: ColumnType.BOOLEAN,
				},
			],
		},
		{
			name: 'yt_history',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'link',
					type: ColumnType.STRING,
				},
				{
					name: 'name',
					type: ColumnType.STRING,
				},
				{
					name: 'added_by',
					type: ColumnType.STRING,
				},
				{
					name: 'date',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'yt_search',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'query',
					type: ColumnType.STRING,
				},
				{
					name: 'url',
					type: ColumnType.STRING,
				},
				{
					name: 'duration',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'coinflip',
			columns: [
				{
					name: 'id',
					type: ColumnType.INTEGER,
					primary: true,
					autoIncrement: true,
				},
				{
					name: 'player',
					type: ColumnType.STRING,
				},
				{
					name: 'amount',
					type: ColumnType.INTEGER,
				},
				{
					name: 'date',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'player_bet',
					type: ColumnType.STRING,
				},
				{
					name: 'coin_side',
					type: ColumnType.STRING,
				},
				{
					name: 'win',
					type: ColumnType.BOOLEAN,
				},
			],
		},
		{
			name: 'claims',
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
					name: 'last_claim',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'chess_game',
			columns: [
				{
					name: 'id',
					type: ColumnType.STRING,
					primary: true,
				},
				{
					name: 'rated',
					type: ColumnType.BOOLEAN,
				},
				{
					name: 'variant',
					type: ColumnType.STRING,
				},
				{
					name: 'created_at',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'opening',
					type: ColumnType.STRING,
				},
				{
					name: 'moves',
					type: ColumnType.TEXT,
				},
				{
					name: 'status',
					type: ColumnType.STRING,
				},
				{
					name: 'last_move_at',
					type: ColumnType.BIG_INTEGER,
				},
				{
					name: 'player_white',
					type: ColumnType.STRING,
				},
				{
					name: 'player_black',
					type: ColumnType.STRING,
				},
				{
					name: 'player_white_rating',
					type: ColumnType.INTEGER,
				},
				{
					name: 'player_black_rating',
					type: ColumnType.INTEGER,
				},
				{
					name: 'player_white_id',
					type: ColumnType.STRING,
				},
				{
					name: 'player_black_id',
					type: ColumnType.STRING,
				},
				{
					name: 'analysis',
					type: ColumnType.TEXT,
				},
				{
					name: 'speed',
					type: ColumnType.STRING,
				},
				{
					name: 'initial_clock',
					type: ColumnType.INTEGER,
				},
				{
					name: 'clock_increment',
					type: ColumnType.INTEGER,
				},
				{
					name: 'winner',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'chess_user',
			columns: [
				{
					name: 'user_id',
					type: ColumnType.STRING,
				},
				{
					name: 'last_loaded_game',
					type: ColumnType.BIG_INTEGER,
				},
			],
		},
		{
			name: 'celeb_news',
			columns: [
				{
					name: 'id',
					type: ColumnType.BIG_INTEGER,
					autoIncrement: true,
				},
				{
					name: 'celeb_name',
					type: ColumnType.STRING,
				},
				{
					name: 'url',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'celeb',
			columns: [
				{
					name: 'id',
					type: ColumnType.BIG_INTEGER,
					autoIncrement: true,
				},
				{
					name: 'name',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'subreddit',
			columns: [
				{
					name: 'id',
					type: ColumnType.BIG_INTEGER,
					autoIncrement: true,
				},
				{
					name: 'link',
					type: ColumnType.STRING,
				},
			],
		},
		{
			name: 'deathpool_keyword',
			columns: [
				{
					name: 'id',
					type: ColumnType.BIG_INTEGER,
					autoIncrement: true,
				},
				{
					name: 'keyword',
					type: ColumnType.STRING,
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
