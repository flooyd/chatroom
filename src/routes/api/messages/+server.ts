import { json } from '@sveltejs/kit';
import { getMessages } from '$lib/server/messageStore';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const since = url.searchParams.get('since');
		const sinceTimestamp = since ? parseInt(since) : undefined;
		
		const messages = await getMessages(sinceTimestamp);
		
		return json({ messages });
	} catch (error) {
		console.error('Get messages error:', error);
		return json({ error: 'Failed to get messages' }, { status: 500 });
	}
};
