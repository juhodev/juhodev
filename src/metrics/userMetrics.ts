import { VoiceChannel } from 'discord.js';
import DB from '../database/db';
import { knex } from '../db/utils';
import { LOG_INTERVAL } from './types';

class UserMetrics {
	private db: DB;

	constructor(db: DB) {
		this.db = db;
	}

	start() {
		this.logVoiceChat();

		setInterval(() => {
			this.logVoiceChat();
		}, LOG_INTERVAL);
	}

	private async logVoiceChat() {
		const guild = this.db.getGuild();

		if (guild === undefined) {
			console.log(guild);
			console.error(
				`Couldn't log guild voice chat times it is either undefined or unavailable`,
			);
			return;
		}

		const { channels } = guild;
		const { cache } = channels;

		for (const [_, channel] of cache) {
			if (!(channel instanceof VoiceChannel)) {
				continue;
			}

			const voiceChannel: VoiceChannel = channel;
			const { members } = voiceChannel;

			for (const [_, member] of members) {
				const knexUpdateOrInsert: string = `INSERT INTO voice_log (combined, snowflake, channel, time) values (?, ?, ?, ?) ON DUPLICATE KEY UPDATE time=time+${LOG_INTERVAL}`;

				await knex.raw(knexUpdateOrInsert, [
					`${member.id}-${channel.name}`,
					member.id,
					channel.name,
					LOG_INTERVAL,
				]);
			}
		}
	}
}

export default UserMetrics;
