import { DBBlackjackCard, DBBlackjackHand } from '../db/types';
import { knex } from '../db/utils';

export async function createBlackjackHand(snowflake: string, gameId: number): Promise<number> {
	const id: number = await knex<DBBlackjackHand>('blackjack_hand')
		.insert({
			game_id: gameId,
			snowflake,
		})
		.returning<number>('id');

	return id;
}

export async function updateBlackjackHand(handId: number, result: string) {
	await knex<DBBlackjackHand>('blackjack_hand').update({ result }).where({ id: handId });
}

export async function saveBlackjackCard(handId: number, snowflake: string, card: string) {
	await knex<DBBlackjackCard>('blackjack_card').insert({ hand_id: handId, card, snowflake });
}
