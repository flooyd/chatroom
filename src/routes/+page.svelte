<script lang="ts">
	import { onlineUsers } from '$lib/stores/socket';
	import { messages, sendMessage } from '$lib/stores/messages';
	
	const title = "The Chat Room";
	
	let { data } = $props();
	let messageText = $state('');
	let messagesContainer = $state<HTMLDivElement>();
	let hoveredMessageId = $state<number | null>(null);
	let isAiResponding = $state(false);
	
	// Create a map of username to profile picture for quick lookup
	const userProfilePics = $derived(
		data.users?.reduce((acc, user) => {
			acc[user.username] = user.profilePictureUrl;
			return acc;
		}, {} as Record<string, string | null>) || {}
	);
	
	function isUserOnline(username: string): boolean {
		return $onlineUsers.includes(username);
	}

	function formatLastOnline(lastOnlineTime: Date | null): string {
		if (!lastOnlineTime) return 'Never';
		
		const now = new Date();
		const last = new Date(lastOnlineTime);
		const diffMs = now.getTime() - last.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
		
		return last.toLocaleDateString();
	}

	function formatMessageTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	async function handleSendMessage() {
		if (!messageText.trim() || !data.user) return;
		
		const success = await sendMessage(data.user.username, messageText);
		if (success) {
			messageText = '';
			// Scroll to bottom after sending
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		}
	}

	async function handleAiResponse(messageId: number) {
		if (isAiResponding) return;
		
		isAiResponding = true;
		hoveredMessageId = null;
		
		try {
			const response = await fetch('/api/messages/ai-respond', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messageId })
			});
			
			const data = await response.json();
			
			if (!data.success) {
				console.error('AI response failed:', data.error);
			}
			
			// Scroll to bottom to show AI response
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		} catch (error) {
			console.error('Failed to get AI response:', error);
		} finally {
			isAiResponding = false;
		}
	}

	async function handleDeleteMessage(messageId: number) {
		if (!confirm('Are you sure you want to delete this message?')) return;
		
		hoveredMessageId = null;
		
		try {
			const response = await fetch('/api/messages/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messageId })
			});
			
			const result = await response.json();
			
			if (!result.success) {
				console.error('Delete failed:', result.error);
				alert('Failed to delete message');
			}
		} catch (error) {
			console.error('Failed to delete message:', error);
			alert('Failed to delete message');
		}
	}

	// Auto-scroll when new messages arrive
	$effect(() => {
		if ($messages.length > 0 && messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});
</script>

{#if data.user && !data.user.isVerified}
	<div class="verification-notice">
		<div class="notice-icon">⚠️</div>
		<div class="notice-content">
			<p>Please verify your email address to access all features.</p>
			<a href="/profile">Verify Now →</a>
		</div>
	</div>
{/if}

{#if data.user && data.user.isVerified}
	<div class="chat-layout">
		<!-- Floating Users Panel -->
		<aside class="users-panel">
			<div class="panel-header">
				<h2>
					<span class="header-icon">👥</span>
					Online ({$onlineUsers.length})
				</h2>
			</div>
			
			{#if data.users && data.users.length > 0}
				<div class="users-grid">
					{#each data.users as user}
						<div class="user-card" class:online={isUserOnline(user.username)}>
							<div class="user-avatar-wrapper">
								{#if user.profilePictureUrl}
									<img src={user.profilePictureUrl} alt="{user.username}" class="user-avatar" />
								{:else}
									<div class="user-avatar-placeholder">
										{user.username.charAt(0).toUpperCase()}
									</div>
								{/if}
								<div class="status-pulse" class:active={isUserOnline(user.username)}></div>
							</div>
							<div class="user-info">
								<span class="username">{user.username}</span>
								{#if !isUserOnline(user.username)}
									<span class="last-seen">{formatLastOnline(user.lastOnlineTime)}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</aside>

		<!-- Main Chat Area -->
		<main class="chat-main">
			<div class="messages-wrapper">
				<div class="messages-container" bind:this={messagesContainer}>
					{#if $messages.length === 0}
						<div class="empty-state">
							<div class="empty-icon">💬</div>
							<p>No messages yet</p>
							<span>Start the conversation!</span>
						</div>
					{:else}
						{#each $messages as message (message.id)}
							<div 
								class="message-wrapper"
								class:own={message.username === data.user.username}
								onmouseenter={() => hoveredMessageId = message.id}
								onmouseleave={() => hoveredMessageId = null}
							>
								<div 
									class="message-bubble"
								>
									{#if message.username !== data.user.username}
										<div class="message-avatar-container">
											{#if userProfilePics[message.username]}
												<img src={userProfilePics[message.username]} alt="{message.username}" class="msg-avatar" />
											{:else}
												<div class="msg-avatar-placeholder">
													{message.username.charAt(0).toUpperCase()}
												</div>
											{/if}
										</div>
									{/if}
									
									<div class="bubble-content">
										<div class="bubble-header">
											<span class="bubble-username">{message.username}</span>
											<span class="bubble-time">{formatMessageTime(message.timestamp)}</span>
										</div>
										<div class="bubble-text">{message.text}</div>
									</div>
									
									{#if message.username === data.user.username}
										<div class="message-avatar-container">
											{#if userProfilePics[message.username]}
												<img src={userProfilePics[message.username]} alt="{message.username}" class="msg-avatar" />
											{:else}
												<div class="msg-avatar-placeholder">
													{message.username.charAt(0).toUpperCase()}
												</div>
											{/if}
										</div>
									{/if}
								</div>
								
								{#if hoveredMessageId === message.id}
									<div class="message-actions">
										{#if message.username !== 'claude'}
											<button 
												class="ai-respond-btn"
												onclick={() => handleAiResponse(message.id)}
												disabled={isAiResponding}
												title="Ask AI to respond"
											>
												🤖
											</button>
										{/if}
										{#if data.user?.username === 'admin' || message.username === data.user?.username}
											<button 
												class="delete-btn"
												onclick={() => handleDeleteMessage(message.id)}
												title="Delete message"
											>
												🗑️
											</button>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
			
			<div class="input-area">
				<form class="message-input-form" onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
					<input 
						type="text" 
						bind:value={messageText}
						placeholder="Type your message..." 
						maxlength="500"
						class="chat-input"
					/>
					<button type="submit" disabled={!messageText.trim()} class="send-btn">
						<span class="btn-text">Send</span>
						<span class="btn-icon">→</span>
					</button>
				</form>
			</div>
		</main>
	</div>
{/if}

<style>
	/* Verification Notice */
	.verification-notice {
		background: linear-gradient(135deg, rgba(255, 153, 0, 0.15), rgba(255, 193, 7, 0.1));
		backdrop-filter: blur(10px);
		border: 2px solid rgba(255, 153, 0, 0.4);
		border-radius: 16px;
		padding: 20px;
		margin: 20px 0;
		display: flex;
		gap: 15px;
		align-items: center;
		box-shadow: 0 8px 32px rgba(255, 153, 0, 0.1);
		animation: slideIn 0.3s ease-out;
	}

	.notice-icon {
		font-size: 2rem;
		filter: drop-shadow(0 2px 4px rgba(255, 153, 0, 0.3));
	}

	.notice-content p {
		margin: 0 0 8px 0;
		color: #ffc107;
		font-weight: 500;
	}

	.notice-content a {
		color: #00d4ff;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
	}

	.notice-content a:hover {
		color: #00ffaa;
		transform: translateX(3px);
		display: inline-block;
	}

	/* Chat Layout */
	.chat-layout {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 24px;
		height: calc(100vh - 160px);
		margin-top: 20px;
		position: relative;
	}

	/* Users Panel */
	.users-panel {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 24px;
		padding: 20px;
		position: sticky;
		top: 80px;
		height: fit-content;
		max-height: calc(100vh - 120px);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 212, 255, 0.05);
		animation: fadeIn 0.4s ease-out;
	}

	.panel-header {
		margin-bottom: 16px;
		padding-bottom: 16px;
		border-bottom: 1px solid rgba(0, 212, 255, 0.2);
	}

	.panel-header h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 1.1rem;
		font-weight: 600;
		color: #00d4ff;
		margin: 0;
	}

	.header-icon {
		font-size: 1.3rem;
		filter: drop-shadow(0 2px 4px rgba(0, 212, 255, 0.3));
	}

	.users-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
		overflow-y: auto;
		padding-right: 8px;
	}

	.users-grid::-webkit-scrollbar {
		width: 6px;
	}

	.users-grid::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
	}

	.users-grid::-webkit-scrollbar-thumb {
		background: rgba(0, 212, 255, 0.3);
		border-radius: 10px;
	}

	.users-grid::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 212, 255, 0.5);
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
	}

	.user-card:hover {
		background: rgba(0, 212, 255, 0.12);
		border-color: rgba(0, 212, 255, 0.3);
		transform: translateX(4px);
	}

	.user-card.online {
		border-color: rgba(0, 255, 136, 0.3);
	}

	.user-avatar-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.user-avatar-placeholder,
	.user-avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: 2px solid rgba(0, 212, 255, 0.4);
		object-fit: cover;
	}

	.status-pulse {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 12px;
		height: 12px;
		background: #ff3e00;
		border-radius: 50%;
		border: 2px solid black;
		transition: all 0.3s;
	}

	.status-pulse.active {
		background: #00ff88;
		box-shadow: 0 0 0 0 rgba(0, 255, 136, 1);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7);
		}
		70% {
			box-shadow: 0 0 0 8px rgba(0, 255, 136, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(0, 255, 136, 0);
		}
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.username {
		display: block;
		font-weight: 600;
		color: white;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.last-seen {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 2px;
	}

	/* Chat Main */
	.chat-main {
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 212, 255, 0.05);
		animation: fadeIn 0.4s ease-out 0.1s backwards;
	}

	.messages-wrapper {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.messages-container::-webkit-scrollbar {
		width: 8px;
	}

	.messages-container::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.03);
	}

	.messages-container::-webkit-scrollbar-thumb {
		background: rgba(0, 212, 255, 0.3);
		border-radius: 10px;
	}

	.messages-container::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 212, 255, 0.5);
	}

	.empty-state {
		margin: auto;
		text-align: center;
		color: rgba(255, 255, 255, 0.3);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 12px;
		opacity: 0.5;
		filter: grayscale(1);
	}

	.empty-state p {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0 0 4px 0;
	}

	.empty-state span {
		font-size: 0.9rem;
	}

	/* Message Bubbles */
	.message-wrapper {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		animation: messageSlide 0.3s ease-out;
		position: relative;
	}

	.message-wrapper.own {
		justify-content: flex-end;
	}

	.message-bubble {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		max-width: 75%;
	}

	.message-wrapper.own .message-bubble {
		flex-direction: row-reverse;
	}

	@keyframes messageSlide {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message-avatar-container {
		flex-shrink: 0;
	}

	.msg-avatar,
	.msg-avatar-placeholder {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: 2px solid rgba(0, 212, 255, 0.4);
		object-fit: cover;
	}

	.bubble-content {
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 255, 170, 0.1));
		backdrop-filter: blur(10px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 18px 18px 18px 4px;
		padding: 12px 16px;
		max-width: 100%;
		word-wrap: break-word;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		transition: all 0.2s;
	}

	.message-wrapper.own .bubble-content {
		background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 200, 100, 0.1));
		border-color: rgba(0, 255, 136, 0.3);
		border-radius: 18px 18px 4px 18px;
	}

	.bubble-content:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.bubble-header {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 6px;
	}

	.bubble-username {
		font-weight: 700;
		font-size: 0.85rem;
		color: #00d4ff;
	}

	.message-wrapper.own .bubble-username {
		color: #00ff88;
	}

	.bubble-time {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		margin-left: auto;
	}

	.bubble-text {
		font-size: 0.95rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.95);
	}

	.message-actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 6px;
	}

	.ai-respond-btn,
	.delete-btn {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid;
		border-radius: 50%;
		color: white;
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		animation: fadeInButton 0.2s ease-out;
	}

	.ai-respond-btn {
		background: linear-gradient(135deg, #8b5cf6, #7c3aed);
		border-color: rgba(139, 92, 246, 0.5);
	}

	.ai-respond-btn:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 4px 16px rgba(139, 92, 246, 0.6);
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
	}

	.ai-respond-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.ai-respond-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		animation: pulse-ai 1.5s infinite;
	}

	.delete-btn {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.delete-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
		background: linear-gradient(135deg, #dc2626, #b91c1c);
	}

	.delete-btn:active {
		transform: scale(0.95);
	}

	@keyframes fadeInButton {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes pulse-ai {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	/* Input Area */
	.input-area {
		padding: 20px 24px;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
		border-top: 1px solid rgba(0, 212, 255, 0.15);
	}

	.message-input-form {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.chat-input {
		flex: 1;
		padding: 14px 20px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(0, 212, 255, 0.3);
		border-radius: 24px;
		color: white;
		font-size: 0.95rem;
		transition: all 0.3s;
		outline: none;
	}

	.chat-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.chat-input:focus {
		background: rgba(255, 255, 255, 0.08);
		border-color: #00d4ff;
		box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
	}

	.send-btn {
		padding: 14px 28px;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		border: none;
		border-radius: 24px;
		color: white;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		gap: 8px;
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	.send-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
		background: linear-gradient(135deg, #00ffaa, #00d4ff);
	}

	.send-btn:active:not(:disabled) {
		transform: translateY(0);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: rgba(0, 212, 255, 0.3);
		box-shadow: none;
	}

	.btn-icon {
		font-size: 1.2rem;
		transition: transform 0.3s;
	}

	.send-btn:hover:not(:disabled) .btn-icon {
		transform: translateX(4px);
	}

	/* Animations */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Responsive */
	@media (max-width: 968px) {
		.chat-layout {
			grid-template-columns: 1fr;
			height: auto;
			gap: 16px;
		}

		.users-panel {
			position: relative;
			top: 0;
			max-height: 300px;
		}

		.chat-main {
			min-height: 500px;
		}

		.message-bubble {
			max-width: 85%;
		}
	}

	@media (max-width: 600px) {
		.message-input-form {
			flex-direction: column;
			gap: 8px;
		}

		.chat-input {
			width: 100%;
		}

		.send-btn {
			width: 100%;
			justify-content: center;
		}

		.user-avatar,
		.user-avatar-placeholder,
		.msg-avatar,
		.msg-avatar-placeholder {
			width: 64px;
			height: 64px;
			font-size: 1.5rem;
		}
	}
</style>
