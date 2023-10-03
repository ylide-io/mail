import { observer } from 'mobx-react';
import { useMutation } from 'react-query';

import { BlockchainFeedApi, DecodedBlockchainFeedPost } from '../../../../api/blockchainFeedApi';
import { ReactionBadge } from '../../../../components/reactionBadge/reactionBadge';
import { SetReactionFlow } from '../../../../components/setReactionFlow/setReactionFlow';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as SmileSvg } from '../../../../icons/ic20/smile.svg';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { invariant } from '../../../../utils/assert';
import { getAccountsForReaction } from '../../../../utils/reactions';
import css from './postReactions.module.scss';

export interface PostReactionsProps {
	reactionButtonClassName: string;
	post: DecodedBlockchainFeedPost;
	reloadPost: () => Promise<unknown>;
}

export const PostReactions = observer(({ reactionButtonClassName, post, reloadPost }: PostReactionsProps) => {
	const reactionsCountsEntries = Object.entries(post.original.reactionsCounts);

	const setReactionMutation = useMutation({
		mutationFn: async (variables: { reaction: string; account: DomainAccount }) => {
			invariant(variables.account.authKey, 'No auth key');

			await BlockchainFeedApi.setReaction({
				postId: post.msg.msgId,
				reaction: variables.reaction,
				authKey: variables.account.authKey,
			});

			await reloadPost();
		},
		onError: error => {
			toast(`Couldn't set reaction 😟`);
			console.error(error);
		},
	});

	const setReaction = async (reaction: string, account: DomainAccount) => {
		if (setReactionMutation.isLoading || removeReactionMutation.isLoading) return;

		await setReactionMutation.mutateAsync({ reaction, account });
	};

	const removeReactionMutation = useMutation({
		mutationFn: async (variables: { accounts: DomainAccount[] }) => {
			await Promise.all(
				variables.accounts
					.filter(account => account.authKey && post.original.addressReactions[account.account.address])
					.map(account =>
						BlockchainFeedApi.setReaction({
							postId: post.msg.msgId,
							reaction: null,
							authKey: account.authKey,
						}),
					),
			);

			await reloadPost();
		},
		onError: error => {
			toast(`Couldn't remove reaction 😟`);
			console.error(error);
		},
	});

	const removeReaction = async (accounts: DomainAccount[]) => {
		if (setReactionMutation.isLoading || removeReactionMutation.isLoading) return;

		await removeReactionMutation.mutateAsync({ accounts });
	};

	return (
		<>
			<SetReactionFlow onSelect={setReaction}>
				{({ anchorRef, onAnchorClick }) => (
					<button
						ref={anchorRef}
						className={reactionButtonClassName}
						title="Reactions"
						onClick={() => onAnchorClick()}
					>
						{setReactionMutation.isLoading || removeReactionMutation.isLoading ? (
							<Spinner size={16} />
						) : (
							<SmileSvg />
						)}
					</button>
				)}
			</SetReactionFlow>

			{reactionsCountsEntries.length ? (
				<div className={css.reactions}>
					{reactionsCountsEntries.map(([reaction, count]) => {
						const accountsForReaction = getAccountsForReaction(reaction, post.original.addressReactions);

						return accountsForReaction.length ? (
							<ReactionBadge
								reaction={reaction}
								counter={count || 1}
								isActive
								onClick={() => removeReaction(accountsForReaction)}
							/>
						) : (
							<SetReactionFlow key={reaction} initialReaction={reaction} onSelect={setReaction}>
								{({ anchorRef, onAnchorClick }) => (
									<ReactionBadge
										ref={anchorRef}
										reaction={reaction}
										counter={count || 1}
										onClick={onAnchorClick}
									/>
								)}
							</SetReactionFlow>
						);
					})}
				</div>
			) : (
				<div className={css.noReactions}>
					{['❤️', '👍', '🎉'].map(reaction => (
						<SetReactionFlow key={reaction} initialReaction={reaction} onSelect={setReaction}>
							{({ anchorRef, onAnchorClick }) => (
								<ReactionBadge ref={anchorRef} reaction={reaction} onClick={onAnchorClick} />
							)}
						</SetReactionFlow>
					))}
				</div>
			)}
		</>
	);
});
