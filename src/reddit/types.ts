export type RedditFeed = {
	kind: string;
	data: {
		after: string;
		modhash: string;
		geo_filter: string;
		children: RedditPost[];
	};
};

export type RedditPost = {
	kind: string;
	data: {
		subreddit: string;
		author_fullname: string;
		title: string;
		name: string;
		created: number;
		domain: string;
		url_overridden_by_dest: string;
		id: string;
		permalink: string;
		url: string;
		created_url: string;
	};
};
