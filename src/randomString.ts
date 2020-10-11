class RandomString {
	private history: string[];

	constructor() {
		this.history = [];
	}

	random(items: string[]): string {
		return items[Math.floor(Math.random() * items.length)];
	}

	pseudoRandom(items: string[]): string {
		const withoutItemsInHistory = items.filter(
			(item) => !this.history.includes(item),
		);

		if (withoutItemsInHistory.length === 0) {
			return this.random(items);
		}

		if (this.history.length > items.length / 3) {
			this.history.shift();
		}

		const random: string = this.random(withoutItemsInHistory);
		this.history.push(random);

		return random;
	}
}

export default RandomString;
