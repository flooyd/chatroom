import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleUser } from '$lib/server/google-auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		throw redirect(303, '/?error=google_auth_cancelled');
	}

	if (!code) {
		throw redirect(303, '/?error=missing_code');
	}

	try {
		const redirectUri = `${url.origin}/auth/google/callback`;
		console.log('Getting Google user with code and redirectUri:', redirectUri);
		const googleUser = await getGoogleUser(code, redirectUri);
		console.log('Google user received:', { id: googleUser.id, email: googleUser.email });

		// Check if user exists by Google ID
		let [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.googleId, googleUser.id))
			.limit(1);

		console.log('Existing user by googleId:', existingUser?.username || 'none');

		// If not found by Google ID, check by email
		if (!existingUser) {
			[existingUser] = await db
				.select()
				.from(users)
				.where(eq(users.email, googleUser.email))
				.limit(1);

			console.log('Existing user by email:', existingUser?.username || 'none');

			// If user exists with same email, link Google account
			if (existingUser) {
				console.log('Linking Google account to existing user');
				await db
					.update(users)
					.set({ 
						googleId: googleUser.id,
						isVerified: true, // Google accounts are verified
						profilePictureUrl: existingUser.profilePictureUrl || googleUser.picture
					})
					.where(eq(users.id, existingUser.id));
			}
		}

		if (existingUser) {
			// User exists - log them in
			console.log('Logging in existing user:', existingUser.username);
			cookies.set('session', existingUser.id.toString(), {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});

			// Update last online time
			await db
				.update(users)
				.set({ lastOnlineTime: new Date() })
				.where(eq(users.id, existingUser.id));

			throw redirect(303, '/');
		} else {
			// New user - store Google data in session and redirect to complete registration
			console.log('New Google user - redirecting to signup completion');
			const googleData = {
				id: googleUser.id,
				email: googleUser.email,
				name: googleUser.name,
				picture: googleUser.picture
			};

			cookies.set('google_signup', JSON.stringify(googleData), {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 60 * 10 // 10 minutes to complete registration
			});

			throw redirect(303, '/auth/complete-google-signup');
		}
	} catch (error) {
		// If it's a redirect, re-throw it
		if (error instanceof Response || (error && typeof error === 'object' && 'status' in error && 'location' in error)) {
			throw error;
		}
		console.error('Google auth error:', error);
		throw redirect(303, '/?error=google_auth_failed');
	}
};
