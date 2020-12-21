import fetch from 'node-fetch';
import { DBMatchSharingCode } from '../../../db/types';
import { knex } from '../../../db/utils';
import { DemoWorker } from './types';

class DemoMaster {
	private workers: DemoWorker[];
	private jobQueue: string[];

	constructor() {
		this.workers = [];
		this.jobQueue = [];
	}

	/**
	 * Adds match sharing codes that haven't yet been downloaded to the queue.
	 */
	async init() {
		const dbSharingCodes: DBMatchSharingCode[] = await knex<DBMatchSharingCode>(
			'match_sharing_codes',
		).where({ downloaded: false });

		for (const dbCode of dbSharingCodes) {
			this.jobQueue.push(dbCode.sharing_code);
		}

		this.doJob();
	}

	/**
	 * Adds a worker and starts a new job if there is one available
	 *
	 * @param address Address of the worker API
	 */
	register(address: string) {
		this.workers.push({ working: false, address });
		console.log(`Worker ${address} registered`);
		this.doJob();
	}

	/**
	 * This adds a sharing code to the job queue and tries to send it to one of the workers and
	 * if there isn't a worker available then it's going to be processed later.
	 *
	 * @param sharingCode Sharing code for a csgo match
	 */
	process(sharingCode: string) {
		this.jobQueue.push(sharingCode);
		this.doJob();
	}

	jobFinished(workerAddress: string) {
		const worker: DemoWorker = this.workers.find(
			(w) => w.address === workerAddress,
		);

		if (worker !== undefined) {
			worker.working = false;
		}

		this.doJob();
	}

	/**
	 * Checks if there a any available workers and if are then sends the sharing code
	 * to the client for processing.
	 * When the client is done processing the demo it'll POST it to /api/demoworker/demo
	 */
	private doJob() {
		const availableWorkers: DemoWorker[] = this.workers.filter(
			(worker) => !worker.working,
		);

		if (availableWorkers.length === 0 || this.jobQueue.length === 0) {
			return;
		}

		const worker: DemoWorker = availableWorkers[0];
		worker.working = true;
		const job: string = this.jobQueue.shift();
		this.sendJobToWorker(worker, job);
		this.updateSharingCodeStatus(job);
	}

	/**
	 * First checks if the worker is still alive. If it's not then the worker will be removed from the workers
	 * array.
	 * If the worker is alive this will POST the sharing code `<worker_address>/demo/:sharingCode`.
	 *
	 * @param worker Worker that doesn't already have a job
	 * @param sharingCode Sharing code for a csgo match
	 */
	private async sendJobToWorker(worker: DemoWorker, sharingCode: string) {
		// If the worker isn't alive this adds to job back to the queue and starts the whole process
		// again
		const workerAlive: boolean = await this.doHealthCheck(worker);
		if (!workerAlive) {
			this.jobQueue.push(sharingCode);
			this.doJob();
			return;
		}

		const url: string = `${worker.address}/demo/${sharingCode}`;

		const response = await fetch(url, {
			method: 'POST',
		});

		if (response.ok) {
			console.log('Job submitted to the client');
		} else {
			console.log(
				'The client returned an error! ',
				await response.json(),
			);
		}
	}

	/**
	 * Sends a GET request to `<worker_address>/health` and if that route returns a 200 OK then the
	 * worker is alive and healthy.
	 *
	 * If the route returns an error then the worker will be removed from the workers array.
	 *
	 * @param worker Worker you want to check the health of
	 */
	private async doHealthCheck(worker: DemoWorker): Promise<boolean> {
		const healthUrl: string = `${worker.address}/health`;
		const response = await fetch(healthUrl);
		if (!response.ok) {
			// If the health endpoint doens't respond with a 200 OK status then remove the worker
			const workerIndex: number = this.workers.findIndex(
				(w) => w.address === worker.address,
			);

			this.workers.splice(workerIndex, 1);
			return false;
		}

		return true;
	}

	private async updateSharingCodeStatus(sharingCode: string) {
		await knex<DBMatchSharingCode>('match_sharing_codes')
			.update({ downloaded: true })
			.where({ sharing_code: sharingCode });
	}
}

export default DemoMaster;
