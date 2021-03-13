import {
	Channel,
	DMChannel,
	Message,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	User,
	VoiceChannel,
	VoiceConnection,
} from 'discord.js';
import * as ytdl from 'youtube-dl';
import DB from '../database/db';
import { isNil } from '../utils';
import { QueueItem, VideoInfo } from './types';

class YoutubePlayer {
	private queue: QueueItem[];
	private playing: boolean;

	private currentItem: QueueItem;
	private currentStream: any;
	private currentChannel: VoiceChannel;
	private currentTimePlayed: number;

	constructor() {
		this.queue = [];
		this.playing = false;
		this.currentTimePlayed = 0;
	}

	async add(
		link: string,
		author: User,
		channel: TextChannel | DMChannel | NewsChannel,
		db: DB,
		userStart?: string,
		userEnd?: string,
	) {
		const userVC: VoiceChannel = this.getUserVoiceChannel(author, db);
		if (isNil(userVC)) {
			channel.send('You must be in a voice channel!');
			return;
		}

		const videoInfo: VideoInfo = await this.getVideoInfo(link, userStart, userEnd);
		if (isNil(videoInfo)) {
			channel.send(`Couldn't get video info (${link})`);
			return;
		}

		if (isNil(this.currentItem)) {
			const embed: MessageEmbed = new MessageEmbed({ title: `Starting to play ${videoInfo.name}` });
			embed.setThumbnail(videoInfo.thumbnail);

			channel.send(embed);
		} else {
			const embed: MessageEmbed = new MessageEmbed({ title: `Adding ${videoInfo.name} to the queue` });
			embed.setThumbnail(videoInfo.thumbnail);

			channel.send(embed);
		}

		this.queue.push({ channel: userVC, video: videoInfo });
		this.play();
	}

	skip() {
		this.queue.pop();
	}

	sendCurrentlyPlaying(channel: TextChannel | DMChannel | NewsChannel) {
		if (isNil(this.currentItem)) {
			channel.send('Nothing is currently playing');
			return;
		}

		const embed: MessageEmbed = new MessageEmbed({ title: 'Current video' });
		embed.addField(this.currentItem.video.name, this.currentItem.channel.name);
		embed.setThumbnail(this.currentItem.video.thumbnail);
		embed.setTimestamp();

		channel.send(embed);
	}

	sendNextVideo(channel: TextChannel | DMChannel | NewsChannel) {
		const nextItem: QueueItem = this.queue[0];

		if (isNil(nextItem)) {
			channel.send('There queue is empty');
			return;
		}

		const embed: MessageEmbed = new MessageEmbed({ title: 'Next video' });
		embed.addField(nextItem.video.name, nextItem.channel.name);
		embed.setThumbnail(nextItem.video.thumbnail);

		channel.send(embed);
	}

	printQueue(channel: TextChannel | DMChannel | NewsChannel) {
		if (this.queue.length === 0) {
			channel.send(new MessageEmbed({ title: 'Queue is empty!' }));
			return;
		}

		const embed: MessageEmbed = new MessageEmbed({ title: 'Youtube player queue' });

		let positionInQueue: number = 1;
		for (const item of this.queue) {
			embed.addField(`${positionInQueue++}: ${item.video.name}`, `Voice channel: ${item.channel.name}`);
		}

		channel.send(embed);
	}

	stopPlaying() {
		if (isNil(this.currentStream)) {
			return;
		}

		this.currentChannel.leave();
		this.currentItem = undefined;
		this.currentStream = undefined;
	}

	private getVideoInfo(link: string, start?: string, end?: string): Promise<VideoInfo> {
		return new Promise((resolve) => {
			let userStart: number | undefined;
			let userEnd: number | undefined;
			if (!isNil(end)) {
				userStart = this.parseVideoDuration(start);
				userEnd = this.parseVideoDuration(end);
			}

			ytdl.getInfo(link, [], {}, (err, info) => {
				if (err) {
					console.error(err);
					resolve(undefined);
				}

				const videoInfo: VideoInfo = {
					name: info['title'],
					thumbnail: info['thumbnail'],
					url: link,
					start: userStart || 0,
					playDuration: userEnd || this.parseVideoDuration(info.duration),
				};

				resolve(videoInfo);
			});
		});
	}

	private secondsToTimeFormat(seconds: number): string {
		const minutes: number = Math.floor(seconds / 60);
		const onlySeconds: number = seconds - minutes * 60;

		return `${minutes}:${seconds >= 10 ? seconds : `0${seconds}`}`;
	}

	private parseVideoDuration(duration: string): number | undefined {
		if (isNil(duration)) {
			return undefined;
		}

		let splitPoint: number = duration.indexOf(':');
		const minutes: number = parseInt(duration.substr(0, splitPoint));
		const seconds: number = parseInt(duration.substr(splitPoint + 1, duration.length));

		return minutes * 60 + seconds;
	}

	private play() {
		if (this.playing) {
			return;
		}

		const item: QueueItem = this.queue.pop();
		if (isNil(item)) {
			return;
		}

		this.playing = true;
		this.playYoutube(item);
	}

	private async playYoutube(item: QueueItem) {
		const connection: VoiceConnection = await item.channel.join();
		this.currentChannel = item.channel;
		this.currentItem = item;
		this.currentStream = ytdl(item.video.url, [], { quality: 'highestaudio' });

		const dispatcher = connection.play(this.currentStream, { seek: 0, volume: 0.5 });
		dispatcher.on('start', () => {});

		dispatcher.on('end', () => {
			console.log('finished streaming');
			this.currentChannel.leave();
			this.currentItem = undefined;
			this.currentChannel = undefined;
			this.currentStream = undefined;
		});
	}

	private getUserVoiceChannel(user: User, db: DB): VoiceChannel | undefined {
		for (const [id, channel] of db.getGuild().channels.cache) {
			if (channel instanceof VoiceChannel) {
				for (const [id, member] of channel.members) {
					if (id === user.id) {
						return channel;
					}
				}
			}
		}

		return undefined;
	}
}

export default YoutubePlayer;
