import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Access the global online count set by the socket server
	const count = (global as any).onlineUsersCount || 0;
	return json({ count });
};
