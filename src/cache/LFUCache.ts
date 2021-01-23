import LinkedList from './linkedlist/LinkedList';
import { ListNode } from './linkedlist/types';

class LFUCache {
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

	getSize() {
		return this.size;
	}

	insert(key: string, value: any) {
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

	get(key: string): any {
		const cacheNode: ListNode = this.lookup.get(key);

		if (cacheNode === undefined) {
			return undefined;
		}

		this.increment(cacheNode, cacheNode.parent);
		return cacheNode.value;
	}

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
		}
	}

	private increment(node: ListNode, currentParent: ListNode) {
		const nextNode: ListNode = currentParent.next;
		(currentParent.value as LinkedList).remove(node);

		if (nextNode === undefined || (nextNode.key as number) != (currentParent.key as number) + 1) {
			this.createFrequencyNode(node.key as string, node.value, (currentParent.key as number) + 1, currentParent);
		} else {
			const cacheNode: ListNode = { key: node.key, value: node.value, parent: nextNode };
			this.lookup.set(node.key as string, cacheNode);
			(nextNode.value as LinkedList).insertHead(cacheNode);
		}
	}
}

export default LFUCache;
