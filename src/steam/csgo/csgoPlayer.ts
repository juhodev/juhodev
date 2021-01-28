import { CsgoMatch } from './types';

class CsgoPlayer {
	readonly id: string;
	readonly steamLink: string;
	readonly avatarLink: string;
	readonly name: string;
	private matches: CsgoMatch[];

	constructor(id: string, steamLink: string, avatarLink: string, name: string, matches: CsgoMatch[]) {
		this.id = id;
		this.steamLink = steamLink;
		this.avatarLink = avatarLink;
		this.name = name;
		this.matches = matches;
	}

	addMatch(match: CsgoMatch) {
		this.matches.push(match);
	}
}

export default CsgoPlayer;
