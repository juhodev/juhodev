export type ServerConfig = {
	modules: Module[];
};

export type Module =
	| 'clips'
	| 'gif'
	| 'hoi4'
	| 'steam'
	| 'website'
	| 'baavo'
	| 'quote'
	| 'image'
	| 'metrics';
