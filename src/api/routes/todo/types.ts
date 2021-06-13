import { UserData } from '../../types';

export type Todo = {
	id: number;
	task: string;
	creator: UserData;
	addDate: number;
	done: boolean;
	doneDate: number;
	cancelled: boolean;
};

export type TodoResponse = {
	error: boolean;
	user: UserData;
	todos?: Todo[];
	errorCode?: number;
};
