<script lang="ts">
	import { enhance } from '$app/forms';
	
	let { data } = $props();
	let username = $state('');
	let errorMessage = $state('');
</script>

<div class="signup-container">
	<div class="signup-card">
		<div class="header">
			<h1>Complete Your Sign Up</h1>
			<p>You're signing in with Google</p>
		</div>

		<div class="google-info">
			{#if data.picture}
				<img src={data.picture} alt="Profile" class="google-avatar" />
			{:else}
				<div class="google-avatar-placeholder">
					{username ? username.charAt(0).toUpperCase() : (data.email?.charAt(0).toUpperCase() || 'U')}
				</div>
			{/if}
			<div class="info">
				<div class="label">Email</div>
				<div class="value">{data.email}</div>
			</div>
		</div>

		<div class="divider"></div>

		<form 
			method="POST" 
			action="?/completeSignup"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'failure' && result.data) {
						errorMessage = (result.data as { error?: string }).error || 'An error occurred';
					}
					await update();
				};
			}}
		>
			<div class="form-group">
				<label for="username">Choose a Username</label>
				<input 
					type="text" 
					id="username" 
					name="username" 
					bind:value={username}
					placeholder="Enter username" 
					required 
					minlength="3"
					maxlength="20"
				/>
			</div>

			{#if errorMessage}
				<p class="error">{errorMessage}</p>
			{/if}

			<button type="submit" class="submit-btn" disabled={!username.trim()}>
				Complete Sign Up
			</button>
		</form>

		<div class="note">
			<p>Since you're signing in with Google, you won't need a password.</p>
		</div>
	</div>
</div>

<style>
	.signup-container {
		min-height: calc(100vh - 80px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
	}

	.signup-card {
		max-width: 500px;
		width: 100%;
		background: linear-gradient(135deg, rgba(12, 12, 18, 0.95), rgba(8, 8, 12, 0.9));
		backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 212, 255, 0.3);
		border-radius: 24px;
		padding: 40px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 212, 255, 0.1);
		animation: slideUp 0.4s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.header {
		text-align: center;
		margin-bottom: 32px;
	}

	.header h1 {
		font-size: 2rem;
		font-weight: 700;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 8px;
	}

	.header p {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.833rem;
	}

	.google-info {
		display: flex;
		align-items: center;
		gap: 16px;
		background: rgba(0, 212, 255, 0.05);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 16px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.google-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2px solid #00d4ff;
	}

	.google-avatar-placeholder {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 2px solid #00d4ff;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: white;
	}

	.info {
		flex: 1;
	}

	.label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 4px;
	}

	.value {
		font-size: 0.833rem;
		font-weight: 600;
		color: white;
	}

	.divider {
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
		margin: 24px 0;
	}

	.form-group {
		margin-bottom: 24px;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		color: #00d4ff;
		margin-bottom: 8px;
		font-size: 0.833rem;
	}

	.form-group input {
		width: 100%;
		padding: 14px 18px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px solid rgba(0, 212, 255, 0.3);
		border-radius: 12px;
		color: white;
		font-size: 0.833rem;
		transition: all 0.3s;
	}

	.form-group input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: #00d4ff;
		box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
	}

	.submit-btn {
		width: 100%;
		padding: 16px;
		background: linear-gradient(135deg, #00d4ff, #00ffaa);
		border: none;
		border-radius: 12px;
		color: white;
		font-weight: 700;
		font-size: 1.05rem;
		cursor: pointer;
		transition: all 0.3s;
		box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
	}

	.submit-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #00ffaa, #00d4ff);
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.note {
		margin-top: 20px;
		text-align: center;
	}

	.note p {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.error {
		color: #ff3e00;
		font-weight: 600;
		padding: 12px;
		background: rgba(255, 62, 0, 0.1);
		border-radius: 8px;
		border-left: 4px solid #ff3e00;
		margin-bottom: 16px;
	}

	@media (max-width: 600px) {
		.signup-card {
			padding: 16px;
		}

		.header h1 {
			font-size: 1.6rem;
		}
	}
</style>
