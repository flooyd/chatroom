<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { initializeSocket, disconnectSocket } from '$lib/stores/socket';
	import { initializeMessages, disconnectMessages } from '$lib/stores/messages';

	let { children, data } = $props();

	const title = "The Chat Room";
	let loggedIn = $state(!!data.user);
	let username = $state(data.user?.username || "");
	let showLoginModal = $state(false);
	let loginOrRegister = $state("Login");
	let errorMessage = $state("");

	// Sync state with data prop changes (e.g., after logout)
	$effect(() => {
		loggedIn = !!data.user;
		username = data.user?.username || "";
		
		// Initialize or disconnect socket and messages based on login status and verification
		if (loggedIn && username && data.user?.isVerified) {
			initializeSocket(username, data.user.isVerified);
			initializeMessages(username, data.user.isVerified);
		} else {
			disconnectSocket();
			disconnectMessages();
		}
	});

	const openLoginModal = () => {
		showLoginModal = true;
		loginOrRegister = "Login";
		errorMessage = "";
	}

	const handleLoginSubmit = () => {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				loggedIn = true;
				showLoginModal = false;
				errorMessage = "";
				if (result.data?.username) {
					username = result.data.username;
				}
			} else if (result.type === 'failure') {
				errorMessage = result.data?.error || 'An error occurred';
			}
			await update();
		};
	}

</script>

<nav>
	<a class="title" href="/">{title}</a>
	<div class="section-right">
		<a href="/about">About</a>
		{#if loggedIn}
			<a href="/profile">{username}</a>
		{:else}
			<button onclick={openLoginModal}>Login</button>
		{/if}
	</div>
</nav>

{@render children()}

{#if showLoginModal}
	<div class="modal">
		<div class="modal-title">
			{loginOrRegister}
			<button onclick={() => (showLoginModal = false)}>X</button>
		</div>
		<form method="POST" action="?/{loginOrRegister.toLowerCase()}" use:enhance={handleLoginSubmit}>
			<label for="username">Username:</label>
			<input type="text" id="username" name="username" required />
			{#if loginOrRegister === "Register"}
				<label for="email">Email:</label>
				<input type="email" id="email" name="email" required />
			{/if}
			<label for="password">Password:</label>
			<input type="password" id="password" name="password" required />
			{#if errorMessage}
				<p style="color: red;">{errorMessage}</p>
			{/if}
			<button type="submit">{loginOrRegister}</button>
		</form>
		<div class="modal-footer">
			{#if loginOrRegister === "Login"}
				<p>Don't have an account? <button type="button" onclick={() => { loginOrRegister = "Register"; errorMessage = ""; }}>Register here.</button></p>
			{:else}
				<p>Already have an account? <button type="button" onclick={() => { loginOrRegister = "Login"; errorMessage = ""; }}>Login here.</button></p>
			{/if}
		</div>
	</div>
{/if}

<style>
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 3px solid #eaeaea;
		padding-bottom: 16px;
		margin-bottom: 20px;
	}

	nav a {
		text-decoration: none;
		color: #0070f3;
		font-weight: bold;
	}

	nav a:hover {
		text-decoration: underline;
	}

	nav .title {
		font-size: 1.5em;
	}

	.section-right a,
	.section-right button {
		margin-left: 16px;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		padding: 20px;
		border: 3px solid white;
		border-radius: 8px;
	}

	.modal-title {
		font-size: 1.5em;
		padding-bottom: 8px;
		border-bottom: 3px solid white;
		margin-bottom: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.modal form button {
		align-self: flex-end;
		margin-top: 12px;
	}

	.modal-footer button {
		background: none;
		border: none;
		color: #646cff;
		text-decoration: underline;
		padding: 0;
		cursor: pointer;
	}

	.modal-footer button:hover {
		color: #535bf2;
	}
</style>
