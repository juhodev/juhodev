export type DemoWorker = {
	address: string;
	working: boolean;
};

export type WorkerStatus = {
	working: boolean;
	alive: boolean;
	processing: ProcessingMetrics;
};

export type ProcessingMetrics = {
	average: number;
	longest: number;
	all: number[];
};
