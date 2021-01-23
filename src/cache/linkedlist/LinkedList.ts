import { ListNode } from './types';

class LinkedList {
	private head: ListNode;
	private size: number;

	constructor() {
		this.size = 0;
	}

	getSize(): number {
		return this.size;
	}

	getHead(): ListNode {
		return this.head;
	}

	/**
	 * Inserts a new list node as the head of the linked list
	 *
	 * @param listNode The new node to be inserted
	 */
	insertHead(listNode: ListNode) {
		this.size++;
		// If a head node isn't yet defined then set the new node as the head
		if (this.head === undefined) {
			this.head = listNode;
			return;
		}

		const temp: ListNode = this.head;
		this.head = listNode;
		listNode.next = temp;
		temp.prev = this.head;
	}

	remove(listNode: ListNode) {
		this.size--;
		// If the node doesn't have a previous node then it's the head node
		if (listNode.prev === undefined) {
			this.head = listNode.next;

			// If there's only one node in the linked list and I remove it
			// then the head would now be undefined
			if (this.head !== undefined) {
				this.head.prev = undefined;
			}
			return;
		}

		listNode.prev.next = listNode.next;

		if (listNode.next !== undefined) {
			listNode.next.prev = listNode.prev;
		}
	}
}

export default LinkedList;
