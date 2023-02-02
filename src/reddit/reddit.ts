import fetch, { Headers } from 'node-fetch';
import { RedditFeed, RedditPost } from './types';
import * as fs from 'fs';
import * as Discord from 'discord.js';
import { isNil } from '../utils';
import { knex } from '../db/utils';
import { DBCeleb, DBCelebNews, DBDeathpoolKeyword, DBSubreddit } from '../db/types';

export class Reddit {
	private subredditUrls: string[] = [];

	private interestingPersons: string[] = [];

	private keywords: string[] = [];

	private ratelimitRemaining: number;
	private ratelimitReset: number;
	private ratelimitUsed: number;

	private channelToSpam: string | undefined;

	private client: Discord.Client;

	constructor() {
		this.ratelimitRemaining = -1;
		this.ratelimitReset = -1;
		this.ratelimitUsed = -1;
	}

	addClient(client: Discord.Client) {
		this.client = client;
	}

	registerChannel(channelId: string) {
		this.channelToSpam = channelId;

		fs.writeFileSync('deathpool-spam-channel.txt', channelId);
	}

	loadChannel() {
		if (!fs.existsSync('deathpool-spam-channel.txt')) {
			return;
		}

		this.channelToSpam = fs.readFileSync('deathpool-spam-channel.txt', 'utf-8');
	}

	async loadKeywords() {
		const keywords = await knex<DBDeathpoolKeyword>('deathpool_keyword').where({});

		for (const key of keywords) {
			this.keywords.push(key.keyword);
		}
	}

	async addKeyword(keyword: string) {
		this.keywords.push(keyword);

		await knex<DBDeathpoolKeyword>('deathpool_keyword').insert({ keyword });
	}

	async loadSubreddits() {
		const subreddits = await knex<DBSubreddit>('subreddit').where({});

		for (const sub of subreddits) {
			this.subredditUrls.push(sub.link);
		}
	}

	async addSubreddit(name: string) {
		const fullLink = `https://reddit.com${name}/new.json?limit=100`;
		if (this.subredditUrls.includes(fullLink)) {
			return;
		}

		this.subredditUrls.push(fullLink);
		await knex<DBSubreddit>('subreddit').insert({ link: fullLink });
	}

	async loadCelebs() {
		const celebs = await knex<DBCeleb>('celeb').where({});

		for (const celeb of celebs) {
			this.interestingPersons.push(celeb.name);
		}
	}

	async addInterestingPerson(name: string) {
		name = name.toLowerCase();
		if (this.interestingPersons.includes(name)) {
			return;
		}

		this.interestingPersons.push(name);
		await knex<DBCeleb>('celeb').insert({ name });
	}

	startFetchingPosts() {
		const fetchInterval = 1000 * 60;
		setInterval(() => {
			this.fetchPosts();
		}, fetchInterval);
	}

	private async fetchPosts() {
		const channel: Discord.Channel = await this.client.channels.fetch(this.channelToSpam);
		if (isNil(channel)) {
			console.log('Could not find the channel', channel);
			return;
		}

		for (const sub of this.subredditUrls) {
			const data = await this.fetchSubreddit(sub);
			if (isNil(data?.data)) {
				continue;
			}

			console.log(`Fetched ${data.data.children.length} posts`);

			for (const post of data.data.children) {
				if (await this.hasBeenAlreadyPosts(post)) {
					continue;
				}

				const interesting = this.doesPostHaveAnyInterestingPerson(post);
				if (!isNil(interesting)) {
					const foundKeyword = this.doesHaveKeyword(post);
					if (!foundKeyword) {
						continue;
					}

					console.log('found interesting post', post.data.permalink);
					await this.sendPostToChannel(post);
					await this.logArticle(interesting, post);
				}
			}
		}
	}

	private async hasBeenAlreadyPosts(post: RedditPost): Promise<boolean> {
		const db = await knex<DBCelebNews>('celeb_news').where({ url: post.data.permalink });

		return db.length !== 0;
	}

	private async logArticle(celebName: string, post: RedditPost) {
		await knex<DBCelebNews>('celeb_news').insert({
			celeb_name: celebName,
			url: post.data.permalink,
		});
	}

	private async sendPostToChannel(post: RedditPost) {
		if (isNil(this.client) || isNil(this.channelToSpam)) {
			return;
		}

		const channel: Discord.Channel = await this.client.channels.fetch(this.channelToSpam);
		if (channel instanceof Discord.TextChannel) {
			const embed = new Discord.MessageEmbed({ title: post.data.title.substring(0, 255) });

			embed.addField('Link to article', post.data.url);
			embed.addField('Link to post', `https://reddit.com${post.data.permalink}`);

			await channel.send(embed);
		}
	}

	private doesPostHaveAnyInterestingPerson(post: RedditPost): string | null {
		for (const person of this.interestingPersons) {
			if (post.data.title.toLocaleLowerCase().includes(person)) {
				return person;
			}
		}

		return null;
	}

	private doesHaveKeyword(post: RedditPost): boolean {
		for (const keyword of this.keywords) {
			if (post.data.title.toLocaleLowerCase().includes(keyword)) {
				return true;
			}
		}

		return false;
	}

	private async fetchSubreddit(url: string): Promise<RedditFeed | null> {
		if (this.ratelimitRemaining === 0) {
			return null;
		}

		const res = await fetch(url);
		if (!res.ok) {
			return null;
		}

		this.updateRatelimitValues(res.headers);
		return await res.json();
	}

	private updateRatelimitValues(headers: Headers) {
		this.ratelimitRemaining = parseInt(headers.get('x-ratelimit-remaining')[0]);
		this.ratelimitReset = parseInt(headers.get('x-ratelimit-reset')[0]);
		this.ratelimitUsed = parseInt(headers.get('x-ratelimit-used')[0]);
	}
}
