import * as path from 'path';
import * as fs from 'fs';
import { DB_DATA_DIR } from '../database/types';
import {
	RenderClip,
	RenderExit,
	CLIPS_DIR,
	DOWNLOADED_DIR,
	ValidRenderClip,
	VideoDownloadResult,
	MAX_NUMBER_OF_VIDEOS_DOWNLOADED,
	Clip,
	ClipProgress,
	ClipStage,
	ValidClip,
} from './types';
import DB from '../database/db';
import * as youtubedl from 'youtube-dl';
import {
	DMChannel,
	Message,
	MessageEmbed,
	NewsChannel,
	TextChannel,
	User,
} from 'discord.js';
import RandomString from '../randomString';
import * as ffmpeg from 'fluent-ffmpeg';

class Clips {
	private db: DB;
	private random: RandomString;

	constructor(db: DB) {
		this.db = db;
		this.random = new RandomString();
	}

	setup() {
		const downloadedDir: string = path.resolve(DB_DATA_DIR, DOWNLOADED_DIR);
		const clipsDir: string = path.resolve(DB_DATA_DIR, CLIPS_DIR);

		if (!fs.existsSync(downloadedDir)) {
			fs.mkdirSync(downloadedDir);
		}

		if (!fs.existsSync(clipsDir)) {
			fs.mkdirSync(clipsDir);
		}
	}

	async sendRandomClip(channel: TextChannel | DMChannel | NewsChannel) {
		const clipDir: string = path.resolve(DB_DATA_DIR, CLIPS_DIR);
		if (!fs.existsSync(clipDir)) {
			channel.send('No clips found!');
			return;
		}

		const clips: string[] = fs.readdirSync(clipDir);
		if (clips.length === 0) {
			channel.send('No clips found!');
			return;
		}

		const randomClip: string = this.random.pseudoRandom(clips);
		const pathToClip: string = path.resolve(
			DB_DATA_DIR,
			CLIPS_DIR,
			randomClip,
		);

		await this.db.getClipsDB().addView(randomClip);
		channel.send({
			files: [
				{
					attachment: pathToClip,
					name: randomClip,
				},
			],
		});
	}

	async createClip(
		channel: TextChannel | DMChannel | NewsChannel,
		author: User,
		url: string,
		userStart: string,
		userEnd: string,
		userClipName: string,
		superLowQuality: boolean,
	) {
		const message: Message = await channel.send(
			this.createEmbed('Progress', '*Downloading video...*'),
		);

		this.removeOldVideosIfNeeded();
		const videoDownload: VideoDownloadResult = await this.downloadVideo(
			url,
		);

		this.updateClipProgress(message, {
			error: false,
			stage: ClipStage.RENDERING,
		});
		const renderClip: RenderClip = await this.createRenderClip(
			videoDownload.filename,
			userStart,
			userEnd,
			userClipName,
			superLowQuality,
		);
		const validRenderClip: ValidRenderClip = await this.validateRenderClip(
			renderClip,
		);

		if (validRenderClip.error) {
			this.updateClipProgress(message, {
				error: true,
				errorMessage: validRenderClip.message,
				stage: ClipStage.RENDERING,
			});
			return;
		}

		const renderExit: RenderExit = await this.renderPart(renderClip);

		if (renderExit.error) {
			this.updateClipProgress(message, {
				error: true,
				errorMessage: renderExit.message,
				stage: ClipStage.RENDERING,
			});
			return;
		}

		const clip: Clip = {
			name: renderClip.clipName,
			start: renderClip.startAt,
			length: renderClip.clipLength,
			originalVideoLink: url,
			path: renderClip.outputPath,
			views: 0,
		};

		const validClip: ValidClip = this.validateClip(clip);
		if (validClip.error) {
			fs.unlinkSync(clip.path);
			this.updateClipProgress(message, {
				error: true,
				errorMessage: validClip.message,
				stage: ClipStage.RENDERING,
			});
			return;
		}

		await this.db.getClipsDB().save(clip, author);

		this.updateClipProgress(
			message,
			{
				error: false,
				stage: ClipStage.DONE,
			},
			clip,
			renderExit,
		);
	}

