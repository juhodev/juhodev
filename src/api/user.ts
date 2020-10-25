import { DBClip, DBImage, DBQuote, DBUser } from '../db/types';
import { knex } from '../db/utils';
import {
	ClipSubmission,
	ImageSubmission,
	QuoteSubmission,
	SubmissionType,
	UserBasicData,
	UserSubmission,
} from './routes/userRoute/types';

export async function getUserDataWithSnowflake(
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
