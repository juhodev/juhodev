import { DMChannel, MessageEmbed, NewsChannel, TextChannel, User } from 'discord.js';
import { DBTodo } from '../db/types';
import { knex } from '../db/utils';

export async function saveTodo(channel: TextChannel | DMChannel | NewsChannel, author: User, task: string) {
	const todo: DBTodo = {
		creator: author.id,
		add_date: new Date().getTime(),
		cancelled: false,
		done: false,
		done_date: 0,
		task,
	};

	await knex<DBTodo>('todo').insert(todo);

	channel.send(new MessageEmbed({ title: 'Todo added to your list!' }));
}

export async function completeTodo(channel: TextChannel | DMChannel | NewsChannel, author: User, todoNumber: string) {
	const todos: DBTodo[] = await getTodosForUser(author.id);

	if (todos.length === 0) {
		channel.send(new MessageEmbed({ title: `This user does not have a TODO list` }));
		return;
	}

	const orderedTasks: DBTodo[] = await getOrderedTodos(channel, author);
	const correctTodo: DBTodo = orderedTasks[parseInt(todoNumber)];
	await knex<DBTodo>('todo').where({ id: correctTodo.id }).update({ done: true, done_date: new Date().getTime() });

	channel.send(new MessageEmbed({ title: `Todo ${correctTodo.task} completed` }));
}

export async function cancelTodo(channel: TextChannel | DMChannel | NewsChannel, author: User, todoNumber: string) {
	const todos: DBTodo[] = await getTodosForUser(author.id);

	if (todos.length === 0) {
		channel.send(new MessageEmbed({ title: `This user does not have a TODO list` }));
		return;
	}

	const orderedTasks: DBTodo[] = await getOrderedTodos(channel, author);
	const correctTodo: DBTodo = orderedTasks[parseInt(todoNumber)];
	await knex<DBTodo>('todo').where({ id: correctTodo.id }).update({ cancelled: true });

	channel.send(new MessageEmbed({ title: `Todo ${correctTodo.task} cancelled` }));
}

export async function removeTodo(channel: TextChannel | DMChannel | NewsChannel, author: User, todoNumber: string) {
	const todos: DBTodo[] = await getTodosForUser(author.id);

	if (todos.length === 0) {
		channel.send(new MessageEmbed({ title: `This user does not have a TODO list` }));
		return;
	}

	const orderedTasks: DBTodo[] = await getOrderedTodos(channel, author);
	const correctTodo: DBTodo = orderedTasks[parseInt(todoNumber)];
	await knex<DBTodo>('todo').where({ id: correctTodo.id }).delete();

	channel.send(new MessageEmbed({ title: `Todo ${correctTodo.task} removed` }));
}

export async function sendUserTodos(channel: TextChannel | DMChannel | NewsChannel, author: User) {
	const todos: DBTodo[] = await getTodosForUser(author.id);

	if (todos.length === 0) {
		channel.send(new MessageEmbed({ title: `This user does not have a TODO list` }));
		return;
	}

	const message: MessageEmbed = new MessageEmbed({ title: `Todo list for ${author.username}` });
	const undoneTasks: DBTodo[] = todos.filter((todo) => !todo.done && !todo.cancelled);
	const cancelledTasks: DBTodo[] = todos.filter((todo) => todo.cancelled);
	const doneTasks: DBTodo[] = todos.filter((todo) => todo.done);

	let count: number = 0;
	for (const todo of undoneTasks.sort((a, b) => b.add_date - a.add_date)) {
		message.addField(`${count++}: [   ] ${todo.task}`, `Created ${new Date(todo.add_date).toLocaleString()}`);
	}

	for (const todo of doneTasks.sort((a, b) => b.add_date - a.add_date)) {
		message.addField(`${count++}: [ x ] ${todo.task}`, `Done ${new Date(todo.done_date).toLocaleString()}`);
	}

	for (const todo of cancelledTasks.sort((a, b) => b.add_date - a.add_date)) {
		message.addField(`${count++}: [ - ] ${todo.task}`, `Maybe add something here idk`);
	}

	channel.send(message);
}

async function getTodosForUser(id: string): Promise<DBTodo[]> {
	const dbTodos: DBTodo[] = await knex<DBTodo>('todo').where({ creator: id });

	return dbTodos;
}

async function getOrderedTodos(channel: TextChannel | DMChannel | NewsChannel, author: User): Promise<DBTodo[]> {
	const todos: DBTodo[] = await getTodosForUser(author.id);

	if (todos.length === 0) {
		channel.send(new MessageEmbed({ title: `This user does not have a TODO list` }));
		return;
	}

	const undoneTasks: DBTodo[] = todos.filter((todo) => !todo.done && !todo.cancelled);
	const cancelledTasks: DBTodo[] = todos.filter((todo) => todo.cancelled);
	const doneTasks: DBTodo[] = todos.filter((todo) => todo.done);

	const orderedTasks: DBTodo[] = [];

	for (const todo of undoneTasks.sort((a, b) => b.add_date - a.add_date)) {
		orderedTasks.push(todo);
	}

	for (const todo of doneTasks.sort((a, b) => b.add_date - a.add_date)) {
		orderedTasks.push(todo);
	}

	for (const todo of cancelledTasks.sort((a, b) => b.add_date - a.add_date)) {
		orderedTasks.push(todo);
	}

	return orderedTasks;
}
