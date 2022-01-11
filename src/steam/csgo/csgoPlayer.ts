import { siteMetrics } from '../..';
import { getAllDatesBetweenTwoDates } from '../../utils';
import { CsgoGameStats, CsgoMap, DateMatches, MapStatistics } from '../types';
import { CsgoMatch, MatchWithPlayerStats, PlayerStatistics, RESULTS_IN_PAGE, StatisticsType } from './types';

class CsgoPlayer {
	readonly id: string;
	readonly steamLink: string;
	readonly avatarLink: string;
	readonly name: string;
	private matches: CsgoMatch[];

	private matchesWon: number;
	private matchesLost: number;
	private matchesTied: number;

	private mapStatistics: MapStatistics;
	private matchFrequencyCache: DateMatches[];

	private matchTotals: CsgoGameStats;
	private matchHighest: CsgoGameStats;

	constructor(id: string, steamLink: string, avatarLink: string, name: string, matches: CsgoMatch[]) {
		this.id = id;
		this.steamLink = steamLink;
		this.avatarLink = avatarLink;
		this.name = name;
		this.matchesWon = 0;
		this.matchesLost = 0;
		this.matchesTied = 0;
		this.matches = matches;
		this.mapStatistics = { maps: [] };
		this.matchTotals = {};
		this.matchHighest = {};
		this.matchFrequencyCache = [];
	}

	addMatch(match: CsgoMatch) {
		this.matches.push(match);
		// TODO: This is really stupid and I need to find a way (not be lazy) to keep the
		// array sorted without sorting the whole array every time
		this.matches.sort((a, b) => a.date - b.date);

		this.saveMatchWinLossStatistics(match);
		this.saveMapStatistics(match);
		this.saveAverageAndHighestData(match);
	}

	equals(player: CsgoPlayer): boolean {
		return player.id === this.id;
	}

	getMatchesWon(): number {
		return this.matchesWon;
	}

	getMatchesLost(): number {
		return this.matchesLost;
	}

	getMatchesTied(): number {
		return this.matchesTied;
	}

	getMatchesPlayed(): number {
		return this.matches.length;
	}

	getMapStatistics(): MapStatistics {
		return this.mapStatistics;
	}

	getAverageStatistics(): CsgoGameStats {
		const averages: CsgoGameStats = {};
		for (const key of Object.keys(this.matchTotals)) {
			const average: number = this.matchTotals[key].value / this.matches.length;
			averages[key] = { value: average };
		}

		return averages;
	}

	getHighestStatistics(): CsgoGameStats {
		return this.matchHighest;
	}

	getMatchFrequency() {
		if (this.matchFrequencyCache.length !== 0) {
			return this.matchFrequencyCache;
		}

		siteMetrics.time('get_player_match_frequency');

		// Find the player's earliest game. This'll be used for creating all dates between the first match
		// and the last match the player has played (that I know of).
		const earliestDate: number = this.matches
			.map((match) => match.date)
			.reduce((prev, curr) => (curr < prev ? (prev = curr) : prev));

		const allDates: Date[] = getAllDatesBetweenTwoDates(new Date(earliestDate), new Date(new Date()));

		const matchesPerDate: Map<number, DateMatches> = new Map();
		for (const date of allDates) {
			matchesPerDate.set(date.getTime(), {
				matches: 0,
				date: date.getTime(),
			});
		}

		for (const match of this.matches) {
			const matchRealDate: Date = new Date(match.date);

			const roundedDate: Date = new Date(0);
			roundedDate.setFullYear(matchRealDate.getFullYear());
			roundedDate.setMonth(matchRealDate.getMonth());
			roundedDate.setDate(matchRealDate.getDate());

			const oldMatchCount: DateMatches = matchesPerDate.get(roundedDate.getTime());
			oldMatchCount.matches += 1;
			matchesPerDate.set(roundedDate.getTime(), oldMatchCount);
		}

		const dateMatches: DateMatches[] = [];
		for (const dateMatch of matchesPerDate.values()) {
			dateMatches.push(dateMatch);
		}
		const sortedDates: DateMatches[] = dateMatches.sort((a, b) => a.date - b.date);

		this.matchFrequencyCache = sortedDates;
		siteMetrics.timeEnd('get_player_match_frequency');
		return sortedDates;
	}

