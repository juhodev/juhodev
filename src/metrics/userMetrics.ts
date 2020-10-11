import { VoiceChannel } from 'discord.js';
import DB from '../database/db';
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

	private logVoiceChat() {
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

		for (const [snowflake, channel] of cache) {
			if (!(channel instanceof VoiceChannel)) {
				continue;
			}

			const voiceChannel: VoiceChannel = channel;
			const { members } = voiceChannel;

			for (const [memberSnowflake, member] of members) {
				this.db.getMetricsDB().save(channel, member);
			}
		}
	}
}

export default UserMetrics;
