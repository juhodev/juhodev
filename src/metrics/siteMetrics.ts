import { DBMetric, DBMetricsKey } from '../db/types';
import { knex } from '../db/utils';
import { SiteMetric } from './types';
const METRIC_DATABASE_FLUSH: number = 1000 * 10;

class SiteMetrics {
	// TODO: Write caching at some point
	private timers: Map<string, number>;

	private currentBatch: DBMetric[];
	private flushTimer: NodeJS.Timeout;

	constructor() {
		this.timers = new Map();
		this.currentBatch = [];

		this.flushToDatabase = this.flushToDatabase.bind(this);
	}

	time(name: string) {
		this.timers.set(name, new Date().getTime());
	}

	timeEnd(name: string) {
		const start: number = this.timers.get(name);

		if (start === undefined) {
			return;
		}

		const elapsed: number = new Date().getTime() - start;
		this.log(name, elapsed);
	}

	log(metric: string, value: number) {
		if (this.flushTimer === undefined) {
			this.flushTimer = setTimeout(
				this.flushToDatabase,
				METRIC_DATABASE_FLUSH,
			);
		}

		this.currentBatch.push({
			logged_at: new Date().getTime(),
			value,
			metric,
		});
	}

	async get() {
		const allMetrics = {};

		const dbMetrics: DBMetric[] = await knex<DBMetric>('metrics').where({});
		for (const metric of dbMetrics) {
			if (allMetrics[metric.metric] === undefined) {
				const siteMetrics: SiteMetric = {
					name: metric.metric,
					values: [metric.value],
				};
				allMetrics[metric.metric] = siteMetrics;
			} else {
				allMetrics[metric.metric].values.push(metric.value);
			}
		}

		const metricArray: SiteMetric[] = [];
		for (const value of Object.values(allMetrics)) {
			metricArray.push(value as SiteMetric);
		}

		return metricArray;
	}

	private async flushToDatabase() {
		await knex<DBMetric>('metrics').insert(this.currentBatch);

		const uniqueKeys: string[] = this.currentBatch
			.map((value) => value.metric)
			.filter((x, i, self) => self.indexOf(x) === i);

		for (const key of uniqueKeys) {
			let oldCount: number;
			const alreadyRegistered: DBMetricsKey = await knex<DBMetricsKey>(
				'metrics_keys',
			)
				.where({ key })
				.first();

			if (!alreadyRegistered) {
				await knex<DBMetricsKey>('metrics_keys').insert({
					key,
					count: 1,
				});

				oldCount = 1;
			} else {
				oldCount = alreadyRegistered.count;
			}

			await knex<DBMetricsKey>('metrics_keys').update({
				count: oldCount + 1,
			});
		}

		this.currentBatch = [];
		this.flushTimer = undefined;
	}
}

export default SiteMetrics;
