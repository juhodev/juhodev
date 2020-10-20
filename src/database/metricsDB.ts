import {
	DMChannel,
	GuildMember,
	NewsChannel,
	TextChannel,
	User,
	VoiceChannel,
} from 'discord.js';
import * as fs from 'fs';
import {
	LOG_INTERVAL,
	UserTotalTime,
	UserVoiceHistory,
	VoiceChannelHistory,
	VoiceChannelMetrics,
	Metrics,
	UserCommandHistory,
	UserData,
	ChannelData,
	CommandData,
	CommandHistory,
} from '../metrics/types';
import { DB_DATA_DIR, DB_METRICS_FILE } from './types';

class MetricsDB {
	private metrics: Metrics;

	constructor() {
		this.metrics = {
			voiceChannelMetrics: { users: [] },
			commandMetrics: { commands: [], users: [] },
		};
	}

	saveCommand(
		channel: TextChannel | DMChannel | NewsChannel,
		command: string,
		args: string[],
		member: User,
	) {
		const userData: UserData = { id: member.id, name: member.username };

		const channelName: string =
			channel instanceof DMChannel ? 'Private message' : channel.name;
		const channelData: ChannelData = { id: channel.id, name: channelName };
		const commandData: CommandData = {
			args,
			command,
			channel: channelData,
			date: new Date().getTime(),
		};

		this.saveUserCommand(userData, commandData);
		this.saveCommandHistory(userData, commandData);
	}

	saveVoiceChannel(channel: VoiceChannel, member: GuildMember) {
		const user: UserVoiceHistory = this.metrics.voiceChannelMetrics.users.find(
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
			this.writeMetrics();
			return;
		}

		savedVoiceChannel.time += LOG_INTERVAL;
		this.writeMetrics();
	}

	getUserTimes(name: string): UserVoiceHistory {
		return this.metrics.voiceChannelMetrics.users.find(
			(user) => user.name.toUpperCase() === name,
		);
	}

	getUserTotalTimes(): UserTotalTime[] {
		const times: UserTotalTime[] = [];

		for (const user of this.metrics.voiceChannelMetrics.users) {
			let totalTime: number = 0;

			for (const channel of user.channels) {
				totalTime += channel.time;
			}

			times.push({ id: user.id, name: user.name, time: totalTime });
		}

		return times.sort((a, b) => a.time - b.time).reverse();
	}

	load() {
		if (!fs.existsSync(`${DB_DATA_DIR}/${DB_METRICS_FILE}`)) {
			this.writeMetrics();
			return;
		}

		const dataString: string = fs.readFileSync(
			`${DB_DATA_DIR}/${DB_METRICS_FILE}`,
			'utf-8',
		);
		const data: object = JSON.parse(dataString);

		// If the save file is still using the old save format
		if (data['users'] !== undefined) {
			this.metrics = {
				voiceChannelMetrics: data as VoiceChannelMetrics,
				commandMetrics: { users: [], commands: [] },
			};
			return;
		} else {
			this.metrics = data as Metrics;
		}
	}

	private createUser(channel: VoiceChannel, member: GuildMember) {
		this.metrics.voiceChannelMetrics.users.push({
			channels: [
				{ id: channel.id, name: channel.name, time: LOG_INTERVAL },
			],
			id: member.id,
			name: member.displayName,
		});

		this.writeMetrics();
	}

	private saveUserCommand(user: UserData, command: CommandData) {
		const userHistory: UserCommandHistory = this.metrics.commandMetrics.users.find(
			(history) => history.user.id === user.id,
		);

		if (userHistory === undefined) {
			const newUserHistory: UserCommandHistory = {
				commands: [command],
				user,
			};

			this.metrics.commandMetrics.users.push(newUserHistory);
			this.writeMetrics();
			return;
		}

		userHistory.commands.push(command);
		this.writeMetrics();
	}

	private saveCommandHistory(user: UserData, command: CommandData) {
		const commandHistory: CommandHistory = this.metrics.commandMetrics.commands.find(
			(cmd) => cmd.command.command === command.command,
		);

		if (commandHistory === undefined) {
			const newHistory: CommandHistory = {
				command,
				count: 1,
			};

			this.metrics.commandMetrics.commands.push(newHistory);
			this.writeMetrics();
			return;
		}

		commandHistory.count++;
		this.writeMetrics();
	}

	private writeMetrics() {
		fs.writeFileSync(
			`${DB_DATA_DIR}/${DB_METRICS_FILE}`,
			JSON.stringify(this.metrics),
		);
	}
}

export default MetricsDB;
