export function msToTime(ms: number) {
	const hours = Math.floor((ms / (1000 * 60 * 60)) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);

	return `${hours} hours ${minutes} minutes`;
}
