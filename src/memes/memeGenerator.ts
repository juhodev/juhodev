import * as path from 'path';
import { ChildProcess, exec } from 'child_process';

export async function generateMeme(source: string, text: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const jarPath: string = path.resolve('jars', 'MemeGenerator-1.0.jar');
		const command: string = `java -jar ${jarPath} -source ${source} -text ${text}`;

		const process: ChildProcess = exec(command);
		process.stderr.on('data', (data) => {
			console.error(data);
		});

		process.stdout.on('data', (data) => {
			console.log(data);
			if (data.startsWith('out:')) {
				const path: string = data.split('out: ')[1].replace('\r', '').replace('\n', '');
				resolve(path);
			}
		});
	});
}
