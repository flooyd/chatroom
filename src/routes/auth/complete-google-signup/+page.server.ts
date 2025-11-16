import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const load: PageServerLoad = async ({ cookies }) => {
	const googleData = cookies.get('google_signup');
	
	if (!googleData) {
		throw redirect(303, '/');
	}

	try {
		const data = JSON.parse(googleData);
		return {
			email: data.email,
			name: data.name,
			picture: data.picture
		};
	} catch {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	completeSignup: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;

		// Get Google data from cookie
		const googleData = cookies.get('google_signup');
		if (!googleData) {
			return fail(400, { error: 'Session expired. Please try signing in again.' });
		}

		let googleUser;
		try {
			googleUser = JSON.parse(googleData);
		} catch {
			return fail(400, { error: 'Invalid session data.' });
		}

		// Validate username
		if (!username || username.trim().length < 3) {
			return fail(400, { error: 'Username must be at least 3 characters long.' });
		}

		if (username.trim().length > 20) {
			return fail(400, { error: 'Username must be 20 characters or less.' });
		}

		try {
			// Check if username is already taken
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.username, username.trim()))
				.limit(1);

			if (existingUser.length > 0) {
				return fail(400, { error: 'Username is already taken.' });
			}

			// Create the new user with Google data
			const newUser = await db
				.insert(users)
				.values({
					username: username.trim(),
					email: googleUser.email,
					googleId: googleUser.id,
					isVerified: true, // Google users are auto-verified
					profilePictureUrl: null, // Don't use Google picture, let them see username letter
					passwordHash: null, // No password for Google users
					verificationCode: null
				})
				.returning();

			console.log('New user created:', newUser[0]?.username);

			// Set session cookie with user ID
			cookies.set('session', newUser[0].id.toString(), {
				path: '/',
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});

			// Clear the temporary Google signup cookie
			cookies.delete('google_signup', { path: '/' });

			// Redirect to home page
			throw redirect(303, '/');
		} catch (error) {
			if (error instanceof Response || (error && typeof error === 'object' && 'status' in error)) {
				throw error;
			}
			console.error('Error creating user:', error);
			if (error instanceof Error) {
				console.error('Error message:', error.message);
				console.error('Error stack:', error.stack);
			}
			return fail(500, { error: 'An error occurred creating your account.' });
		}
	}
};
