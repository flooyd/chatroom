// Database-backed message store
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { desc, gt, sql } from 'drizzle-orm';

interface Message {
	id: number;
	username: string;
	text: string;
	timestamp: number;
	profilePictureUrl?: string | null;
	linkToMessage?: number | null;
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
	if (since) {
		const result = await db
			.select()
			.from(messages)
			.where(gt(messages.timestamp, since))
			.orderBy(messages.timestamp);
		return result;
	}

	const result = await db
		.select()
		.from(messages)
		.orderBy(desc(messages.timestamp))
		.limit(MAX_MESSAGES);
	
	// Return in chronological order (oldest first)
	return result.reverse();
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