	private validateClip(clip: Clip): ValidClip {
		// Discord max attachment size without nitro
		const maxFileSizeInBytes: number = 1024 * 1024 * 8;

		const fileStats: fs.Stats = fs.statSync(clip.path);
		const { size } = fileStats;

		if (size > maxFileSizeInBytes) {
			return {
				error: true,
				message: `The clip size is more than the allowed 8MB! (${size} bytes)\nTry with !clip add <url> <start> <end> [name] **lq**`,
			};
		}

		return {
			error: false,
		};
	}

	private updateClipProgress(
		originalMessage: Message,
		clipProgress: ClipProgress,
		clip?: Clip,
		renderExit?: RenderExit,
	) {
		const { error, errorMessage, stage } = clipProgress;
		if (error) {
			const embed: MessageEmbed = this.createEmbed(
				'Error',
				`${this.getMessageForStage(
					stage,
				)} **error**\n\n${errorMessage}`,
			);

			originalMessage.edit(embed);
			return;
		}

		let progressMessage: string = this.getMessageForStage(stage);

		if (stage === ClipStage.DONE) {
			progressMessage += `\n\nClip id: **${
				clip.name
			}**\nCreating the clip took ${Math.round(
				renderExit.elapsedTime / 1000,
			)} seconds`;
		}

		const embed: MessageEmbed = this.createEmbed(
			'Progress',
			progressMessage,
		);
		originalMessage.edit(embed);
	}

	private getMessageForStage(stage: ClipStage): string {
		switch (stage) {
			case ClipStage.DOWNLOADING:
				return '*Downloading video...*';

			case ClipStage.RENDERING:
				return 'Downloading video... **downloaded**\n*Creating clip...*';

			case ClipStage.DONE:
				return 'Downloading video... **downloaded**\nCreating clip... **created**';
		}
	}

	private createEmbed(fieldTitle: string, fieldText: string): MessageEmbed {
		return new MessageEmbed({ title: 'Clips' }).addField(
			fieldTitle,
			fieldText,
		);
	}

	private removeOldVideosIfNeeded() {
		const downloadedDir: string = path.resolve(DB_DATA_DIR, DOWNLOADED_DIR);
		const downloadedFiles: string[] = fs.readdirSync(downloadedDir);

		if (downloadedFiles.length > MAX_NUMBER_OF_VIDEOS_DOWNLOADED) {
			const randomVideo: string =
				downloadedFiles[
					Math.floor(Math.random() * downloadedFiles.length)
				];

			fs.unlinkSync(randomVideo);
		}
	}

	private downloadVideo(url: string): Promise<VideoDownloadResult> {
		return new Promise((resolve) => {
			const equalsIndex: number = url.indexOf('=');
			const youtubeId: string =
				url.substr(equalsIndex + 1, url.length) + '.mp4';
			const outputPath: string = path.resolve(
				DB_DATA_DIR,
				DOWNLOADED_DIR,
				youtubeId,
			);

			if (fs.existsSync(outputPath)) {
				resolve({
					filename: youtubeId,
					path: outputPath,
				});
				return;
			}

			const video = youtubedl(url, ['--format=22'], { cwd: __dirname });
			video.on('info', () => {
				console.log(`Download started ${url}`);
			});

			video.pipe(fs.createWriteStream(outputPath));

			video.on('end', () => {
				const result: VideoDownloadResult = {
					path: outputPath,
					filename: youtubeId,
				};
				console.log(
					`Video download completed ${JSON.stringify(result)}`,
				);
				resolve(result);
			});
		});
	}

