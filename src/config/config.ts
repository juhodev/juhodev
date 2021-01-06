import { Module, ServerConfig } from './types';
import * as fs from 'fs';

class Config {
	private config: ServerConfig;

	clipsModule: boolean;
	gifsModule: boolean;
	hoi4Module: boolean;
	steamModule: boolean;
	websiteModule: boolean;
	baavoModule: boolean;
	quoteModule: boolean;
	imageModule: boolean;
	metrics: boolean;

	constructor() {
		this.clipsModule = false;
		this.gifsModule = false;
		this.hoi4Module = false;
		this.steamModule = false;
		this.websiteModule = false;
		this.baavoModule = false;
		this.quoteModule = false;
		this.imageModule = false;
		this.metrics = false;
	}

	load() {
		if (!fs.existsSync('config.json')) {
			this.createConfig();
		}

		const configAsString: string = fs.readFileSync('config.json', 'utf-8');
		this.config = JSON.parse(configAsString);

		this.clipsModule = this.hasModule('clips');
		this.gifsModule = this.hasModule('gif');
		this.hoi4Module = this.hasModule('hoi4');
		this.steamModule = this.hasModule('steam');
		this.websiteModule = this.hasModule('website');
		this.baavoModule = this.hasModule('baavo');
		this.quoteModule = this.hasModule('quote');
		this.imageModule = this.hasModule('image');
		this.metrics = this.hasModule('metrics');
	}

	private hasModule(module: Module): boolean {
		return this.config.modules.find((s) => s === module) !== undefined;
	}

	private createConfig() {
		const newConfig: ServerConfig = {
			modules: ['metrics'],
		};

		fs.writeFileSync('config.json', JSON.stringify(newConfig));
		console.log(
			'----------------------------------------------------------',
		);
		console.log(
			'--- CREATED A CONFIG FILE WHERE YOU CAN ENABLE MODULES ---',
		);
		console.log(
			'----------------------------------------------------------',
		);
	}
}

export default Config;
