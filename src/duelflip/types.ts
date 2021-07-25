export type DuelFlipChallenge = {
	// This is used for removeing thigns
	id: string;
	challengedBy: string;
	otherUser: string;
	amount: number;
	side: string;
	time: Date;
};
