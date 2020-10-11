export function msToTime(duration: number) {
	let milliseconds = Math.round((duration % 1000) / 100),
		seconds: string | number = Math.floor((duration / 1000) % 60),
		minutes: string | number = Math.floor((duration / (1000 * 60)) % 60),
		hours: string | number = Math.floor((duration / (1000 * 60 * 60)) % 24);

	return `${hours} hours ${minutes} minutes`;
}
