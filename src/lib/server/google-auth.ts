import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleUser {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	picture: string;
}

export function getGoogleAuthUrl(redirectUri: string): string {
	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		access_type: 'offline',
		prompt: 'select_account'
	});
	
	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getGoogleUser(code: string, redirectUri: string): Promise<GoogleUser> {
	// Exchange code for access token
	const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: redirectUri,
			grant_type: 'authorization_code'
		})
	});

	if (!tokenResponse.ok) {
		const errorText = await tokenResponse.text();
		console.error('Google token error:', errorText);
		throw new Error(`Failed to get access token from Google: ${errorText}`);
	}

	const tokenData = await tokenResponse.json();
	console.log('Token data received:', { has_access_token: !!tokenData.access_token });
	const accessToken = tokenData.access_token;

	if (!accessToken) {
		throw new Error('No access token in response');
	}

	// Get user info
	const userResponse = await fetch(GOOGLE_USERINFO_URL, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!userResponse.ok) {
		const errorText = await userResponse.text();
		console.error('Google userinfo error:', errorText);
		throw new Error(`Failed to get user info from Google: ${errorText}`);
	}

	const userData = await userResponse.json();
	console.log('User data received:', { id: userData.id, email: userData.email });
	return userData;
}
