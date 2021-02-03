import LinkedList from './linkedlist/LinkedList';
import { ListNode } from './linkedlist/types';

class LFUCache<T> {
	readonly maxSize: number;

	private frequencyList: LinkedList;
	private lookup: Map<string, ListNode>;
	private size: number;

	constructor(maxSize: number = 1024) {
		this.maxSize = maxSize;

		this.frequencyList = new LinkedList();
		this.lookup = new Map();
		this.size = 0;
	}

	/**
	 * Removes all the items in the cache
	 */
	clear() {
		this.size = 0;
		this.frequencyList = new LinkedList();
		this.lookup.clear();
	}

	getSize() {
		return this.size;
	}

	/**
	 * Inserts a new cache node in the cache.
	 *
	 * If this would push to cache size over the max size of the cache then
	 * this will remove the least frequently used item.
	 *
	 * @param key The key with which the value can later be retrieved with.
	 * @param value The value that is stored in the cache.
	 */
	insert(key: string, value: any) {
		if (this.size >= this.maxSize) {
			this.removeLeastUsed();
		}

		this.size++;
		if (this.frequencyList.getSize() === 0) {
			// If the `frequencyList` is empty then create a new frequency node
			this.createFrequencyNode(key, value, 1);
		} else {
			// If the `frequencyList` is not empty then create a new cache node and
			// insert it into the first frequency node
			// TODO: Check if the head node has a frequency of 1
			const cacheNode: ListNode = { key, value, parent: this.frequencyList.getHead() };
			(this.frequencyList.getHead().value as LinkedList).insertHead(cacheNode);
			this.lookup.set(key, cacheNode);
		}
	}

	/**
	 * Tries to retrieve the value with the given `key` from cache.
	 *
	 *  This will handle incrementing the cache node's location in cache.
	 *
	 * @param key Key for the value that is in the cache
	 * @returns The value for the `key` that is defined in the parameter. If a value isn't stored with that
	 * 			`key` then this will return undefined.
	 */
	get(key: string): T {
		const cacheNode: ListNode = this.lookup.get(key);

		if (cacheNode === undefined) {
			return undefined;
		}

		this.increment(cacheNode);
		return cacheNode.value;
	}

	/**
	 * Handles creating and inserting a new cache node in to the cache. When creating a frequency node for a
	 * cache item that it's in the cache yet, then the frequency must be set to 1.
	 *
	 * The `oldParent` param will only be set if the key-value pair is already in cache and this function is
	 * called from the `increment` function.
	 *
	 * @param key Key for the cache value
	 * @param value Value that you want to cache
	 * @param frequency Frequency of the cache node. This will be one when the cache node isn't in cache yet.
	 * 					If the cache node is already cached then this will be the node's old frequency + 1.
	 * @param oldParent Old parent of the cache node. This is only set if the cache node is already in cache.
	 */
	private createFrequencyNode(key: string, value: any, frequency: number, oldParent?: ListNode) {
		const frequencyNode: ListNode = {
			key: frequency,
			value: new LinkedList(),
		};

		const cacheNode: ListNode = { key, value, parent: frequencyNode };
		// Insert the cache node in the just created frequency node
		(frequencyNode.value as LinkedList).insertHead(cacheNode);

		this.lookup.set(key, cacheNode);

		// If the `oldParent` isn't defined, then insert the new frequency node
		// in the `frequencyList`.
		//
		// If the `oldParent` IS defined then set the new frequency node as the node
		// that's next to the `oldParent` because it's the one that has the more frequently used
		// cache nodes.
		if (oldParent === undefined) {
			this.frequencyList.insertHead(frequencyNode);
		} else {
			oldParent.next = frequencyNode;
			const oldLinkedList: LinkedList = oldParent.value;
			if (oldLinkedList.getSize() === 0) {
				this.frequencyList.remove(oldParent);
			}
		}
	}

	/**
	 * Removes the `node` from it's current parent and inserts it in to a new frequency node
	 * that has a frequency of n + 1
	 *
	 * @param node The node who's frequency you want to increment
	 */
	private increment(node: ListNode) {
		const currentParent: ListNode = node.parent;
		const nextNode: ListNode = currentParent.next;

		// Remove the `node` from it's current parent
		(currentParent.value as LinkedList).remove(node);

		// The frequency is kept in the key of the list node
		const nextNodeFrequency: number = (nextNode?.key as number) + 1;
		const nextFrequency: number = (currentParent?.key as number) + 1;

		// If there isn't a node with the current frequency + 1 then create a new node otherwise insert
		// the cache node to the next node
		if (nextNode === undefined || nextNodeFrequency != nextFrequency) {
			this.createFrequencyNode(node.key as string, node.value, nextFrequency, currentParent);
		} else {
			// This updates the cache node in the lookup map
			const cacheNode: ListNode = { key: node.key, value: node.value, parent: nextNode };
			this.lookup.set(node.key as string, cacheNode);

			// And lastly add the cache node to the next frequency node
			(nextNode.value as LinkedList).insertHead(cacheNode);
		}
	}

	/**
	 * Removes the least used item in the cache.
	 *
	 * This gets the head of the `frequencyList` and the head of the children in that frequency node,
	 * then removes that node.
	 *
	 * Any of the items in the head of the `frequencyList` could be removed but it's just
	 * easiest to remove the head.
	 */
	private removeLeastUsed() {
		const leastUsedNode: ListNode = this.frequencyList.getHead();
		const leastUsedCacheNode: ListNode = (leastUsedNode.value as LinkedList).getHead();
		(leastUsedNode.value as LinkedList).remove(leastUsedCacheNode);
		this.lookup.delete(leastUsedCacheNode.key as string);
		this.size--;
	}
}

export default LFUCache;
