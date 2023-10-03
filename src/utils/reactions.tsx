import domain from '../stores/Domain';

export function getAccountsForReaction(reaction: string, addressReactions: Record<string, string | undefined>) {
	return domain.accounts.activeAccounts.filter(account =>
		Object.entries(addressReactions).some(([adr, rea]) => adr === account.account.address && rea === reaction),
	);
}
