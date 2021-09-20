import { MessageEmbed, DMChannel, TextChannel, NewsChannel } from 'discord.js';
import { VideoInfo } from './types';
import { youtubePlayer } from '..';

class YoutubeEmbed {
	private messageId: string;
	private videoInfo: VideoInfo;

	private voiceChannel: string;

	constructor() {
		this.videoInfo = {
			addedBy: '138256190227480576',
			name: 'Video name',
			url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			thumbnail: 'https://external-preview.redd.it/539PV_DUT2CGvQna5cpWNBQAmEn0cRjC4IOcQWKXUmM.jpg?width=728&auto=webp&s=8ea544dd6f4e7715491f188c55ce1af5221bd265',
			start: 33,
			playDuration: 120,
		};

		this.voiceChannel = 'zoon muuttosuunnitelmat';
	}

	async write(channel: DMChannel | TextChannel | NewsChannel) {
		const embed: MessageEmbed = await this.createMessageEmbed();

		channel.send(embed);
	}

	private async createMessageEmbed(): Promise<MessageEmbed> {
		const embed: MessageEmbed = new MessageEmbed({ title: this.videoInfo.name });

		const playlists: string[] = await youtubePlayer.getPlaylists();
		const timeline: string = this.createVideoTimeline(this.videoInfo.start, this.videoInfo.playDuration);

		let cutoffPoint: number = 5;
		if (playlists.length > 5) {
			cutoffPoint = 3;
		}

		let playlistsString: string = playlists
			.slice(0, cutoffPoint)
			.join('\n');
		if (cutoffPoint === 3) {
			playlistsString += `\nAnd ${playlists.length - 4} more`;
		}

		embed.setDescription(timeline);
		embed.addField('Voice channel', this.voiceChannel, true);
		embed.addField('URL', this.videoInfo.url, true);
		embed.addField('Added by', `<@${this.videoInfo.addedBy}>`);
		embed.addField('Queue', this.createPlaylistString(), true);
		embed.addField('Playlists', playlistsString, true);
		embed.setThumbnail(this.videoInfo.thumbnail);
		embed.setColor('AQUA');
		embed.setTimestamp();

		return embed;
	}

	private createPlaylistString(): string {
		if (youtubePlayer.getQueue().length === 0) {
			return 'Nothing here';
		}

		return youtubePlayer
			.getQueue()
			.slice(0, 5)
			.map(x => x.video.name)
			.join('\n');
	}

	private createVideoTimeline(played: number, videoLength: number): string {
		const percentPlayed: number = played / videoLength;
		const totalStringLength: number = 50;
		const currentTimelinePoint: number = Math.floor(totalStringLength * percentPlayed);
		const timeFormat: string = this.formatSeconds(played);

		let str: string = timeFormat + ' ';
		for (let i = 0; i < totalStringLength; i++) {
			if (i === currentTimelinePoint) {
				str += '**O**';
			} else {
				str += '-';
			}
		}
		str += ' ' + this.formatSeconds(videoLength);

		return str;
	}

	private formatToPlayTime(x: number): string {
		const minutes: number = Math.floor(x / 60);
		const seconds: number = x - minutes * 60;
		return `${minutes} minutes ${seconds < 10 ? '0' + seconds : seconds} seconds`;
	}

	private formatSeconds(number: number): string {
		const minutes: number = Math.floor(number / 60);
		const seconds: number = number - minutes * 60;
		return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
	}
};

const embed: YoutubeEmbed = new YoutubeEmbed();
export { embed };