	private async validateRenderClip(
		renderClip: RenderClip,
	): Promise<ValidRenderClip> {
		const {
			clipName,
			inputPath,
			outputPath,
			startAt,
			clipLength,
			error,
			message,
		} = renderClip;

		if (error) {
			return {
				error,
				message,
			};
		}

		if (!fs.existsSync(inputPath)) {
			return {
				error: true,
				message: `Clip not found! ${inputPath}`,
			};
		}

		if (await this.db.getClipsDB().hasClip(clipName)) {
			return {
				error: true,
				message: 'A clip with that name already exists!',
			};
		}

		if (outputPath === undefined) {
			return {
				error: true,
				message: 'Output path is undefined',
			};
		}

		if (startAt === undefined) {
			return {
				error: true,
				message: 'startAt is undefined',
			};
		}

		if (clipLength === undefined || clipLength === 0) {
			return {
				error: true,
				message: `endAt is undefined or zero (${clipLength})`,
			};
		}

		return {
			error: false,
		};
	}

	private async createRenderClip(
		downloadedFile: string,
		userDefinedStart: string,
		userDefinedEnd?: string,
		userDefinedName?: string,
		superLowQuality?: boolean,
	): Promise<RenderClip> {
		const downloadedFilePath: string = path.resolve(
			DB_DATA_DIR,
			DOWNLOADED_DIR,
			downloadedFile,
		);

		let clipName: string;
		if (userDefinedName !== undefined) {
			clipName = userDefinedName;
		} else {
			clipName = await this.db.getRRSG().generate();
		}

		const outputFileName = path.resolve(
			DB_DATA_DIR,
			CLIPS_DIR,
			clipName + '.mp4',
		);

		const timeSplitIndex: number = userDefinedStart.indexOf(':');
		if (timeSplitIndex === -1) {
			return {
				error: true,
				message: `Your start time doesn't have a ":" in it. Use m:s format`,
			};
		}

		const startMinutesString: string = userDefinedStart.substr(
			0,
			timeSplitIndex,
		);

		const startSecondsString: string = userDefinedStart.substr(
			timeSplitIndex + 1,
			userDefinedStart.length,
		);

		if (
			Number.isNaN(startMinutesString) ||
			Number.isNaN(startSecondsString)
		) {
			return {
				error: true,
				message: `Couldn't parse the start time (one of these isn't a number) minutes: ${startMinutesString} - seconds: ${startSecondsString}`,
			};
		}

		const startMinutes: number = parseInt(startMinutesString);
		const startSeconds: number = parseInt(startSecondsString);
		const startTime: number = startMinutes * 60 + startSeconds;

		if (Number.isNaN(userDefinedEnd)) {
			return {
				error: true,
				message: `The end time isn't a number - end time: ${userDefinedEnd}`,
			};
		}

		const clipLength: number = parseInt(userDefinedEnd);

		return {
			clipName,
			clipLength,
			superLowQuality,
			inputPath: downloadedFilePath,
			outputPath: outputFileName,
			startAt: startTime,
			error: false,
		};
	}

	private async renderPart(renderClip: RenderClip): Promise<RenderExit> {
		return new Promise((resolve) => {
			try {
				const {
					inputPath,
					outputPath,
					startAt,
					clipLength,
					superLowQuality,
				} = renderClip;

				const startTime: number = new Date().getTime();
				ffmpeg(inputPath)
					.size(superLowQuality ? '480x?' : '720x?')
					.autopad(true, '#000000')
					.setStartTime(startAt)
					.setDuration(clipLength)
					.output(outputPath)
					.on('end', () => {
						const endTime: number = new Date().getTime();

						resolve({
							elapsedTime: endTime - startTime,
							error: false,
						});
						return;
					})
					.on('error', (error) => {
						console.error(error);
						resolve({
							elapsedTime: 0,
							error: true,
							message: error,
						});
						return;
					})
					.run();
			} catch (e) {
				console.error(e);
				resolve({
					elapsedTime: 0,
					error: true,
					message: e,
				});
				return;
			}
		});
	}
}

export default Clips;
