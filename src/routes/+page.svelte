<script lang="ts">
	import { onlineUsers } from '$lib/stores/socket';
	import { messages, sendMessage } from '$lib/stores/messages';
	
	const title = "The Chat Room";
	
	let { data } = $props();
	let messageText = $state('');
	let messagesContainer = $state<HTMLDivElement>();
	
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

	// Auto-scroll when new messages arrive
	$effect(() => {
		if ($messages.length > 0 && messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});
</script>

{#if data.user && !data.user.isVerified}
	<div class="verification-notice">
		<p>⚠️ Please verify your email address to access all features. Check your email for the verification code, then visit your <a href="/profile">profile</a> to verify.</p>
	</div>
{/if}

{#if data.user && data.user.isVerified}
	<div class="chat-container">
		<div class="users-section">
			<h2>Users</h2>
			{#if data.users && data.users.length > 0}
				<ul class="users-list">
					{#each data.users as user}
						<li>
							<div class="user-item">
								{#if user.profilePictureUrl}
									<img src={user.profilePictureUrl} alt="{user.username}'s profile" class="user-avatar" />
								{:else}
									<div class="user-avatar-placeholder">
										{user.username.charAt(0).toUpperCase()}
									</div>
								{/if}
								<span class="username">{user.username}</span>
								{#if isUserOnline(user.username)}
									<span class="status-indicator online"></span>
								{:else}
									<span 
										class="status-indicator offline" 
										title="Last seen: {formatLastOnline(user.lastOnlineTime)}"
									></span>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p>No users found.</p>
			{/if}
		</div>

		<div class="messages-section">
			<h2>Messages</h2>
			<div class="messages-container" bind:this={messagesContainer}>
				{#if $messages.length === 0}
					<p class="no-messages">No messages yet. Start the conversation!</p>
				{:else}
					{#each $messages as message (message.id)}
						<div class="message" class:own-message={message.username === data.user.username}>
							<div class="message-content">
								{#if message.profilePictureUrl}
									<img src={message.profilePictureUrl} alt="{message.username}'s profile" class="message-avatar" />
								{:else}
									<div class="message-avatar-placeholder">
										{message.username.charAt(0).toUpperCase()}
									</div>
								{/if}
								<div class="message-body">
									<div class="message-header">
										<span class="message-username">{message.username}</span>
										<span class="message-time">{formatMessageTime(message.timestamp)}</span>
									</div>
									<div class="message-text">{message.text}</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
			<form class="message-input" onsubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
				<input 
					type="text" 
					bind:value={messageText}
					placeholder="Type a message..." 
					maxlength="500"
				/>
				<button type="submit" disabled={!messageText.trim()}>Send</button>
			</form>
		</div>
	</div>
{/if}

<style>
	.verification-notice {
		background: rgba(255, 153, 0, 0.1);
		border: 2px solid #ff9900;
		border-radius: 8px;
		padding: 15px;
		margin-top: 20px;
		max-width: 600px;
	}

	.verification-notice p {
		margin: 0;
		color: #ff9900;
	}

	.verification-notice a {
		color: #646cff;
		text-decoration: underline;
	}

	.verification-notice a:hover {
		color: #535bf2;
	}

	.users-section {
		flex: 0 0 250px;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 80px;
		max-height: calc(100vh - 100px);
		overflow-y: auto;
		background: black;
	}

	.users-section h2 {
		margin-bottom: 20px;
		color: #646cff;
	}

	.chat-container {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-top: 20px;
		max-width: 1200px;
		height: calc(100vh - 200px);
	}

	.messages-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-width: 300px;
	}

	.messages-section h2 {
		margin-bottom: 20px;
		color: #646cff;
	}

	@media (max-width: 768px) {
		.chat-container {
			flex-direction: column;
			height: auto;
		}

		.users-section {
			flex: 1;
			width: 100%;
		}

		.messages-section {
			flex: 1;
			width: 100%;
			height: 500px;
		}
	}

	.messages-container {
		flex: 1;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid #646cff;
		border-radius: 8px;
		padding: 20px;
		overflow-y: auto;
		margin-bottom: 15px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.no-messages {
		text-align: center;
		color: rgba(255, 255, 255, 0.5);
		margin: auto;
	}

	.message {
		background: rgba(100, 108, 255, 0.1);
		border: 1px solid rgba(100, 108, 255, 0.3);
		border-radius: 8px;
		padding: 10px 12px;
		max-width: 70%;
		word-wrap: break-word;
	}

	.message.own-message {
		align-self: flex-end;
		background: rgba(0, 255, 0, 0.1);
		border-color: rgba(0, 255, 0, 0.3);
	}

	.message-content {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.message-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #646cff;
		flex-shrink: 0;
	}

	.message-avatar-placeholder {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #646cff, #535bf2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		font-weight: bold;
		color: white;
		border: 2px solid #646cff;
		flex-shrink: 0;
	}

	.message-body {
		flex: 1;
		min-width: 0;
	}

	.message-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 5px;
		gap: 10px;
	}

	.message-username {
		font-weight: bold;
		color: #646cff;
		font-size: 0.9rem;
	}

	.own-message .message-username {
		color: #00ff00;
	}

	.message-time {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.message-text {
		font-size: 1rem;
		line-height: 1.4;
	}

	.message-input {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	.message-input input {
		flex: 1;
		padding: 12px;
		border: 2px solid #646cff;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.3);
		color: white;
		font-size: 1rem;
	}

	.message-input input:focus {
		outline: none;
		border-color: #535bf2;
		box-shadow: 0 0 0 2px rgba(83, 91, 242, 0.2);
	}

	.message-input button {
		padding: 12px 24px;
		white-space: nowrap;
	}

	.message-input button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.users-list {
		background: rgba(255, 255, 255, 0.05);
		z-index: 100;
		border: 2px solid #646cff;
		border-radius: 8px;
		padding: 20px;
		list-style: none;
		margin: 0;
	}

	.users-list li {
		padding: 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.users-list li:last-child {
		border-bottom: none;
	}

	.users-list li:hover {
		background: rgba(100, 108, 255, 0.1);
		border-radius: 4px;
	}

	.user-item {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #646cff;
	}

	.user-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #646cff, #535bf2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		font-weight: bold;
		color: white;
		border: 2px solid #646cff;
	}

	.username {
		font-size: 1rem;
		font-weight: 500;
		flex: 1;
	}

	.status-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-left: auto;
	}

	.status-indicator.online {
		background-color: #00ff00;
		box-shadow: 0 0 4px #00ff00;
	}

	.status-indicator.offline {
		background-color: #ff3e00;
		box-shadow: 0 0 4px #ff3e00;
		cursor: help;
	}
</style>
