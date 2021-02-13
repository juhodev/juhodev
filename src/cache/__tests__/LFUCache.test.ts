import LFUCache from '../LFUCache';

test('Creating LFUCache without specified size', () => {
	const lfu: LFUCache<string> = new LFUCache();
	// 1024 is the default size of the LFU cache
	expect(lfu.maxSize).toBe(1024);
});

test('Creating LFUCache with a specific size', () => {
	const maxSize: number = 512;

	const lfu: LFUCache<string> = new LFUCache(maxSize);
	expect(lfu.maxSize).toBe(maxSize);
});

test('Inserting and getting items', () => {
	const lfu: LFUCache<string> = new LFUCache();
	lfu.insert('key one', 'test');
	lfu.insert('key two', 'test two');

	expect(lfu.get('key one')).toBe('test');
	expect(lfu.get('key two')).toBe('test two');
});

test('Removing items when cache is full', () => {
	const lfu: LFUCache<string> = new LFUCache(2);
	lfu.insert('0', '0th');
	lfu.insert('1', '1st');
	lfu.insert('2', '2nd');

	expect(lfu.get('1')).toBeUndefined();
});

test('Removing the least frequently used item', () => {
	const lfu: LFUCache<string> = new LFUCache(2);
	lfu.insert('0', '0th');
	lfu.insert('1', '1st');
	lfu.get('1'); // The value with the key '1' would be evicted if it's count wasn't incremented
	lfu.insert('2', '2nd');

	expect(lfu.get('1')).toBe('1st');
	expect(lfu.get('0')).toBeUndefined();
});

test('Removing the lest frequently used item when all items have incremented frequency values', () => {
	const lfu: LFUCache<string> = new LFUCache(2);
	lfu.insert('0', '0th');
	lfu.insert('1', '1th');
	lfu.get('0');
	lfu.get('1');
	lfu.insert('2', '2nd');
	expect(lfu.getSize()).toBe(2);
});

test('Clearing LFU cache', () => {
	const lfu: LFUCache<string> = new LFUCache(2);
	lfu.insert('0', '0th');
	lfu.insert('1', '1st');
	lfu.clear();
	expect(lfu.getSize()).toBe(0);
	expect(lfu.get('0')).toBeUndefined();
	expect(lfu.get('1')).toBeUndefined();
});
