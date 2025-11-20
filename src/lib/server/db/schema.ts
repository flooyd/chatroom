import { pgTable, serial, text, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	verificationCode: text('verification_code'),
	isVerified: boolean('is_verified').notNull().default(false),
	profilePictureUrl: text('profile_picture_url'),
	lastOnlineTime: timestamp('last_online_time'),
	googleId: text('google_id').unique(),
});

export const messages = pgTable('messages', {
	id: serial('id').primaryKey(),
	username: text('username').notNull(),
	text: text('text').notNull(),
	timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
	profilePictureUrl: text('profile_picture_url'),
	linkToMessage: bigint('link_to_message', { mode: 'number' }),
});

export const documents = pgTable('documents', {
	id: serial('id').primaryKey(),
	userId: serial('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	content: text('content').notNull(),
	uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

export const reactions = pgTable('reactions', {
	id: serial('id').primaryKey(),
	messageId: serial('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
	username: text('username').notNull(),
	type: text('type').notNull(), // e.g., 'like', 'love', etc.
	createdAt: timestamp('created_at').notNull().defaultNow(),
});
