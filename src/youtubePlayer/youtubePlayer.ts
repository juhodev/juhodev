import {
	Channel,
	DMChannel,
	Message,
	MessageEmbed,
	NewsChannel,
	StreamDispatcher,
	TextChannel,
	User,
	VoiceChannel,
	VoiceConnection,
} from 'discord.js';
import * as ytdl from 'ytdl-core-discord';
import { db } from '..';
import DB from '../database/db';
import { isNil } from '../utils';
import { QueueItem, VideoInfo } from './types';
import * as youtubeSearch from 'youtube-search';

class YoutubePlayer {
	private queue: QueueItem[];
	private playing: boolean;

	private currentItem: QueueItem;
	private currentStream: any;
	private currentChannel: VoiceChannel;
	private currentConnection: VoiceConnection;
	private currentDispatcher: StreamDispatcher;
	private currentTimePlayed: number;

	private leavingTimeout: NodeJS.Timeout;

	constructor() {
		this.queue = [];
		this.playing = false;
		this.currentTimePlayed = 0;
	}

	async add(link: string, author: User, channel: TextChannel | DMChannel | NewsChannel, db: DB) {
		const userVC: VoiceChannel = this.getUserVoiceChannel(author, db);
		if (isNil(userVC)) {
			channel.send('You must be in a voice channel!');
			return;
		}

		const validUrl: boolean = this.validUrl(link);
		if (!validUrl) {
			const results: youtubeSearch.YouTubeSearchResults[] = await this.search(link);
			const firstResult: youtubeSearch.YouTubeSearchResults = results.shift();

			link = firstResult.link;
		}

		const videoInfo: VideoInfo = await this.getVideoInfo(link);
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

	skip(channel: DMChannel | NewsChannel | TextChannel) {
		if (isNil(this.currentItem)) {
			channel.send(new MessageEmbed({ title: 'There is nothing to skip <:seriousweldon:822983336803827753>' }));
			return;
		}

		channel.send(new MessageEmbed({ title: 'Skipping' }));
		if (!isNil(this.currentDispatcher)) {
			this.currentDispatcher.end();
			this.currentDispatcher.destroy();
		}
		this.playing = false;
		this.currentItem = undefined;

		if (this.queue.length === 0) {
			this.leavingTimeout = setTimeout(() => {
				this.leaveVoice();
			}, 1000 * 60 * 2);
		}

		this.play();
	}

	sendCurrentlyPlaying(channel: TextChannel | DMChannel | NewsChannel) {
		if (isNil(this.currentItem)) {
			channel.send('Nothing is currently playing');
			return;
		}

		const embed: MessageEmbed = new MessageEmbed({ title: 'Current video' });
		embed.addField(this.currentItem.video.name, `Voice channel: ${this.currentItem.channel.name}`);
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

	private validUrl(link: string) {
		return link.includes('https://') && link.includes('?v=');
	}

	private async getVideoInfo(link: string): Promise<VideoInfo> {
		const info = await ytdl.getInfo(link);
		const videoInfo: VideoInfo = {
			name: info['videoDetails']['title'],
			thumbnail: info['videoDetails']['thumbnails'][0]['url'],
			url: link,
			start: 0,
			playDuration: parseInt(info['lengthInSeconds']),
		};

		return videoInfo;
	}

	private play() {
		if (this.playing) {
			return;
		}

		const item: QueueItem = this.queue.shift();
		if (isNil(item)) {
			return;
		}

		if (!isNil(this.leavingTimeout)) {
			clearTimeout(this.leavingTimeout);
			this.leavingTimeout = undefined;
		}

		db.changeUsernameEvent('DJ-Baavo', item.video.name);

		this.playing = true;
		this.playYoutube(item);
	}

	private async playYoutube(item: QueueItem) {
		this.currentItem = item;

		if (isNil(this.currentConnection)) {
			this.currentConnection = await item.channel.join();
			this.currentChannel = item.channel;
		} else {
			if (this.currentChannel.id !== item.channel.id) {
				this.currentConnection.disconnect();
				this.currentChannel.leave();
				this.currentConnection = await item.channel.join();
				this.currentChannel = item.channel;
			}
		}

		try {
			this.currentDispatcher = this.currentConnection.play(
				await ytdl(item.video.url, { quality: 'highestaudio', highWaterMark: 1 << 25 }),
				{ type: 'opus' },
			);
		} catch (e) {
			console.error(e);
		}

		this.currentDispatcher.on('error', console.error);

		this.currentDispatcher.on('finish', () => {
			this.finishedPlaying();
		});
	}

	private finishedPlaying() {
		if (this.queue.length === 0) {
			this.leavingTimeout = setTimeout(() => {
				this.leaveVoice();
			}, 1000 * 60 * 2);
		}

		this.playing = false;
		this.play();
	}

	private async search(q: string): Promise<youtubeSearch.YouTubeSearchResults[]> {
		return new Promise((resolve, reject) => {
			const opts: youtubeSearch.YouTubeSearchOptions = {
				maxResults: 1,
				key: process.env.YOUTUBE_API_KEY,
			};

			youtubeSearch(q, opts, (err, results) => {
				if (err) {
					reject(err);
					return;
				}

				resolve(results);
			});
		});
	}

	private leaveVoice() {
		db.changeUsernameEvent('Baavo');
		this.currentConnection.disconnect();
		this.currentChannel.leave();
		this.currentItem = undefined;
		this.currentChannel = undefined;
		this.currentStream = undefined;
		this.currentConnection = undefined;
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
