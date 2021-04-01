import { MessageEmbed } from 'discord.js';
import { cancelTodo, completeTodo, removeTodo, saveTodo, sendUserTodos } from '../todo/todo';
import { isNil } from '../utils';
import { Command } from './types';

const TodoCommand: Command = {
	execute: (channel, author, args, db) => {
		if (args.length === 0) {
			sendUserTodos(channel, author);
			return;
		}

		const arg: string = args.shift();

		switch (arg) {
			case 'add':
				saveTodo(channel, author, args.join(' '));
				break;

			case 'done':
				const doneArg: string = args.shift();
				if (doneArg === undefined) {
					channel.send('!todo done <number>');
					return;
				}

				completeTodo(channel, author, doneArg);
				break;

			case 'cancel':
				const cancelArg: string = args.shift();
				if (cancelArg === undefined) {
					channel.send('!todo cancel <number>');
					return;
				}

				cancelTodo(channel, author, cancelArg);
				break;

			case 'remove':
				const removeArg: string = args.shift();
				if (removeArg === undefined) {
					channel.send('!todo remove <number>');
					return;
				}

				removeTodo(channel, author, removeArg);
				break;

			default:
				channel.send('!todo <add|done|cancel|remove>');
				break;
		}
	},
	alias: ['!todo'],
};

export default TodoCommand;
