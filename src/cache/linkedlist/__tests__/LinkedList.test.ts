import LinkedList from '../LinkedList';
import { ListNode } from '../types';

test('Inserting items in to a linked list', () => {
	const ll: LinkedList = new LinkedList();
	ll.insertHead({ key: '0', value: 0 });
	ll.insertHead({ key: '1', value: 1 });

	expect(ll.getHead().value).toBe(1);
});

test('Removing the head item from the linked list without next node', () => {
	const ll: LinkedList = new LinkedList();
	const node: ListNode = { key: '0', value: 0 };
	ll.insertHead(node);
	ll.remove(node);
	expect(ll.getHead()).toBeUndefined();
});

test('Removing the head item from the linked list with next node', () => {
	const ll: LinkedList = new LinkedList();
	const zero: ListNode = { key: '0', value: 0 };
	const first: ListNode = { key: '1', value: 1 };
	ll.insertHead(zero);
	ll.insertHead(first);
	ll.remove(first);
	expect(ll.getHead().value).toBe(zero.value);
});

test('Removing random item inside the linked list', () => {
	const ll: LinkedList = new LinkedList();
	const middle: ListNode = { key: '1', value: 1 };
	ll.insertHead({ key: '0', value: 0 });
	ll.insertHead(middle);
	ll.insertHead({ key: '2', value: 2 });
	ll.remove(middle);

	const head: ListNode = ll.getHead();
	expect(head.value).toBe(2);
	expect(head.next.value).toBe(0);
});

test('Updating linked list size', () => {
	const ll: LinkedList = new LinkedList();
	ll.insertHead({ key: '0', value: 0 });
	ll.insertHead({ key: '1', value: 1 });
	expect(ll.getSize()).toBe(2);
	ll.remove({ key: '0', value: 0 });
	expect(ll.getSize()).toBe(1);
	ll.remove({ key: '1', value: 1 });
	expect(ll.getSize()).toBe(0);
});
