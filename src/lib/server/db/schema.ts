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
});
