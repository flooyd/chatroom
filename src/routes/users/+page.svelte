<script lang="ts">
	import { onlineUsers } from '$lib/stores/socket';
	
	const title = "Users";
	let { data } = $props();

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
</script>

<svelte:head>
	<title>{title} - The Chat Room</title>
</svelte:head>

<div class="container">
	<h1>{title}</h1>
	
	{#if data.user && data.user.isVerified}
		{#if data.users && data.users.length > 0}
			<div class="stats">
				<span class="online-count">
					<span class="status-indicator"></span>
					{$onlineUsers.length} online
				</span>
				<span class="total-count">{data.users.length} total users</span>
			</div>
			
			<div class="users-grid">
				{#each data.users as user}
					<div class="user-card" class:online={isUserOnline(user.username)}>
						<div class="user-header">
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
						</div>
						<div class="user-info">
							<span class="username" class:claude={user.username === 'claude'} class:current-user={data.user && user.username === data.user.username}>
								{user.username}
							</span>
							{#if isUserOnline(user.username)}
								<span class="status online-text">Online</span>
							{:else}
								<span class="status offline-text">{formatLastOnline(user.lastOnlineTime)}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-message">No users found.</p>
		{/if}
	{:else}
		<p class="auth-message">Please log in and verify your account to view users.</p>
	{/if}
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 20px 20px;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #00d4ff, #00ff88);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 24px;
	}

	.stats {
		display: flex;
		gap: 24px;
		margin-bottom: 32px;
		padding: 8px;
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 16px;
		align-items: center;
	}

	.online-count,
	.total-count {
		font-size: 1.1rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-indicator {
		width: 12px;
		height: 12px;
		background: #00ff88;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
		}
		50% {
			opacity: 0.6;
			box-shadow: 0 0 16px rgba(0, 255, 136, 0.8);
		}
	}

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 24px;
	}

	.user-card {
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.9), rgba(8, 8, 12, 0.85));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 20px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		transition: all 0.3s;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}

	.user-card:hover {
		transform: translateY(-4px);
		border-color: rgba(0, 212, 255, 0.5);
		box-shadow: 0 8px 24px rgba(0, 212, 255, 0.2);
	}

	.user-card.online {
		border-color: rgba(0, 255, 136, 0.4);
	}

	.user-card.online:hover {
		border-color: rgba(0, 255, 136, 0.6);
		box-shadow: 0 8px 24px rgba(0, 255, 136, 0.2);
	}

	.user-header {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.user-avatar-wrapper {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.user-avatar,
	.user-avatar-placeholder {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: 3px solid rgba(0, 212, 255, 0.3);
		transition: all 0.3s;
	}

	.user-card.online .user-avatar,
	.user-card.online .user-avatar-placeholder {
		border-color: rgba(0, 255, 136, 0.5);
	}

	.user-avatar {
		object-fit: cover;
	}

	.user-avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 255, 136, 0.1));
		color: #00d4ff;
		font-size: 3rem;
		font-weight: 700;
	}

	.status-pulse {
		position: absolute;
		bottom: 8px;
		right: 8px;
		width: 20px;
		height: 20px;
		background: rgba(100, 100, 100, 0.5);
		border: 3px solid rgba(12, 12, 18, 0.9);
		border-radius: 50%;
		transition: all 0.3s;
	}

	.status-pulse.active {
		background: #00ff88;
		box-shadow: 0 0 12px rgba(0, 255, 136, 0.6);
		animation: pulse 2s ease-in-out infinite;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		width: 100%;
	}

	.username {
		font-size: 1.3rem;
		font-weight: 700;
		color: white;
		text-align: center;
		word-break: break-word;
	}

	.username.claude {
		color: #a855f7;
	}

	.username.current-user {
		color: #10b981;
	}

	.status {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.online-text {
		color: #00ff88;
	}

	.offline-text {
		color: rgba(255, 255, 255, 0.4);
	}

	.empty-message,
	.auth-message {
		color: rgba(255, 255, 255, 0.7);
		font-size: 1.1rem;
		text-align: center;
		padding: 8px;
	}

	@media (max-width: 768px) {
		.container {
			padding: 16px;
		}

		h1 {
			font-size: 2rem;
		}

		.stats {
			flex-direction: column;
			gap: 12px;
			padding: 8px;
			align-items: flex-start;
		}

		.users-grid {
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
			gap: 16px;
		}

		.user-card {
			padding: 8px;
		}

		.user-avatar-wrapper {
			width: 100px;
			height: 100px;
		}

		.user-avatar,
		.user-avatar-placeholder {
			width: 100px;
			height: 100px;
			font-size: 2.5rem;
		}

		.username {
			font-size: 1.1rem;
		}
	}
</style>
