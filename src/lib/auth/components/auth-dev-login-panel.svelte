<script lang="ts">
	let {
		password,
		accounts,
		isLoading,
		onQuickLogin
	}: {
		password: string;
		accounts: { username: string; label: string }[];
		isLoading: boolean;
		onQuickLogin: (username: string) => void | Promise<void>;
	} = $props();
</script>

<details
	class="mt-6 w-full max-w-[768px] rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-muted-foreground backdrop-blur-sm"
>
	<summary class="cursor-pointer text-xs font-medium text-foreground">
		ورود سریع توسعه — رمز همه: {password}
	</summary>
	<div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
		{#each accounts as account (account.username)}
			<button
				type="button"
				data-testid={`dev-login-${account.username}`}
				class="rounded-xl bg-muted px-3 py-2 text-xs transition-colors duration-200 hover:bg-muted/80"
				onclick={() => onQuickLogin(account.username)}
				disabled={isLoading}
			>
				{account.label} — <span dir="ltr">{account.username}</span>
			</button>
		{/each}
	</div>
</details>
