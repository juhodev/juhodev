import {
	DBBaavo,
	DBClip,
	DBCommandLog,
	DBDiscordData,
	DBImage,
	DBQuote,
	DBUser,
	DBVoiceLog,
} from '../db/types';
import { knex } from '../db/utils';
import { fetchUserIdentity } from './discord';
import { JWTData, JWTDiscordAuth } from './routes/auth/types';
import {
	BaavoSubmission,
	ClipSubmission,
	ImageSubmission,
	QuoteSubmission,
	SubmissionType,
	UserBasicData,
	UserSubmission,
} from './routes/user/types';
import { UserCommandLog, UserData, UserProfile, UserVoiceLog } from './types';
import * as jwt from 'jsonwebtoken';

export async function getUserSubmissionsWithSnowflake(
	snowflake: string,
): Promise<UserBasicData> {
	const user: DBUser = await knex<DBUser>('users')
		.where({ snowflake })
		.first();

	if (user === undefined) {
		return;
	}
	const userSubmissions: UserSubmission[] = [];
	const submissionBy: string = `${user.discord_name_original}#${user.discord_tag}`;

	const userClips: DBClip[] = await knex<DBClip>('clips').where({
		submission_by: user.snowflake,
	});
	const clipSubmissions: ClipSubmission[] = userClips.map(
		(clip): ClipSubmission => {
			return {
				name: clip.name,
				clip_length: clip.clip_length,
				clip_start: clip.clip_start,
				original_link: clip.original_link,
				submission_by: submissionBy,
				submission_date: clip.submission_date,
				submission_type: SubmissionType.CLIP,
				views: clip.views,
			};
		},
	);
	userSubmissions.push(...clipSubmissions);

	const userImages: DBImage[] = await knex<DBImage>('images').where({
		submission_by: user.snowflake,
	});
	const imageSubmissions: ImageSubmission[] = userImages.map(
		(image): ImageSubmission => {
			return {
				name: image.name,
				original_link: image.original_link,
				submission_by: submissionBy,
				submission_date: image.submission_date,
				submission_type: SubmissionType.IMAGE,
				views: image.views,
			};
		},
	);
	userSubmissions.push(...imageSubmissions);

	const userQuotes: DBQuote[] = await knex<DBQuote>('quotes').where({
		submission_by: user.snowflake,
	});
	const quoteSubmissions: QuoteSubmission[] = userQuotes.map(
		(quote): QuoteSubmission => {
			return {
				content: quote.content,
				id: quote.id,
				name: quote.name,
				submission_by: submissionBy,
				submission_date: quote.submission_date,
				submission_type: SubmissionType.QUOTE,
				views: quote.views,
			};
		},
	);
	userSubmissions.push(...quoteSubmissions);

	const userBaavos: DBBaavo[] = await knex<DBBaavo>('baavo_imgs').where({
		submission_by: user.snowflake,
	});
	const baavoSubmissions: BaavoSubmission[] = userBaavos.map(
		(baavo): BaavoSubmission => {
			return {
				name: baavo.name,
				submission_by: baavo.submission_by,
				submission_date: baavo.submission_date,
				views: baavo.views,
				submission_type: SubmissionType.BAAVO,
			};
		},
	);
	userSubmissions.push(...baavoSubmissions);
	userSubmissions
		.sort((a, b) => a.submission_date - b.submission_date)
		.reverse();

	const userData: UserBasicData = {
		discord_tag: user.discord_tag,
		discord_name: user.discord_name_original,
		avatar: user.avatar,
		submissions: userSubmissions,
		snowflake,
	};

	return userData;
}

export async function getUserDataWithBearer(bearer: string): Promise<UserData> {
	const userJWT: string = bearer.split('Bearer ')[1];

	const decoded: JWTData = jwt.verify(
		userJWT,
		process.env.JWT_SECRET,
	) as JWTData;

	const authenticatedJwt: JWTDiscordAuth = decoded as JWTDiscordAuth;
	const identity: DBDiscordData = await fetchUserIdentity(authenticatedJwt);

	const userData: UserData = {
		avatar: identity.avatar,
		name: identity.username,
		snowflake: identity.snowflake,
		tag: identity.discriminator,
	};

	return userData;
}

export async function getUserDataWithSnowflake(
	snowflake: string,
): Promise<UserData> {
	const dbUser: DBUser = await knex<DBUser>('users')
		.where({ snowflake })
		.first();

	if (dbUser === undefined) {
		return {
			avatar: '',
			name: '',
			snowflake: '',
			tag: '',
		};
	}

	const userData: UserData = {
		avatar: dbUser.avatar,
		name: dbUser.discord_name_original,
		snowflake: dbUser.snowflake,
		tag: dbUser.discord_tag,
	};

	return userData;
}

export async function getUserProfile(snowflake: string): Promise<UserProfile> {
	const dbVoiceLog: DBVoiceLog[] = await knex<DBVoiceLog>('voice_log').where({
		snowflake,
	});

	const userVoiceLog: UserVoiceLog[] = [];
	for (const dbVoice of dbVoiceLog) {
		const oldLog: UserVoiceLog = userVoiceLog.find(
			(log) => log.channel === dbVoice.channel,
		);

		if (oldLog === undefined) {
			const newLog: UserVoiceLog = {
				channel: dbVoice.channel,
				time: dbVoice.time,
			};
			userVoiceLog.push(newLog);
			continue;
		}

		oldLog.time += dbVoice.time;
	}

	const dbCommandLog: DBCommandLog[] = await knex<DBCommandLog>(
		'command_log',
	).where({ snowflake });

	const userCommandLog: UserCommandLog[] = [];
	for (const dbCommand of dbCommandLog) {
		const oldLog: UserCommandLog = userCommandLog.find(
			(log) => log.command === dbCommand.command,
		);

		if (oldLog === undefined) {
			const newLog: UserCommandLog = {
				command: dbCommand.command,
				count: 1,
			};
			userCommandLog.push(newLog);
			continue;
		}

		oldLog.count++;
	}

	const userProfile: UserProfile = {
		commandLog: userCommandLog,
		voiceLog: userVoiceLog,
	};

	return userProfile;
}
