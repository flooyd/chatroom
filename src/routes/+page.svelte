<script lang="ts">
	import { onlineUsers } from '$lib/stores/socket';
	
	const title = "The Chat Room";
	
	let { data } = $props();
	
	function isUserOnline(username: string): boolean {
		return $onlineUsers.includes(username);
	}
</script>

<h1>Welcome to {title}</h1>

{#if data.user && !data.user.isVerified}
	<div class="verification-notice">
		<p>⚠️ Please verify your email address to access all features. Check your email for the verification code, then visit your <a href="/profile">profile</a> to verify.</p>
	</div>
{/if}

{#if data.user && data.user.isVerified}
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
							<span class="status-indicator {isUserOnline(user.username) ? 'online' : 'offline'}"></span>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No users found.</p>
		{/if}
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
		margin-top: 30px;
		max-width: 600px;
	}

	.users-section h2 {
		font-size: 1.5rem;
		margin-bottom: 15px;
		color: #646cff;
	}

	.users-list {
		background: rgba(255, 255, 255, 0.05);
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
	}
</style>