	getStatistics(average: boolean, type: StatisticsType): number[] {
		if (average) {
			const array: number[] = [];
			const slidingWindow: number[] = [];

			for (const match of this.matches) {
				const playerStat: number = match.players.find((stats) => stats.player.id === this.id)[type];

				slidingWindow.push(playerStat);
				if (slidingWindow.length === 10) {
					const windowAverage: number = slidingWindow.reduce((a, b) => a + b) / slidingWindow.length;
					array.push(windowAverage);
					slidingWindow.shift();
				}
			}

			return array;
		}

		return this.matches.map((match) => match.players.find((stats) => stats.player.id === this.id)[type]);
	}

	getMatches(page: number, map: string): MatchWithPlayerStats[] {
		const first: number = page * RESULTS_IN_PAGE;
		const matches: CsgoMatch[] = this.filterMatches(map)
			.reverse()
			.slice(first, first + RESULTS_IN_PAGE);

		return matches.map((match) => {
			const { id, date, ctRounds, tRounds, map, matchDuration, players } = match;
			return {
				id,
				date,
				ctRounds,
				tRounds,
				map,
				matchDuration,
				player: players.find((stats) => stats.player.id === this.id),
			};
		});
	}

	/**
	 * This is used for creating options for filtering matches per map in /matches
	 * @returns an array of unique map names the player has played
	 */
	getUniqueMaps(): string[] {
		return this.mapStatistics.maps.map((map) => map.name);
	}

	/**
	 * Filters through all matches plays and returns the once played on `map`
	 *
	 * @param map The map you want to filter all matches with. `all` will return all matches played
	 * @returns A `CsgoMatch` array consisting of only matches played on that map
	 */
	private filterMatches(map: string): CsgoMatch[] {
		if (map === 'all') {
			return [...this.matches];
		}

		return this.matches.filter((match) => match.map === map);
	}

	private saveMatchWinLossStatistics(match: CsgoMatch) {
		if (match.winner === 'TIE') {
			this.matchesTied++;
		}

		const player: PlayerStatistics = match.players.find((p) => p.player.id === this.id);
		if (match.winner === player.side) {
			this.matchesWon++;
		} else {
			this.matchesLost++;
		}
	}

	private saveMapStatistics(match: CsgoMatch) {
		const oldMap: CsgoMap = this.mapStatistics.maps.find((x) => x.name === match.map);

		if (oldMap !== undefined) {
			oldMap.timesPlayed++;
			return;
		}

		this.mapStatistics.maps.push({ name: match.map, timesPlayed: 1 });
	}

	private saveAverageAndHighestData(match: CsgoMatch) {
		const fields: string[] = ['assists', 'deaths', 'hsp', 'kills', 'mvps', 'ping', 'score'];
		const player: PlayerStatistics = match.players.find((p) => p.player.id === this.id);

		for (const field of fields) {
			if (this.matchTotals[field] === undefined) {
				this.matchTotals[field] = {
					value: 0,
				};
			}
			this.matchTotals[field].value += player[field];

			if (this.matchHighest[field] === undefined || this.matchHighest[field].value < player[field]) {
				this.matchHighest[field] = {
					value: 0,
				};
				this.matchHighest[field].value = player[field];
				this.matchHighest[field].matchId = match.id;
			}
		}

		const matchFields: string[] = ['waitTime', 'matchDuration'];
		for (const field of matchFields) {
			if (this.matchTotals[field] === undefined) {
				this.matchTotals[field] = {
					value: 0,
				};
			}

			this.matchTotals[field].value += match[field];

			if (this.matchHighest[field] === undefined || this.matchHighest[field].value < match[field]) {
				this.matchHighest[field] = {
					value: 0,
				};
				this.matchHighest[field].value = match[field];
				this.matchHighest[field].matchId = match.id;
			}
		}
	}
}

export default CsgoPlayer;
