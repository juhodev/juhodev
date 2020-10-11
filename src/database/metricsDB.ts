import { GuildMember, VoiceChannel } from 'discord.js';
import * as fs from 'fs';
import {
	LOG_INTERVAL,
	UserTotalTime,
	UserVoiceHistory,
	VoiceChannelHistory,
	VoiceChannelMetrics,
} from '../metrics/types';
import { DB_DATA_DIR, DB_METRICS_FILE } from './types';

class MetricsDB {
	private voiceChannelMetrics: VoiceChannelMetrics;

	constructor() {
		this.voiceChannelMetrics = { users: [] };
	}

	save(channel: VoiceChannel, member: GuildMember) {
		const user: UserVoiceHistory = this.voiceChannelMetrics.users.find(
			(user) => user.id === member.id,
		);

		if (user === undefined) {
			this.createUser(channel, member);
			return;
		}

		const savedVoiceChannel: VoiceChannelHistory = user.channels.find(
			(voiceChannel) => voiceChannel.id === channel.id,
		);

		if (savedVoiceChannel === undefined) {
			user.channels.push({
				id: channel.id,
				name: channel.name,
				time: LOG_INTERVAL,
			});
			this.writeToDisk();
			return;
		}

		savedVoiceChannel.time += LOG_INTERVAL;
		this.writeToDisk();
	}

	getUserTimes(name: string): UserVoiceHistory {
		return this.voiceChannelMetrics.users.find(
			(user) => user.name.toUpperCase() === name,
		);
	}

	getUserTotalTimes(): UserTotalTime[] {
		const times: UserTotalTime[] = [];

		for (const user of this.voiceChannelMetrics.users) {
			let totalTime: number = 0;

			for (const channel of user.channels) {
				totalTime += channel.time;
			}

			times.push({ id: user.id, name: user.name, time: totalTime });
		}

		return times;
	}

	load() {
		if (!fs.existsSync(`${DB_DATA_DIR}/${DB_METRICS_FILE}`)) {
			this.writeToDisk();
			return;
		}

		const dataString: string = fs.readFileSync(
			`${DB_DATA_DIR}/${DB_METRICS_FILE}`,
			'utf-8',
		);
		this.voiceChannelMetrics = JSON.parse(dataString);
	}

	private createUser(channel: VoiceChannel, member: GuildMember) {
		this.voiceChannelMetrics.users.push({
			channels: [
				{ id: channel.id, name: channel.name, time: LOG_INTERVAL },
			],
			id: member.id,
			name: member.displayName,
		});

		this.writeToDisk();
	}

	private writeToDisk() {
		fs.writeFileSync(
			`${DB_DATA_DIR}/${DB_METRICS_FILE}`,
			JSON.stringify(this.voiceChannelMetrics),
		);
	}
}

export default MetricsDB;
