// Database-backed message store
import { db } from '$lib/server/db';
import { messages, reactions } from '$lib/server/db/schema';
import { desc, gt, sql, eq } from 'drizzle-orm';

interface Reaction {
	type: string;
	users: string[];
}

interface Message {
	id: number;
	username: string;
	text: string;
	timestamp: number;
	profilePictureUrl?: string | null;
	linkToMessage?: number | null;
	reactions?: Reaction[];
}

const MAX_MESSAGES = 50; // Keep only last 50 messages

export async function addMessage(username: string, text: string, profilePictureUrl?: string | null, linkToMessage?: number | null): Promise<Message> {
	// Insert the new message
	const values: any = {
		username,
		text,
		timestamp: Date.now(),
		profilePictureUrl
	};
	
	if (linkToMessage !== undefined && linkToMessage !== null) {
		values.linkToMessage = linkToMessage;
	}
	
	const [message] = await db
		.insert(messages)
		.values(values)
		.returning();

	// Clean up old messages (keep only last MAX_MESSAGES)
	await cleanupOldMessages();

	return {
		id: message.id,
		username: message.username,
		text: message.text,
		timestamp: message.timestamp,
		profilePictureUrl: message.profilePictureUrl,
		linkToMessage: message.linkToMessage
	};
}

export async function getMessages(since?: number): Promise<Message[]> {
	let result;
	
	if (since) {
		result = await db
			.select()
			.from(messages)
			.where(gt(messages.timestamp, since))
			.orderBy(messages.timestamp);
	} else {
		result = await db
			.select()
			.from(messages)
			.orderBy(desc(messages.timestamp))
			.limit(MAX_MESSAGES);
		
		// Return in chronological order (oldest first)
		result = result.reverse();
	}

	// Get reactions for all messages
	const messageIds = result.map(m => m.id);
	if (messageIds.length > 0) {
		const allReactions = await db
			.select()
			.from(reactions)
			.where(sql`${reactions.messageId} IN (${sql.join(messageIds.map(id => sql`${id}`), sql`, `)})`);

		// Group reactions by message and type
		const reactionsByMessage = new Map<number, Map<string, string[]>>();
		allReactions.forEach((r) => {
			if (!reactionsByMessage.has(r.messageId)) {
				reactionsByMessage.set(r.messageId, new Map());
			}
			const msgReactions = reactionsByMessage.get(r.messageId)!;
			if (!msgReactions.has(r.type)) {
				msgReactions.set(r.type, []);
			}
			msgReactions.get(r.type)!.push(r.username);
		});

		// Add reactions to messages
		return result.map(msg => ({
			...msg,
			reactions: reactionsByMessage.has(msg.id)
				? Array.from(reactionsByMessage.get(msg.id)!.entries()).map(([type, users]) => ({ type, users }))
				: []
		}));
	}

	return result;
}

async function cleanupOldMessages(): Promise<void> {
	// Delete messages beyond the MAX_MESSAGES limit
	await db.execute(sql`
		DELETE FROM ${messages}
		WHERE id NOT IN (
			SELECT id FROM ${messages}
			ORDER BY timestamp DESC
			LIMIT ${MAX_MESSAGES}
		)
	`);
}

export async function deleteMessage(messageId: number): Promise<boolean> {
	const result = await db
		.delete(messages)
		.where(sql`${messages.id} = ${messageId}`);
	
	return true;
}
