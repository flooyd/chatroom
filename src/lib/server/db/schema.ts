import { pgTable, serial, text, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	verificationCode: text('verification_code'),
	isVerified: boolean('is_verified').notNull().default(false),
	profilePictureUrl: text('profile_picture_url'),
});
